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

import { resolveApiKeyGroup } from '../api-key-form'

const groups = [{ value: 'vip' }, { value: 'default' }]

describe('API key group defaults', () => {
  test('selects default when a new key has no explicit group', () => {
    assert.equal(resolveApiKeyGroup('', groups), 'default')
  })

  test('preserves an available explicit group', () => {
    assert.equal(resolveApiKeyGroup('vip', groups), 'vip')
  })

  test('falls back to default when the configured group is unavailable', () => {
    assert.equal(resolveApiKeyGroup('removed', groups), 'default')
  })
})
