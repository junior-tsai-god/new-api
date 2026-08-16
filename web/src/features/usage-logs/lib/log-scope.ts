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
import {
  LOG_TYPE_ALL_VALUE,
  LOG_TYPE_ENUM,
  LOG_TYPE_FILTERS,
} from '../constants.ts'
import type { CommonLogScope } from '../types.ts'

const LOG_TYPES_BY_SCOPE: Record<CommonLogScope, ReadonlySet<number>> = {
  request: new Set([LOG_TYPE_ENUM.CONSUME, LOG_TYPE_ENUM.ERROR]),
  activity: new Set([
    LOG_TYPE_ENUM.TOPUP,
    LOG_TYPE_ENUM.MANAGE,
    LOG_TYPE_ENUM.SYSTEM,
    LOG_TYPE_ENUM.REFUND,
    LOG_TYPE_ENUM.LOGIN,
  ]),
}

export function getLogTypeFiltersForScope(scope: CommonLogScope) {
  const allowedTypes = LOG_TYPES_BY_SCOPE[scope]
  return LOG_TYPE_FILTERS.filter(
    (item) =>
      item.value === LOG_TYPE_ALL_VALUE || allowedTypes.has(Number(item.value))
  )
}

export function isLogTypeAllowedForScope(
  scope: CommonLogScope,
  type: number
): boolean {
  return type === LOG_TYPE_ENUM.UNKNOWN || LOG_TYPES_BY_SCOPE[scope].has(type)
}
