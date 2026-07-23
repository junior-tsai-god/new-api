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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SectionPageLayout } from '@/components/layout'
import { Badge } from '@/components/ui/badge'

import { ArchitectureFlowMap } from './components/architecture-flow-map'
import { ArchitectureReference } from './components/architecture-reference'
import type { ArchitectureFlowId } from './types'
import { useArchitectureContent } from './use-architecture-content'

export function SystemArchitecture() {
  const { t } = useTranslation()
  const content = useArchitectureContent()
  const [activeFlowId, setActiveFlowId] =
    useState<ArchitectureFlowId>('request')
  const activeFlow =
    content.flows.find((flow) => flow.id === activeFlowId) ?? content.flows[0]

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>
        <span className='inline-flex min-w-0 items-center gap-2'>
          <span className='truncate'>{t('System Architecture')}</span>
          <Badge variant='outline' className='shrink-0'>
            {t('Admin only')}
          </Badge>
        </span>
      </SectionPageLayout.Title>
      <SectionPageLayout.Content>
        <div className='space-y-4 pb-2'>
          <p className='text-muted-foreground max-w-4xl text-sm leading-6'>
            {t(
              'Follow how requests enter the gateway, become business decisions, reach upstream providers, and return as metered results.'
            )}
          </p>

          <ArchitectureFlowMap
            flows={content.flows}
            activeFlow={activeFlow}
            onFlowChange={setActiveFlowId}
          />

          <ArchitectureReference
            layers={content.layers}
            runtimeNodes={content.runtimeNodes}
            diagnosticBoundaries={content.diagnosticBoundaries}
          />

          <p className='text-muted-foreground px-1 text-xs leading-5'>
            {t(
              'This view describes logical ownership and the current deployment shape; it never exposes credentials or private request data.'
            )}
          </p>
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
