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
import { beforeEach, describe, test } from 'node:test'

import { STORAGE_KEYS } from '../../../constants'
import type { Message } from '../../../types'
import {
  clearLegacyPlaygroundData,
  clearPlaygroundData,
  loadConfig,
  loadMessages,
  loadParameterEnabled,
  loadSessionRequestIds,
  saveConfig,
  saveMessages,
  saveParameterEnabled,
  saveSessionRequestIds,
} from '../storage'

class MemoryStorage {
  private readonly data = new Map<string, string>()

  get length(): number {
    return this.data.size
  }

  clear(): void {
    this.data.clear()
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }
}

const storage = new MemoryStorage()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: storage,
})

function createMessage(key: string, content: string): Message {
  return {
    key,
    from: 'user',
    versions: [{ id: `${key}-v1`, content }],
    status: 'complete',
  }
}

beforeEach(() => {
  storage.clear()
})

describe('playground user storage isolation', () => {
  test('keeps messages, endpoint, key selection, model, and parameters separated by user', () => {
    const aliceMessage = createMessage('alice-message', 'private from alice')
    const bobMessage = createMessage('bob-message', 'private from bob')

    saveConfig(11, {
      api_key_id: 101,
      endpoint_id: 'responses',
      model: 'alice-model',
    })
    saveParameterEnabled(11, { temperature: true })
    saveMessages(11, [aliceMessage])
    saveSessionRequestIds(11, ['req-alice'])

    saveConfig(22, {
      api_key_id: 202,
      endpoint_id: 'embeddings',
      model: 'bob-model',
    })
    saveParameterEnabled(22, { temperature: false })
    saveMessages(22, [bobMessage])
    saveSessionRequestIds(22, ['req-bob'])

    assert.deepEqual(loadConfig(11), {
      api_key_id: 101,
      endpoint_id: 'responses',
      model: 'alice-model',
    })
    assert.deepEqual(loadParameterEnabled(11), { temperature: true })
    assert.deepEqual(loadMessages(11), [aliceMessage])
    assert.deepEqual(loadSessionRequestIds(11), ['req-alice'])

    assert.deepEqual(loadConfig(22), {
      api_key_id: 202,
      endpoint_id: 'embeddings',
      model: 'bob-model',
    })
    assert.deepEqual(loadParameterEnabled(22), { temperature: false })
    assert.deepEqual(loadMessages(22), [bobMessage])
    assert.deepEqual(loadSessionRequestIds(22), ['req-bob'])
  })

  test('discards ownerless legacy data instead of assigning it to the next user', () => {
    storage.setItem(
      STORAGE_KEYS.MESSAGES,
      JSON.stringify({
        version: 1,
        data: [createMessage('legacy-message', 'unknown owner')],
      })
    )
    storage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify({ model: 'legacy' }))

    clearLegacyPlaygroundData()

    assert.equal(storage.getItem(STORAGE_KEYS.MESSAGES), null)
    assert.equal(storage.getItem(STORAGE_KEYS.CONFIG), null)
    assert.equal(loadMessages(22), null)
    assert.deepEqual(loadConfig(22), {})
  })

  test('does not persist playground data without an authenticated user', () => {
    saveConfig(undefined, { api_key_id: 101, model: 'ownerless-model' })
    saveParameterEnabled(undefined, { temperature: true })
    saveMessages(undefined, [createMessage('ownerless-message', 'private')])
    saveSessionRequestIds(undefined, ['ownerless-request'])

    assert.equal(storage.length, 0)
  })

  test('clears one user without deleting another user data', () => {
    const aliceMessage = createMessage('alice-message', 'alice')
    const bobMessage = createMessage('bob-message', 'bob')
    saveMessages(11, [aliceMessage])
    saveMessages(22, [bobMessage])
    saveSessionRequestIds(11, ['req-alice'])
    saveSessionRequestIds(22, ['req-bob'])

    clearPlaygroundData(11)

    assert.equal(loadMessages(11), null)
    assert.deepEqual(loadSessionRequestIds(11), [])
    assert.deepEqual(loadMessages(22), [bobMessage])
    assert.deepEqual(loadSessionRequestIds(22), ['req-bob'])
  })
})
