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
import { useQuery } from '@tanstack/react-query'
import { Activity, AlertCircle, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PublicLayout, SectionPageLayout } from '@/components/layout'
import { Footer } from '@/components/layout/components/footer'
import { PageTransition } from '@/components/page-transition'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'

import { getModelStatus } from './api'
import { ModelStatusCard } from './components/model-status-card'
import {
  filterModelStatusItems,
  formatProbeCountdown,
} from './lib/model-status'
import type { ModelProbeStatus, ModelStatusItem } from './types'

const MODEL_STATUS_QUERY_KEY = ['model-status'] as const
const EMPTY_MODEL_STATUS_ITEMS: ModelStatusItem[] = []

function ModelStatusSkeleton() {
  return (
    <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className='h-[440px] rounded-2xl' />
      ))}
    </div>
  )
}

export function ModelStatusContent() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ModelProbeStatus | 'all'>('all')
  const query = useQuery({
    queryKey: MODEL_STATUS_QUERY_KEY,
    queryFn: getModelStatus,
    refetchInterval: 60_000,
    staleTime: 45_000,
  })
  const models = query.data?.models ?? EMPTY_MODEL_STATUS_ITEMS
  const filteredModels = useMemo(
    () => filterModelStatusItems(models, search, status),
    [models, search, status]
  )
  const intervalHours = Math.max(
    1,
    Math.round((query.data?.probe_interval_seconds ?? 43_200) / 3600)
  )
  const countdown = formatProbeCountdown(
    query.data?.next_probe_at ?? Math.floor(Date.now() / 1000),
    Date.now()
  )

  return (
    <div className='flex flex-col gap-5 pb-3'>
      <div className='flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between'>
        <div className='max-w-2xl'>
          <p className='text-muted-foreground text-sm leading-6'>
            {t('Active probes run every {{hours}} hours', {
              hours: intervalHours,
            })}
          </p>
          <p className='text-muted-foreground mt-1 text-xs leading-5'>
            {t('Status includes the models currently available to you.')}
          </p>
        </div>
        <div className='bg-card min-w-28 rounded-xl border px-3 py-2 text-right shadow-sm'>
          <div className='text-muted-foreground text-[10px] font-medium tracking-[0.12em] uppercase'>
            {t('Next probe')}
          </div>
          <div className='mt-0.5 font-mono text-lg font-semibold tabular-nums'>
            {countdown}
          </div>
        </div>
      </div>

      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='relative w-full sm:max-w-sm'>
          <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('Search models')}
            aria-label={t('Search models')}
            className='pl-9'
          />
        </div>
        <div className='flex items-center justify-between gap-3 sm:justify-end'>
          <span className='text-muted-foreground text-xs tabular-nums'>
            {filteredModels.length} {t('Models')}
          </span>
          <NativeSelect
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as ModelProbeStatus | 'all')
            }
            aria-label={t('All statuses')}
            className='min-w-36'
          >
            <NativeSelectOption value='all'>
              {t('All statuses')}
            </NativeSelectOption>
            <NativeSelectOption value='healthy'>
              {t('Healthy')}
            </NativeSelectOption>
            <NativeSelectOption value='degraded'>
              {t('Degraded')}
            </NativeSelectOption>
            <NativeSelectOption value='down'>
              {t('Unavailable')}
            </NativeSelectOption>
            <NativeSelectOption value='unknown'>
              {t('Unknown')}
            </NativeSelectOption>
          </NativeSelect>
        </div>
      </div>

      {query.isLoading ? <ModelStatusSkeleton /> : null}

      {query.isError ? (
        <Alert variant='destructive'>
          <AlertCircle aria-hidden />
          <AlertTitle>{t('Unable to load model status')}</AlertTitle>
          <AlertDescription>
            {t('Try refreshing the page in a moment.')}
          </AlertDescription>
        </Alert>
      ) : null}

      {!query.isLoading && !query.isError && filteredModels.length > 0 ? (
        <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
          {filteredModels.map((model) => (
            <ModelStatusCard key={model.model_name} model={model} />
          ))}
        </div>
      ) : null}

      {!query.isLoading && !query.isError && filteredModels.length === 0 ? (
        <Empty className='min-h-72 border'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <Activity aria-hidden />
            </EmptyMedia>
            <EmptyTitle>
              {models.length === 0
                ? t('No probe data yet')
                : t('No models match your filters')}
            </EmptyTitle>
            <EmptyDescription>
              {models.length === 0
                ? t('The first active probe will run automatically.')
                : t('Try another model name or status.')}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}
    </div>
  )
}

export function ModelStatus() {
  const { t } = useTranslation()

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>{t('Model Status')}</SectionPageLayout.Title>
      <SectionPageLayout.Content>
        <ModelStatusContent />
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}

export function PublicModelStatus() {
  const { t } = useTranslation()

  return (
    <PublicLayout showMainContainer={false}>
      <div className='aivanta-public-surface min-h-svh px-2 py-2 md:px-4 md:py-4'>
        <PageTransition className='aivanta-public-frame px-3 pt-24 pb-8 sm:px-6 sm:pt-28 lg:px-8'>
          <header className='border-b border-[var(--aivanta-rule)] py-6'>
            <p className='font-mono text-[10px] tracking-[0.18em] text-[var(--aivanta-faint)] uppercase'>
              Aivanta / {t('Model Status')}
            </p>
            <h1 className='mt-2 text-[clamp(2.5rem,5vw,4.75rem)] leading-[0.95] font-light tracking-[-0.06em]'>
              {t('Model Status')}
            </h1>
          </header>
          <div className='py-5'>
            <ModelStatusContent />
          </div>
        </PageTransition>
        <Footer className='mx-auto mt-3 w-[min(calc(100%_-_1rem),96rem)] rounded-[2rem] border border-[var(--aivanta-rule)] bg-[var(--aivanta-paper)]' />
      </div>
    </PublicLayout>
  )
}
