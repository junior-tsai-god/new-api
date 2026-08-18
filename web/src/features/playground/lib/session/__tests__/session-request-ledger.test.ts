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

import { appendSessionRequestId } from '../session-request-ledger.ts'

describe('playground session request ledger', () => {
  test('deduplicates completed request IDs without changing their order', () => {
    const requestIds = appendSessionRequestId(
      ['req-first', 'req-second'],
      ' req-first '
    )

    assert.deepEqual(requestIds, ['req-first', 'req-second'])
  })

  test('ignores empty IDs without dropping earlier requests', () => {
    const initial = Array.from({ length: 200 }, (_, index) => `req-${index}`)

    assert.equal(appendSessionRequestId(initial, '  '), initial)
    assert.deepEqual(appendSessionRequestId(initial, 'req-new'), [
      ...initial,
      'req-new',
    ])
  })
})
