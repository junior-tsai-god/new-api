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

import { LOG_TYPE_ENUM } from '../../constants.ts'
import {
  getLogTypeFiltersForScope,
  isLogTypeAllowedForScope,
} from '../log-scope.ts'

describe('log scope filters', () => {
  test('request logs only offer real API request outcomes', () => {
    assert.deepEqual(
      getLogTypeFiltersForScope('request').map((item) => Number(item.value)),
      [0, LOG_TYPE_ENUM.CONSUME, LOG_TYPE_ENUM.ERROR]
    )
  })

  test('account activity excludes API consume and error records', () => {
    assert.deepEqual(
      getLogTypeFiltersForScope('activity').map((item) => Number(item.value)),
      [
        0,
        LOG_TYPE_ENUM.TOPUP,
        LOG_TYPE_ENUM.MANAGE,
        LOG_TYPE_ENUM.SYSTEM,
        LOG_TYPE_ENUM.REFUND,
        LOG_TYPE_ENUM.LOGIN,
      ]
    )
  })

  test('rejects a concrete type outside the active scope', () => {
    assert.equal(
      isLogTypeAllowedForScope('request', LOG_TYPE_ENUM.TOPUP),
      false
    )
    assert.equal(
      isLogTypeAllowedForScope('activity', LOG_TYPE_ENUM.ERROR),
      false
    )
    assert.equal(
      isLogTypeAllowedForScope('request', LOG_TYPE_ENUM.UNKNOWN),
      true
    )
  })
})
