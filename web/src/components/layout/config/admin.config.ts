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
import type { TFunction } from 'i18next'
import {
  Box,
  CreditCard,
  Network,
  Radio,
  ServerCog,
  Settings,
  Ticket,
  Users,
} from 'lucide-react'

import { ROLE } from '@/lib/roles'

import type { NavGroup, SidebarView } from '../types'

function getAdminNavGroups(t: TFunction): NavGroup[] {
  return [
    {
      id: 'admin-routing',
      title: t('Models & Routing'),
      items: [
        {
          title: t('Flow'),
          url: '/dashboard/flow',
          activeUrls: ['/dashboard/users'],
          icon: Network,
        },
        {
          title: t('Channels'),
          url: '/channels',
          icon: Radio,
        },
        {
          title: t('Model Management'),
          url: '/models/metadata',
          activeUrls: ['/models/deployments'],
          icon: Box,
        },
      ],
    },
    {
      id: 'admin-accounts',
      title: t('Accounts & Billing'),
      items: [
        {
          title: t('Users'),
          url: '/users',
          icon: Users,
        },
        {
          title: t('Redemption Codes'),
          url: '/redemption-codes',
          icon: Ticket,
        },
        {
          title: t('Subscriptions'),
          url: '/subscriptions',
          icon: CreditCard,
        },
      ],
    },
    {
      id: 'admin-system',
      title: t('System Administration'),
      items: [
        {
          title: t('System Architecture'),
          url: '/architecture',
          icon: Network,
          requiredRole: ROLE.ADMIN,
        },
        {
          title: t('System Info'),
          url: '/system-info',
          icon: ServerCog,
          requiredRole: ROLE.SUPER_ADMIN,
        },
        {
          title: t('System Settings'),
          url: '/system-settings/site',
          activeUrls: ['/system-settings'],
          icon: Settings,
        },
      ],
    },
  ]
}

export const ADMIN_VIEW: SidebarView = {
  id: 'administration',
  pathPattern:
    /^\/(dashboard\/(flow|users)|channels|models\/(metadata|deployments)|users|redemption-codes|subscriptions|architecture|system-info)(\/|$)/,
  parent: {
    to: '/dashboard/overview',
    label: 'Back to workspace',
  },
  getNavGroups: getAdminNavGroups,
}
