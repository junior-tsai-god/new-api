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
import { createFileRoute, redirect } from '@tanstack/react-router'

const LEGACY_DESTINATIONS = {
  channel: '/channels',
  models: '/models',
  personal: '/profile',
  playground: '/playground',
  redemption: '/redemption-codes',
  setting: '/system-settings',
  subscription: '/subscriptions',
  token: '/keys',
  user: '/users',
} as const

export const Route = createFileRoute('/console/$legacyPath')({
  beforeLoad: ({ params }) => {
    if (params.legacyPath === 'deployment') {
      throw redirect({
        to: '/models/$section',
        params: { section: 'deployments' },
      })
    }

    if (params.legacyPath === 'task') {
      throw redirect({
        to: '/usage-logs/$section',
        params: { section: 'task' },
      })
    }

    if (params.legacyPath === 'midjourney') {
      throw redirect({
        to: '/usage-logs/$section',
        params: { section: 'drawing' },
      })
    }

    const destination =
      LEGACY_DESTINATIONS[
        params.legacyPath as keyof typeof LEGACY_DESTINATIONS
      ] ?? '/dashboard'
    throw redirect({ to: destination })
  },
})
