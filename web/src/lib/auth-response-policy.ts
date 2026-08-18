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
export interface UnauthorizedResponseContext {
  signOutInProgress: boolean
  requestSessionSID?: string
  currentSessionSID?: string
}

let intentionalSignOutOwners = 0

export function beginIntentionalSignOut(): () => void {
  intentionalSignOutOwners += 1
  let active = true

  return () => {
    if (!active) return
    active = false
    intentionalSignOutOwners = Math.max(0, intentionalSignOutOwners - 1)
  }
}

export function isIntentionalSignOutInProgress(): boolean {
  return intentionalSignOutOwners > 0
}

export function shouldSilenceUnauthorizedResponse(
  context: UnauthorizedResponseContext
): boolean {
  if (context.signOutInProgress) return true
  return Boolean(
    context.requestSessionSID &&
    context.requestSessionSID !== context.currentSessionSID
  )
}
