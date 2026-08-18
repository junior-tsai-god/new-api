/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'

import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'

import {
  getApiKeyModels,
  getPlaygroundSessionStats,
  sendChatCompletion,
  sendPlaygroundEndpointRequest,
} from '../api'

const originalFetch = globalThis.fetch
const originalApiPost = api.post

function setTestSession() {
  useAuthStore.getState().auth.setBundle({
    access_expires_at: Math.floor(Date.now() / 1000) + 3600,
    access_token: 'session-access-token',
    session: {
      created_at: 1,
      current: true,
      expires_at: 2,
      ip: '127.0.0.1',
      last_active_at: 1,
      login_method: 'password',
      sid: 'session-id',
      user_agent: 'test',
    },
    token_type: 'Bearer',
    user: { id: 7, role: 1, username: 'tester' },
  })
}

afterEach(() => {
  globalThis.fetch = originalFetch
  api.post = originalApiPost
  useAuthStore.getState().auth.reset()
})

test('chat uses the login session and captures its successful request ID', async () => {
  setTestSession()

  let requestedPath = ''
  let requestedInit: RequestInit | undefined
  globalThis.fetch = async (input, init) => {
    requestedPath = String(input)
    requestedInit = init
    return new Response(
      JSON.stringify({
        choices: [
          {
            finish_reason: 'stop',
            index: 0,
            message: { content: 'hello', role: 'assistant' },
          },
        ],
        created: 1,
        id: 'completion-id',
        model: 'test-model',
        object: 'chat.completion',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Oneapi-Request-Id': 'req-nonstream-123',
        },
      }
    )
  }

  let capturedRequestId: string | undefined
  const result = await sendChatCompletion(
    {
      messages: [{ content: 'hello', role: 'user' }],
      model: 'test-model',
      stream: false,
    },
    42,
    undefined,
    (requestId) => {
      capturedRequestId = requestId
    }
  )

  const headers = new Headers(requestedInit?.headers)
  assert.equal(requestedPath, '/pg/chat/completions')
  assert.equal(headers.get('Authorization'), 'Bearer session-access-token')
  assert.equal(headers.get('X-Playground-Token-Id'), '42')
  assert.equal(requestedInit?.credentials, 'include')
  assert.equal(capturedRequestId, 'req-nonstream-123')
  assert.equal(result.requestId, 'req-nonstream-123')
  assert.equal(result.data.choices[0]?.message.content, 'hello')
})

test('chat does not record a rejected request in session usage', async () => {
  setTestSession()
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: { message: 'overloaded' } }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Oneapi-Request-Id': 'rejected-request',
      },
      status: 503,
    })

  let capturedRequestId: string | undefined
  await assert.rejects(
    sendChatCompletion(
      {
        messages: [{ content: 'hello', role: 'user' }],
        model: 'test-model',
        stream: false,
      },
      42,
      undefined,
      (requestId) => {
        capturedRequestId = requestId
      }
    ),
    /overloaded/
  )

  assert.equal(capturedRequestId, undefined)
})

test('playground model discovery preserves endpoint capabilities', async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        data: [
          {
            id: 'gemini-3.5-flash',
            supported_endpoint_types: ['gemini', 'openai'],
          },
        ],
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  const models = await getApiKeyModels('test-key')

  assert.deepEqual(models, [
    {
      label: 'gemini-3.5-flash',
      supportedEndpointTypes: ['gemini', 'openai'],
      value: 'gemini-3.5-flash',
    },
  ])
})

test('endpoint requests use the selected API key and expose the raw response', async () => {
  let requestedPath = ''
  let requestedInit: RequestInit | undefined
  globalThis.fetch = async (input, init) => {
    requestedPath = String(input)
    requestedInit = init
    return new Response(JSON.stringify({ data: [{ embedding: [0.1] }] }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  }

  const result = await sendPlaygroundEndpointRequest({
    auth: { apiKey: 'selected-key' },
    body: '{"model":"embed-model","input":"hello"}',
    endpointId: 'embeddings',
    model: 'embed-model',
  })

  assert.equal(requestedPath, '/v1/embeddings')
  assert.equal(
    new Headers(requestedInit?.headers).get('Authorization'),
    'Bearer selected-key'
  )
  assert.equal(requestedInit?.method, 'POST')
  assert.equal(requestedInit?.body, '{"model":"embed-model","input":"hello"}')
  assert.equal(result.status, 200)
  assert.equal(result.ok, true)
  assert.match(result.body, /"embedding": \[/)
})

test('session stats retain and aggregate conversations longer than 200 requests', async () => {
  const requestedBatchSizes: number[] = []
  api.post = (async (_url: string, body: { request_ids: string[] }) => {
    requestedBatchSizes.push(body.request_ids.length)
    const isFirstBatch = requestedBatchSizes.length === 1
    return {
      data: {
        data: {
          cache_hit_rate: isFirstBatch ? 0.2 : 0.6,
          cache_read_tokens: isFirstBatch ? 20 : 30,
          cache_write_tokens: isFirstBatch ? 4 : 6,
          cached_tokens: isFirstBatch ? 20 : 30,
          cost_usd: isFirstBatch ? 0.1 : 0.2,
          input_tokens: isFirstBatch ? 100 : 50,
          output_tokens: isFirstBatch ? 40 : 10,
          quota: isFirstBatch ? 100 : 200,
          requested_request_count: body.request_ids.length,
          settled: true,
          settled_request_count: body.request_ids.length,
          total_tokens: isFirstBatch ? 140 : 60,
        },
        success: true,
      },
    }
  }) as typeof api.post

  const stats = await getPlaygroundSessionStats(
    Array.from({ length: 201 }, (_, index) => `request-${index}`)
  )

  assert.deepEqual(requestedBatchSizes, [200, 1])
  assert.equal(stats.requested_request_count, 201)
  assert.equal(stats.settled_request_count, 201)
  assert.equal(stats.total_tokens, 200)
  assert.equal(stats.cached_tokens, 50)
  assert.equal(stats.cache_hit_rate, 50 / 150)
  assert.equal(stats.cost_usd, 0.30000000000000004)
})
