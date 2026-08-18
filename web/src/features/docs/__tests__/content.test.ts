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
  CORE_ENDPOINTS,
  createDocsCodeSamples,
  DOCS_INTERNAL_LINKS,
  DOCS_SECTION_IDS,
} from '../content.ts'

describe('self-contained usage documentation', () => {
  test('covers the complete first-request and troubleshooting path', () => {
    assert.deepEqual(DOCS_SECTION_IDS, [
      'quick-start',
      'authentication',
      'models',
      'chat-completions',
      'responses',
      'prompt-caching',
      'streaming',
      'native-protocols',
      'reference',
      'troubleshooting',
    ])
    assert.deepEqual(DOCS_INTERNAL_LINKS, [
      '/keys',
      '/model-catalog',
      '/playground',
      '/usage-logs',
    ])
  })

  test('documents the relay routes implemented by the gateway', () => {
    assert.deepEqual(
      CORE_ENDPOINTS.map((endpoint) => `${endpoint.method} ${endpoint.path}`),
      [
        'GET /v1/models',
        'POST /v1/chat/completions',
        'POST /v1/responses',
        'POST /v1/messages',
        'POST /v1beta/models/{model}:generateContent',
        'POST /v1/embeddings',
        'POST /v1/images/generations',
        'POST /v1/audio/transcriptions',
        'POST /v1/rerank',
        'POST /v1/videos',
      ]
    )
  })

  test('builds local gateway examples without external documentation URLs', () => {
    const samples = createDocsCodeSamples('https://gateway.example/')

    for (const sample of Object.values(samples)) {
      assert.match(sample, /https:\/\/gateway\.example/)
      assert.doesNotMatch(sample, /platform\.openai\.com|docs\.[^/\s]+/i)
    }
  })

  test('documents explicit prompt cache configuration for supported protocols', () => {
    const samples = createDocsCodeSamples('https://gateway.example')

    assert.match(samples.cacheChat, /"prompt_cache_key": "support-kb-v1"/)
    assert.match(samples.cacheResponses, /"prompt_cache_key": "support-kb-v1"/)
    assert.match(
      samples.cacheAnthropic,
      /"cache_control": \{ "type": "ephemeral" \}/
    )
    for (const sample of [
      samples.cacheChat,
      samples.cacheResponses,
      samples.cacheAnthropic,
    ]) {
      assert.match(sample, /AIVANTA_API_KEY/)
    }
  })
})
