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
export type ModelProbeStatus = 'healthy' | 'degraded' | 'down' | 'unknown'

export type ModelProbeHistory = {
  batch_id: string
  status: Exclude<ModelProbeStatus, 'unknown'>
  latency_ms: number
  healthy_channels: number
  total_channels: number
  checked_at: number
}

export type ModelStatusItem = {
  model_name: string
  icon?: string
  vendor_name?: string
  vendor_icon?: string
  supported_endpoint_types: string[]
  status: ModelProbeStatus
  latency_ms: number
  healthy_channels: number
  total_channels: number
  availability_7d: number
  availability_samples_7d: number
  last_checked_at: number
  history: ModelProbeHistory[]
}

export type ModelStatusData = {
  generated_at: number
  probe_interval_seconds: number
  next_probe_at: number
  models: ModelStatusItem[]
}

export type ModelStatusResponse = {
  success: boolean
  message?: string
  data: ModelStatusData
}

export type ModelStatusHistorySlot =
  | ModelProbeHistory
  | { batch_id: string; status: 'unknown'; checked_at: 0 }
