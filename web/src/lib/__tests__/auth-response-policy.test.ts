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

import type { QueryClient } from '@tanstack/react-query'

import {
  beginIntentionalSignOut,
  isIntentionalSignOutInProgress,
  shouldSilenceUnauthorizedResponse,
} from '../auth-response-policy.ts'
import { runIntentionalSignOut } from '../auth-session.ts'

describe('authentication response policy', () => {
  test('silences a concurrent unauthorized response during intentional sign-out', () => {
    assert.equal(
      shouldSilenceUnauthorizedResponse({
        signOutInProgress: true,
        requestSessionSID: 'session-a',
        currentSessionSID: 'session-a',
      }),
      true
    )
  })

  test('silences a late response from a session that has already been cleared', () => {
    assert.equal(
      shouldSilenceUnauthorizedResponse({
        signOutInProgress: false,
        requestSessionSID: 'session-a',
      }),
      true
    )
  })

  test('silences an old session response after another user signs in', () => {
    assert.equal(
      shouldSilenceUnauthorizedResponse({
        signOutInProgress: false,
        requestSessionSID: 'session-a',
        currentSessionSID: 'session-b',
      }),
      true
    )
  })

  test('keeps a real unauthorized response on the active session visible', () => {
    assert.equal(
      shouldSilenceUnauthorizedResponse({
        signOutInProgress: false,
        requestSessionSID: 'session-a',
        currentSessionSID: 'session-a',
      }),
      false
    )
  })

  test('does not classify an anonymous request as a stale authenticated request', () => {
    assert.equal(
      shouldSilenceUnauthorizedResponse({
        signOutInProgress: false,
      }),
      false
    )
  })

  test('tracks the intentional sign-out window until every owner releases it', () => {
    const finishFirst = beginIntentionalSignOut()
    const finishSecond = beginIntentionalSignOut()

    assert.equal(isIntentionalSignOutInProgress(), true)
    finishFirst()
    assert.equal(isIntentionalSignOutInProgress(), true)
    finishSecond()
    assert.equal(isIntentionalSignOutInProgress(), false)

    finishSecond()
    assert.equal(isIntentionalSignOutInProgress(), false)
  })
})

describe('intentional sign-out coordination', () => {
  test('cancels background queries before terminating the session', async () => {
    const sequence: string[] = []
    const queryClient = {
      cancelQueries: async () => {
        sequence.push('cancel queries')
      },
      refetchQueries: async () => undefined,
    } as unknown as QueryClient

    await runIntentionalSignOut(queryClient, async () => {
      sequence.push('terminate session')
      assert.equal(isIntentionalSignOutInProgress(), true)
    })

    assert.deepEqual(sequence, ['cancel queries', 'terminate session'])
    assert.equal(isIntentionalSignOutInProgress(), false)
  })

  test('releases sign-out state and restores active queries after failure', async () => {
    let refetchCount = 0
    const queryClient = {
      cancelQueries: async () => undefined,
      refetchQueries: async () => {
        refetchCount += 1
      },
    } as unknown as QueryClient

    await assert.rejects(
      runIntentionalSignOut(queryClient, async () => {
        throw new Error('logout failed')
      }),
      /logout failed/
    )
    await Promise.resolve()

    assert.equal(isIntentionalSignOutInProgress(), false)
    assert.equal(refetchCount, 1)
  })
})
