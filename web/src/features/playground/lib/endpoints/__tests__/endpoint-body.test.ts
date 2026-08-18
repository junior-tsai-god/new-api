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
import { describe, test } from 'node:test'

import {
  PlaygroundEndpointBodyError,
  createDefaultEndpointBody,
  parseEndpointBody,
  validateEndpointBody,
} from '../endpoint-body'
import type { PlaygroundEndpointId } from '../endpoint-registry'

describe('playground default endpoint bodies', () => {
  test('keeps the models GET request body empty', () => {
    assert.equal(createDefaultEndpointBody('models', 'unused-model'), '')
    assert.equal(parseEndpointBody('models', '  '), null)
  })

  test('places the selected model in model-body protocols', () => {
    const endpointIds: PlaygroundEndpointId[] = [
      'chat-completions',
      'responses',
      'anthropic-messages',
      'embeddings',
      'image-generations',
      'audio-transcriptions',
      'rerank',
      'videos',
    ]

    for (const endpointId of endpointIds) {
      const source = createDefaultEndpointBody(endpointId, ' selected-model ')
      const body = parseEndpointBody(endpointId, source)

      assert.equal(body?.model, 'selected-model', endpointId)
    }
  })

  test('keeps the Gemini model in the path instead of duplicating it in the body', () => {
    const source = createDefaultEndpointBody(
      'gemini-generate-content',
      'gemini-model'
    )
    const body = parseEndpointBody('gemini-generate-content', source)

    assert.equal('model' in (body ?? {}), false)
    assert.deepEqual(body?.contents, [
      {
        role: 'user',
        parts: [{ text: 'Give me one practical API integration tip.' }],
      },
    ])
  })

  test('creates protocol-shaped defaults for chat, rerank, and video requests', () => {
    const chatBody = parseEndpointBody(
      'chat-completions',
      createDefaultEndpointBody('chat-completions', 'chat-model')
    )
    const rerankBody = parseEndpointBody(
      'rerank',
      createDefaultEndpointBody('rerank', 'rerank-model')
    )
    const videoBody = parseEndpointBody(
      'videos',
      createDefaultEndpointBody('videos', 'video-model')
    )

    assert.deepEqual(chatBody?.messages, [
      {
        role: 'user',
        content: 'Explain what this model can do in one sentence.',
      },
    ])
    assert.ok(Array.isArray(rerankBody?.documents))
    assert.equal(rerankBody?.top_n, 2)
    assert.equal(videoBody?.seconds, '4')
    assert.equal(videoBody?.size, '1280x720')
  })
})

describe('playground endpoint body validation', () => {
  test('parses a JSON object without changing provider-specific fields', () => {
    const body = parseEndpointBody(
      'responses',
      '{"model":"demo","provider_option":{"enabled":true}}'
    )

    assert.deepEqual(body, {
      model: 'demo',
      provider_option: { enabled: true },
    })
  })

  test('reports malformed JSON with a stable error code', () => {
    const result = validateEndpointBody('responses', '{"model":')

    assert.deepEqual(result, {
      valid: false,
      code: 'invalid_json',
      message: 'Request body is not valid JSON',
    })
  })

  test('rejects an empty body for endpoints that require request data', () => {
    assert.throws(
      () => parseEndpointBody('embeddings', '  '),
      (error: unknown) => {
        assert.ok(error instanceof PlaygroundEndpointBodyError)
        assert.equal(error.code, 'body_required')
        return true
      }
    )
  })

  test('rejects arrays, null, and scalar JSON values', () => {
    for (const source of ['[]', 'null', '"text"', '42', 'true']) {
      const result = validateEndpointBody('chat-completions', source)

      assert.equal(result.valid, false, source)
      if (!result.valid) {
        assert.equal(result.code, 'body_must_be_object', source)
      }
    }
  })

  test('rejects a request body for a bodyless GET endpoint', () => {
    const result = validateEndpointBody('models', '{}')

    assert.equal(result.valid, false)
    if (!result.valid) {
      assert.equal(result.code, 'body_not_supported')
    }
  })
})
