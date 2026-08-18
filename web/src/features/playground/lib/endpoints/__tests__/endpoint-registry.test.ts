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

import { CORE_ENDPOINTS } from '../../../../docs/content'
import {
  PLAYGROUND_ENDPOINTS,
  PlaygroundEndpointPathError,
  buildEndpointPath,
  getPlaygroundEndpoint,
  isPlaygroundEndpointId,
} from '../endpoint-registry'

describe('playground endpoint registry', () => {
  test('covers every documented core endpoint in documentation order', () => {
    assert.deepEqual(
      PLAYGROUND_ENDPOINTS.map((endpoint) => ({
        method: endpoint.method,
        path: endpoint.pathTemplate,
        category: endpoint.category,
      })),
      CORE_ENDPOINTS
    )
  })

  test('uses unique stable endpoint ids', () => {
    const ids = PLAYGROUND_ENDPOINTS.map((endpoint) => endpoint.id)

    assert.equal(new Set(ids).size, ids.length)
    assert.equal(isPlaygroundEndpointId('responses'), true)
    assert.equal(isPlaygroundEndpointId('unknown-endpoint'), false)
    assert.equal(
      getPlaygroundEndpoint('responses').pathTemplate,
      '/v1/responses'
    )
  })

  test('marks audio transcription as multipart and all other request bodies accurately', () => {
    const multipartEndpoints = PLAYGROUND_ENDPOINTS.filter(
      (endpoint) => endpoint.bodyMode === 'multipart'
    )
    const bodylessEndpoints = PLAYGROUND_ENDPOINTS.filter(
      (endpoint) => endpoint.bodyMode === 'none'
    )

    assert.deepEqual(
      multipartEndpoints.map((endpoint) => endpoint.id),
      ['audio-transcriptions']
    )
    assert.deepEqual(
      bodylessEndpoints.map((endpoint) => endpoint.id),
      ['models']
    )
  })

  test('maps model-discovery capability types to compatible endpoints', () => {
    assert.deepEqual(
      Object.fromEntries(
        PLAYGROUND_ENDPOINTS.map((endpoint) => [
          endpoint.id,
          endpoint.capabilityType,
        ])
      ),
      {
        models: undefined,
        'chat-completions': 'openai',
        responses: 'openai-response',
        'anthropic-messages': 'anthropic',
        'gemini-generate-content': 'gemini',
        embeddings: 'embeddings',
        'image-generations': 'image-generation',
        'audio-transcriptions': undefined,
        rerank: 'jina-rerank',
        videos: 'openai-video',
      }
    )
  })
})

describe('playground endpoint path builder', () => {
  test('returns the registered path for endpoints without a model placeholder', () => {
    assert.equal(
      buildEndpointPath('chat-completions', 'model/with spaces'),
      '/v1/chat/completions'
    )
  })

  test('encodes the model when building a Gemini path', () => {
    assert.equal(
      buildEndpointPath('gemini-generate-content', ' publishers/demo model '),
      '/v1beta/models/publishers%2Fdemo%20model:generateContent'
    )
  })

  test('rejects a blank model when the path contains a model placeholder', () => {
    assert.throws(
      () => buildEndpointPath('gemini-generate-content', '  '),
      (error: unknown) => {
        assert.ok(error instanceof PlaygroundEndpointPathError)
        assert.equal(error.code, 'model_required')
        return true
      }
    )
  })
})
