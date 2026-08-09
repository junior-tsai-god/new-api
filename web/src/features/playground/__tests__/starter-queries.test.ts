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

import { PLAYGROUND_STARTER_QUERY_KEYS } from '../constants.ts'

describe('playground starter queries', () => {
  test('provides one complete, directly sendable query for each original category', () => {
    const queries = Object.values(PLAYGROUND_STARTER_QUERY_KEYS)

    assert.equal(queries.length, 4)
    assert.deepEqual(Object.keys(PLAYGROUND_STARTER_QUERY_KEYS), [
      'ANALYZE_DATA',
      'SUMMARIZE_TEXT',
      'CODE',
      'GET_ADVICE',
    ])

    for (const query of queries) {
      assert.ok(query.split(/\s+/).length >= 10)
      assert.match(query, /[.!?]$/)
    }
  })
})
