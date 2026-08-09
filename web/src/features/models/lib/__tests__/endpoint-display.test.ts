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
import { test } from 'node:test'

import { formatEndpointsDisplay } from '../model-utils'

test('runtime endpoint types display actionable request routes', () => {
  assert.deepEqual(
    formatEndpointsDisplay(
      '["openai","anthropic","openai-response-compact","openai-video"]'
    ),
    [
      'POST /v1/chat/completions',
      'POST /v1/messages',
      'POST /v1/responses/compact',
      'POST /v1/videos',
    ]
  )
})

test('saved endpoint configurations display their configured method and path', () => {
  assert.deepEqual(
    formatEndpointsDisplay(
      '{"custom":{"method":"post","path":"/v2/infer"},"openai":{"method":"POST","path":"/compatible/chat"}}'
    ),
    ['POST /v2/infer', 'POST /compatible/chat']
  )
})
