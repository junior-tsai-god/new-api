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

import { getPlaygroundScrollPolicy } from '../scroll-policy'

describe('playground initial scroll policy', () => {
  test('keeps the loading state at the top', () => {
    assert.deepEqual(getPlaygroundScrollPolicy(true, 0), {
      key: 'loading',
      initial: false,
    })
  })

  test('keeps a new empty conversation at the top', () => {
    assert.deepEqual(getPlaygroundScrollPolicy(false, 0), {
      key: 'empty',
      initial: false,
    })
  })

  test('remounts populated conversations with bottom tracking enabled', () => {
    assert.deepEqual(getPlaygroundScrollPolicy(false, 2), {
      key: 'messages',
      initial: 'smooth',
    })
  })
})
