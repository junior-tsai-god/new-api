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

import { getActiveUsageBillingSection } from '../lib/navigation.ts'

describe('usage and billing navigation', () => {
  test('keeps analytics routes on the usage tab', () => {
    assert.equal(getActiveUsageBillingSection('/dashboard/models'), 'usage')
  })

  test('groups every request-log category under one requests tab', () => {
    assert.equal(getActiveUsageBillingSection('/usage-logs/common'), 'requests')
    assert.equal(getActiveUsageBillingSection('/usage-logs/task'), 'requests')
  })

  test('keeps recharge and order history under billing', () => {
    assert.equal(getActiveUsageBillingSection('/wallet'), 'billing')
  })
})
