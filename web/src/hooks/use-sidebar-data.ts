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
  Activity,
  FlaskConical,
  Key,
  Settings,
  Wallet,
  Boxes,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { SidebarData } from '@/components/layout/types'

/**
 * Root navigation groups for the application sidebar.
 *
 * These are shown when the URL does not match any nested sidebar view
 * registered in `layout/lib/sidebar-view-registry.ts`.
 */
export function useSidebarData(): SidebarData {
  const { t } = useTranslation()

  return {
    navGroups: [
      {
        id: 'workspace',
        title: t('Workspace'),
        items: [
          {
            title: t('Overview'),
            url: '/dashboard/overview',
            icon: Activity,
          },
          {
            title: t('Playground'),
            url: '/playground',
            icon: FlaskConical,
          },
          {
            title: t('API Keys'),
            url: '/keys',
            icon: Key,
          },
          {
            title: t('Model Center'),
            url: '/model-catalog/catalog',
            activeUrls: ['/model-catalog', '/model-status', '/pricing'],
            icon: Boxes,
          },
          {
            title: t('Usage & Billing'),
            url: '/dashboard/models',
            activeUrls: ['/usage-logs', '/wallet'],
            configUrls: [
              '/dashboard/models',
              '/usage-logs/common',
              '/usage-logs/drawing',
              '/usage-logs/task',
              '/wallet',
            ],
            icon: Wallet,
          },
        ],
      },
      {
        id: 'admin',
        title: t('Administration'),
        items: [
          {
            title: t('Administration'),
            url: '/channels',
            icon: Settings,
          },
        ],
      },
    ],
  }
}
