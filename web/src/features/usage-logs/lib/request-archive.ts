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
import type { StatusVariant } from '@/components/status-badge'

import type { GetRequestArchivesParams, RequestArchiveRecord } from '../types'

interface BuildRequestArchiveParamsOptions {
  page: number
  pageSize: number
  search: Record<string, unknown>
}

export function canAccessRequestArchives(
  userRole: number | undefined,
  adminRole: number
): boolean {
  return typeof userRole === 'number' && userRole >= adminRole
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  return normalized || undefined
}

function timestampToSeconds(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.floor(value / 1000)
    : undefined
}

export function buildRequestArchiveParams({
  page,
  pageSize,
  search,
}: BuildRequestArchiveParamsOptions): GetRequestArchivesParams {
  const hasExplicitTimeRange =
    search.startTime != null || search.endTime != null
  const now = new Date()
  const defaultStart = new Date(now)
  defaultStart.setHours(0, 0, 0, 0)
  const defaultEnd = new Date(now.getTime() + 60 * 60 * 1000)
  const statusCode =
    typeof search.statusCode === 'number' &&
    Number.isInteger(search.statusCode) &&
    search.statusCode >= 100 &&
    search.statusCode <= 599
      ? search.statusCode
      : undefined

  return {
    p: page,
    page_size: pageSize,
    username: optionalString(search.username),
    model_name: optionalString(search.model),
    request_id: optionalString(search.requestId),
    path: optionalString(search.path),
    status_code: statusCode,
    start_timestamp:
      timestampToSeconds(search.startTime) ??
      (!hasExplicitTimeRange
        ? Math.floor(defaultStart.getTime() / 1000)
        : undefined),
    end_timestamp:
      timestampToSeconds(search.endTime) ??
      (!hasExplicitTimeRange
        ? Math.floor(defaultEnd.getTime() / 1000)
        : undefined),
  }
}

export function getRequestArchiveStatusVariant(
  statusCode: number
): StatusVariant {
  if (statusCode >= 200 && statusCode < 300) return 'success'
  if (statusCode >= 400) return 'danger'
  if (statusCode >= 300) return 'warning'
  return 'neutral'
}

export function formatRequestArchiveBytes(size: number): string {
  if (!Number.isFinite(size) || size < 0) return '-'
  if (size < 1024) return `${size} B`

  const units = ['KB', 'MB', 'GB', 'TB']
  let value = size / 1024
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[unitIndex]}`
}

export function formatRequestArchiveDuration(durationMs: number): string {
  if (!Number.isFinite(durationMs) || durationMs < 0) return '-'
  if (durationMs < 1000) return `${durationMs} ms`
  return `${(durationMs / 1000).toFixed(durationMs >= 10_000 ? 1 : 2)} s`
}

export function formatRequestArchiveCredential(
  archive: Pick<RequestArchiveRecord, 'token_id' | 'token_name'>,
  sessionLabel: string
): string {
  if (archive.token_id <= 0) return sessionLabel
  return archive.token_name || `#${archive.token_id}`
}
