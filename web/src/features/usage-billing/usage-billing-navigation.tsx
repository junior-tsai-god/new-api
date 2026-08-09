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
import { useLocation, useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { getActiveUsageBillingSection } from './lib/navigation'

export function UsageBillingNavigation() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const pathname = useLocation({ select: (location) => location.pathname })
  const activeSection = getActiveUsageBillingSection(pathname)
  const handleSectionChange = useCallback(
    (section: string) => {
      if (section === 'requests') {
        void navigate({
          to: '/usage-logs/$section',
          params: { section: 'common' },
        })
        return
      }
      if (section === 'billing') {
        void navigate({ to: '/wallet' })
        return
      }
      void navigate({
        to: '/dashboard/$section',
        params: { section: 'models' },
      })
    },
    [navigate]
  )

  return (
    <Tabs value={activeSection} onValueChange={handleSectionChange}>
      <TabsList aria-label={t('Usage & Billing')}>
        <TabsTrigger value='usage'>{t('Usage')}</TabsTrigger>
        <TabsTrigger value='requests'>{t('Requests')}</TabsTrigger>
        <TabsTrigger value='billing'>{t('Billing')}</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
