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
  buildRequestArchiveParams,
  canAccessRequestArchives,
  formatRequestArchiveBytes,
  formatRequestArchiveCredential,
  formatRequestArchiveDuration,
  getRequestArchiveStatusVariant,
} from '../request-archive.ts'

describe('request archive access and filters', () => {
  test('only administrators can access archived request content', () => {
    const adminRole = 10
    assert.equal(canAccessRequestArchives(undefined, adminRole), false)
    assert.equal(canAccessRequestArchives(1, adminRole), false)
    assert.equal(canAccessRequestArchives(10, adminRole), true)
    assert.equal(canAccessRequestArchives(100, adminRole), true)
  })

  test('maps URL filters to the backend query contract', () => {
    assert.deepEqual(
      buildRequestArchiveParams({
        page: 3,
        pageSize: 50,
        search: {
          username: ' alice ',
          model: ' gpt-5.6 ',
          requestId: ' req_123 ',
          path: ' /v1/responses ',
          statusCode: 429,
          startTime: 1_710_000_000_999,
          endTime: 1_710_000_999_001,
        },
      }),
      {
        p: 3,
        page_size: 50,
        username: 'alice',
        model_name: 'gpt-5.6',
        request_id: 'req_123',
        path: '/v1/responses',
        status_code: 429,
        start_timestamp: 1_710_000_000,
        end_timestamp: 1_710_000_999,
      }
    )
  })
})

describe('request archive presentation', () => {
  test('uses semantic HTTP status variants', () => {
    assert.equal(getRequestArchiveStatusVariant(200), 'success')
    assert.equal(getRequestArchiveStatusVariant(302), 'warning')
    assert.equal(getRequestArchiveStatusVariant(429), 'danger')
  })

  test('formats captured sizes and durations without losing units', () => {
    assert.equal(formatRequestArchiveBytes(512), '512 B')
    assert.equal(formatRequestArchiveBytes(1536), '1.50 KB')
    assert.equal(formatRequestArchiveDuration(325), '325 ms')
    assert.equal(formatRequestArchiveDuration(1250), '1.25 s')
  })

  test('labels session-authenticated playground requests without a fake key id', () => {
    assert.equal(
      formatRequestArchiveCredential(
        { token_id: 0, token_name: '' },
        'Session'
      ),
      'Session'
    )
    assert.equal(
      formatRequestArchiveCredential(
        { token_id: 42, token_name: 'debug-key' },
        'Session'
      ),
      'debug-key'
    )
  })
})
