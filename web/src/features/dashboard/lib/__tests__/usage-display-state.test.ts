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

import { getUsageDisplayState } from '../usage-display-state'

describe('usage display state', () => {
  test('keeps loading distinct from an empty result', () => {
    assert.equal(getUsageDisplayState('loading', []), 'loading')
  })

  test('keeps request failures distinct from an empty result', () => {
    assert.equal(getUsageDisplayState('error', []), 'error')
  })

  test('treats zero-value aggregate rows as no API calls', () => {
    assert.equal(
      getUsageDisplayState('ready', [{ count: 0 }, { count: 0 }]),
      'empty'
    )
  })

  test('shows charts once at least one API call exists', () => {
    assert.equal(
      getUsageDisplayState('ready', [{ count: 0 }, { count: 1 }]),
      'ready'
    )
  })
})
