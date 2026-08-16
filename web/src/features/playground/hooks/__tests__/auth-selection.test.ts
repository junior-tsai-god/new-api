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
  normalizeApiKeySecret,
  selectPlaygroundApiKey,
} from '../use-playground-auth'

describe('playground API key normalization', () => {
  test('adds the public token prefix only when the backend omits it', () => {
    assert.equal(normalizeApiKeySecret('stored-secret'), 'sk-stored-secret')
    assert.equal(
      normalizeApiKeySecret('sk-complete-secret'),
      'sk-complete-secret'
    )
  })
})

describe('playground API key selection', () => {
  const apiKeys = [
    { id: 11, name: 'Primary' },
    { id: 7, name: 'Backup' },
  ]

  test('uses the first enabled key when no saved selection exists', () => {
    assert.equal(selectPlaygroundApiKey(apiKeys, null)?.id, 11)
  })

  test('keeps an available saved key and replaces a stale selection', () => {
    assert.equal(selectPlaygroundApiKey(apiKeys, 7)?.id, 7)
    assert.equal(selectPlaygroundApiKey(apiKeys, 99)?.id, 11)
  })

  test('returns null when the user has no enabled keys', () => {
    assert.equal(selectPlaygroundApiKey([], 7), null)
  })
})
