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
import { useNavigate } from '@tanstack/react-router'
import { AlertCircle, Boxes } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { ModelCardGrid } from '@/features/pricing/components/model-card-grid'
import { ModelDetailsDrawer } from '@/features/pricing/components/model-details'
import { SearchBar } from '@/features/pricing/components/search-bar'
import { SORT_OPTIONS } from '@/features/pricing/constants'
import { usePricingData } from '@/features/pricing/hooks/use-pricing-data'
import { filterBySearch, sortModels } from '@/features/pricing/lib/filters'

function ModelCatalogSkeleton() {
  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3'>
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className='h-56 rounded-xl' />
      ))}
    </div>
  )
}

export function ModelCatalogContent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [selectedModelName, setSelectedModelName] = useState<string | null>(
    null
  )
  const pricing = usePricingData()
  const filteredModels = useMemo(
    () => sortModels(filterBySearch(pricing.models, search), SORT_OPTIONS.NAME),
    [pricing.models, search]
  )
  const selectedModel = useMemo(
    () =>
      selectedModelName
        ? (pricing.models.find(
            (model) => model.model_name === selectedModelName
          ) ?? null)
        : null,
    [pricing.models, selectedModelName]
  )
  const handleTryModel = useCallback(
    (model: string) => {
      void navigate({ to: '/playground', search: { model } })
    },
    [navigate]
  )

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between'>
        <SearchBar
          value={search}
          onChange={setSearch}
          onClear={() => setSearch('')}
          placeholder={t('Search model name or provider...')}
          className='w-full max-w-xl'
        />
        <span className='text-muted-foreground text-xs tabular-nums'>
          {filteredModels.length} {t('Models')}
        </span>
      </div>

      {pricing.isLoading ? <ModelCatalogSkeleton /> : null}

      {pricing.error ? (
        <Alert variant='destructive'>
          <AlertCircle aria-hidden='true' />
          <AlertTitle>{t('Unable to load models')}</AlertTitle>
          <AlertDescription>
            {t('Try refreshing the page in a moment.')}
          </AlertDescription>
        </Alert>
      ) : null}

      {!pricing.isLoading && !pricing.error && filteredModels.length > 0 ? (
        <ModelCardGrid
          models={filteredModels}
          onModelClick={setSelectedModelName}
          onTryModel={handleTryModel}
          priceRate={pricing.priceRate}
          usdExchangeRate={pricing.usdExchangeRate}
        />
      ) : null}

      {!pricing.isLoading && !pricing.error && filteredModels.length === 0 ? (
        <Empty className='min-h-64 border'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <Boxes aria-hidden='true' />
            </EmptyMedia>
            <EmptyTitle>{t('No models found')}</EmptyTitle>
            <EmptyDescription>
              {t('Try another model name or provider.')}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}

      {selectedModel ? (
        <ModelDetailsDrawer
          open
          onOpenChange={(open) => {
            if (!open) setSelectedModelName(null)
          }}
          model={selectedModel}
          groupRatio={pricing.groupRatio}
          usableGroup={pricing.usableGroup}
          endpointMap={
            pricing.endpointMap as unknown as Record<
              string,
              { path?: string; method?: string }
            >
          }
          autoGroups={pricing.autoGroups}
          priceRate={pricing.priceRate}
          usdExchangeRate={pricing.usdExchangeRate}
          tokenUnit='M'
          showRechargePrice={false}
        />
      ) : null}
    </div>
  )
}
