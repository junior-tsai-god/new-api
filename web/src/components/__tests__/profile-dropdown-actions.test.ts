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

import { getProfileDropdownActions } from '../profile-dropdown-actions'

describe('profile dropdown account actions', () => {
  test('offers a direct password change action to regular users', () => {
    assert.deepEqual(getProfileDropdownActions(false), [
      { id: 'profile', labelKey: 'Profile' },
      { id: 'change-password', labelKey: 'Change Password' },
    ])
  })

  test('keeps the password action visible alongside administration', () => {
    assert.deepEqual(getProfileDropdownActions(true), [
      { id: 'profile', labelKey: 'Profile' },
      { id: 'change-password', labelKey: 'Change Password' },
      { id: 'administration', labelKey: 'Administration' },
    ])
  })
})
