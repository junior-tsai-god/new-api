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
import { toIntlLocale } from '@/i18n/languages'

import type {
  ModelProbeStatus,
  ModelStatusHistorySlot,
  ModelStatusItem,
} from '../types'

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

export function filterModelStatusItems(
  models: ModelStatusItem[],
  search: string,
  status: ModelProbeStatus | 'all'
): ModelStatusItem[] {
  const normalizedSearch = search.trim().toLocaleLowerCase()
  return models.filter((model) => {
    if (status !== 'all' && model.status !== status) return false
    if (!normalizedSearch) return true
    return [model.model_name, model.vendor_name]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLocaleLowerCase().includes(normalizedSearch))
  })
}

export function formatProbeCountdown(nextProbeAt: number, now: number): string {
  const remainingMinutes = Math.max(
    0,
    Math.ceil((nextProbeAt * 1000 - now) / 60_000)
  )
  const hours = Math.floor(remainingMinutes / 60)
  const minutes = remainingMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function formatModelStatusCheckedAt(
  timestamp: number,
  language?: string | null
): string {
  return new Intl.DateTimeFormat(toIntlLocale(language), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp * 1000)
}
