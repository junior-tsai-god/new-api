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
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { SectionPageLayout } from '@/components/layout'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ModelStatusContent } from '@/features/model-status'

import { ModelCatalogContent } from './model-catalog-content'
import type { ModelCatalogSection } from './section-registry'

const route = getRouteApi('/_authenticated/model-catalog/$section')

const SECTION_LABELS: Record<ModelCatalogSection, string> = {
  catalog: 'Model Square',
  status: 'Model Status',
}

export function ModelCatalog() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const params = route.useParams()
  const activeSection = params.section as ModelCatalogSection
  const handleSectionChange = useCallback(
    (section: string) => {
      void navigate({
        to: '/model-catalog/$section',
        params: { section: section as ModelCatalogSection },
      })
    },
    [navigate]
  )

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>{t('Models')}</SectionPageLayout.Title>
      <SectionPageLayout.Content>
        <div className='flex flex-col gap-4'>
          <Tabs value={activeSection} onValueChange={handleSectionChange}>
            <TabsList>
              {(Object.keys(SECTION_LABELS) as ModelCatalogSection[]).map(
                (section) => (
                  <TabsTrigger key={section} value={section}>
                    {t(SECTION_LABELS[section])}
                  </TabsTrigger>
                )
              )}
            </TabsList>
          </Tabs>
          {activeSection === 'catalog' ? (
            <ModelCatalogContent />
          ) : (
            <ModelStatusContent />
          )}
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
