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
export const MODEL_LATENCY_REFRESH_STORAGE_KEY =
  'model-latency-refresh-requested-at:v1'

export function notifyModelLatencyUpdated() {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(
      MODEL_LATENCY_REFRESH_STORAGE_KEY,
      String(Date.now())
    )
  } catch {
    // Query invalidation still refreshes the current tab when storage is unavailable.
  }
}
