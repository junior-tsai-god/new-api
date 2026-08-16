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

export interface LoginPrefillState {
  registrationUsername: string
}

declare module '@tanstack/history' {
  interface HistoryState {
    registrationUsername?: string
  }
}

export interface LoginFormDefaults {
  username: string
  password: ''
}

export function createLoginPrefillState(
  username?: string
): LoginPrefillState | undefined {
  const registrationUsername = username?.trim()
  return registrationUsername ? { registrationUsername } : undefined
}

export function readLoginPrefillUsername(state: unknown): string {
  if (typeof state !== 'object' || state === null) return ''

  const registrationUsername = (state as { registrationUsername?: unknown })
    .registrationUsername
  return typeof registrationUsername === 'string'
    ? registrationUsername.trim()
    : ''
}

export function createLoginFormDefaults(
  initialUsername?: string
): LoginFormDefaults {
  return {
    username: initialUsername?.trim() ?? '',
    password: '',
  }
}
