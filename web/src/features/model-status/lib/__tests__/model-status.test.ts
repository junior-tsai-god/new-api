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

import type { ModelStatusItem } from '../../types'
import {
  createModelStatusHistorySlots,
  filterModelStatusItems,
  formatProbeCountdown,
  MODEL_STATUS_HISTORY_SLOT_COUNT,
} from '../model-status.ts'

const modelFixture: ModelStatusItem = {
  model_name: 'gpt-5.6',
  vendor_name: 'OpenAI',
  supported_endpoint_types: ['openai-response'],
  status: 'healthy',
  latency_ms: 320,
  healthy_channels: 2,
  total_channels: 2,
  availability_7d: 100,
  availability_samples_7d: 1,
  last_checked_at: 100,
  history: [
    {
      batch_id: 'probe-1',
      status: 'healthy',
      latency_ms: 320,
      healthy_channels: 2,
      total_channels: 2,
      checked_at: 100,
    },
  ],
}

describe('model status history rail', () => {
  test('pads the left side to sixty slots while keeping newest probes on the right', () => {
    const slots = createModelStatusHistorySlots(modelFixture.history)

    assert.equal(slots.length, MODEL_STATUS_HISTORY_SLOT_COUNT)
    assert.equal(slots[0].status, 'unknown')
    assert.equal(slots.at(-1)?.batch_id, 'probe-1')
  })

  test('keeps only the most recent sixty probes when more history is returned', () => {
    const history = Array.from({ length: 62 }, (_, index) => ({
      ...modelFixture.history[0],
      batch_id: `probe-${index}`,
      checked_at: index,
    }))

    const slots = createModelStatusHistorySlots(history)

    assert.equal(slots[0].batch_id, 'probe-2')
    assert.equal(slots.at(-1)?.batch_id, 'probe-61')
  })
})

describe('model status filters', () => {
  test('matches vendor search and status together', () => {
    const result = filterModelStatusItems(
      [modelFixture, { ...modelFixture, model_name: 'wan2.7', status: 'down' }],
      'openai',
      'healthy'
    )

    assert.deepEqual(
      result.map((model) => model.model_name),
      ['gpt-5.6']
    )
  })
})

test('probe countdown clamps elapsed schedules to zero', () => {
  assert.equal(formatProbeCountdown(100, 101_000), '00:00')
  assert.equal(formatProbeCountdown(3_700, 100_000), '01:00')
})
