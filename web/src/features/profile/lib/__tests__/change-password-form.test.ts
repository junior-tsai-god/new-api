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

import { changePasswordFormSchema } from '../change-password-form'

const validValues = {
  originalPassword: 'current-pass',
  newPassword: 'updated-pass',
  confirmPassword: 'updated-pass',
}

describe('change password form validation', () => {
  test('accepts a different matching password between 8 and 20 characters', () => {
    assert.equal(changePasswordFormSchema.safeParse(validValues).success, true)
  })

  test('rejects a new password shorter than 8 characters', () => {
    const result = changePasswordFormSchema.safeParse({
      ...validValues,
      newPassword: 'short',
      confirmPassword: 'short',
    })

    assert.equal(result.success, false)
    if (result.success) return
    assert.equal(
      result.error.issues[0]?.message,
      'Password must be at least 8 characters'
    )
  })

  test('rejects a new password longer than 20 characters', () => {
    const longPassword = 'a'.repeat(21)
    const result = changePasswordFormSchema.safeParse({
      ...validValues,
      newPassword: longPassword,
      confirmPassword: longPassword,
    })

    assert.equal(result.success, false)
    if (result.success) return
    assert.equal(
      result.error.issues[0]?.message,
      'Password must be at most 20 characters long'
    )
  })

  test('rejects reusing the current password', () => {
    const result = changePasswordFormSchema.safeParse({
      ...validValues,
      newPassword: validValues.originalPassword,
      confirmPassword: validValues.originalPassword,
    })

    assert.equal(result.success, false)
    if (result.success) return
    assert.equal(
      result.error.issues[0]?.message,
      'New password must be different from current password'
    )
  })

  test('rejects a confirmation that does not match the new password', () => {
    const result = changePasswordFormSchema.safeParse({
      ...validValues,
      confirmPassword: 'different-pass',
    })

    assert.equal(result.success, false)
    if (result.success) return
    assert.equal(result.error.issues[0]?.message, 'Passwords do not match')
  })
})
