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
  createLoginFormDefaults,
  createLoginPrefillState,
  readLoginPrefillUsername,
} from '../login-prefill'

describe('registration login prefill', () => {
  test('carries only the normalized username into navigation state', () => {
    assert.deepEqual(createLoginPrefillState('  alice  '), {
      registrationUsername: 'alice',
    })
    assert.equal(
      Object.hasOwn(createLoginPrefillState('alice') ?? {}, 'password'),
      false
    )
  })

  test('ignores missing or malformed navigation state', () => {
    assert.equal(createLoginPrefillState(), undefined)
    assert.equal(readLoginPrefillUsername(undefined), '')
    assert.equal(readLoginPrefillUsername({ registrationUsername: 42 }), '')
    assert.equal(readLoginPrefillUsername({ password: 'secret' }), '')
  })

  test('initializes the login password as empty when username is prefilled', () => {
    assert.deepEqual(createLoginFormDefaults('alice'), {
      username: 'alice',
      password: '',
    })
    assert.deepEqual(createLoginFormDefaults(), {
      username: '',
      password: '',
    })
  })
})
