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
import type { ModelStatusHistorySlot, ModelStatusItem } from '../types'

export const MODEL_STATUS_HISTORY_SLOT_COUNT = 60

export function createModelStatusHistorySlots(
  history: ModelStatusItem['history'],
  slotCount = MODEL_STATUS_HISTORY_SLOT_COUNT
): ModelStatusHistorySlot[] {
  const recentHistory = history.slice(-slotCount)
  const missingCount = Math.max(0, slotCount - recentHistory.length)
  const placeholders: ModelStatusHistorySlot[] = Array.from(
    { length: missingCount },
    (_, index) => ({
      batch_id: `unknown-${index}`,
      status: 'unknown',
      checked_at: 0,
    })
  )
  return [...placeholders, ...recentHistory]
}

export function createModelStatusMap(
  models: ModelStatusItem[]
): Map<string, ModelStatusItem> {
  return new Map(models.map((model) => [model.model_name, model]))
}
