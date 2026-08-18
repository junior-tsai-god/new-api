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
import { AlertCircle } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

import { EXCLUDED_GROUPS, VIEW_MODES } from '../constants'
import { useFilters, type FilterState } from '../hooks/use-filters'
import { usePricingData } from '../hooks/use-pricing-data'
import { EmptyState } from './empty-state'
import { LoadingSkeleton } from './loading-skeleton'
import { ModelCardGrid } from './model-card-grid'
import { ModelDetailsDrawer } from './model-details'
import { PricingSidebar } from './pricing-sidebar'
import { PricingTable } from './pricing-table'
import { PricingToolbar } from './pricing-toolbar'
import { SearchBar } from './search-bar'

export interface ModelDirectoryContentProps {
  initialFilters?: FilterState
  onTryModel?: (modelName: string) => void
}

export function ModelDirectoryContent(props: ModelDirectoryContentProps) {
  const { t } = useTranslation()
  const [selectedModelName, setSelectedModelName] = useState<string | null>(
    null
  )
  const pricing = usePricingData()
  const filters = useFilters(pricing.models, props.initialFilters)

  const selectedModel = useMemo(
    () =>
      selectedModelName
        ? (pricing.models.find(
            (model) => model.model_name === selectedModelName
          ) ?? null)
        : null,
    [pricing.models, selectedModelName]
  )
  const availableGroups = useMemo(
    () =>
      Object.keys(pricing.usableGroup).filter(
        (group) => !EXCLUDED_GROUPS.includes(group)
      ),
    [pricing.usableGroup]
  )
  const handleClearAll = () => {
    filters.clearFilters()
    filters.clearSearch()
  }

  if (pricing.isLoading) {
    return <LoadingSkeleton viewMode={filters.viewMode} />
  }

  if (pricing.error) {
    return (
      <Alert variant='destructive'>
        <AlertCircle aria-hidden='true' />
        <AlertTitle>{t('Unable to load models')}</AlertTitle>
        <AlertDescription>
          {t('Try refreshing the page in a moment.')}
        </AlertDescription>
      </Alert>
    )
  }

  let modelResults: ReactNode
  if (filters.filteredModels.length === 0) {
    modelResults = (
      <EmptyState
        searchQuery={filters.searchInput}
        hasActiveFilters={filters.hasActiveFilters}
        onClearFilters={handleClearAll}
      />
    )
  } else if (filters.viewMode === VIEW_MODES.CARD) {
    modelResults = (
      <ModelCardGrid
        models={filters.filteredModels}
        onModelClick={setSelectedModelName}
        onTryModel={props.onTryModel}
        priceRate={pricing.priceRate}
        usdExchangeRate={pricing.usdExchangeRate}
        tokenUnit={filters.tokenUnit}
        showRechargePrice={filters.showRechargePrice}
        selectedGroup={filters.groupFilter}
      />
    )
  } else {
    modelResults = (
      <PricingTable
        models={filters.filteredModels}
        priceRate={pricing.priceRate}
        usdExchangeRate={pricing.usdExchangeRate}
        tokenUnit={filters.tokenUnit}
        showRechargePrice={filters.showRechargePrice}
        selectedGroup={filters.groupFilter}
        onModelClick={setSelectedModelName}
      />
    )
  }

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-end sm:justify-between'>
        <SearchBar
          value={filters.searchInput}
          onChange={filters.setSearchInput}
          onClear={filters.clearSearch}
          placeholder={t('Search model name, provider, endpoint, or tag...')}
          className='w-full max-w-2xl'
        />
        <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
          {pricing.models.length}{' '}
          {pricing.models.length === 1 ? t('model') : t('models')}
        </span>
      </div>

      <div className='grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]'>
        <PricingSidebar
          quotaTypeFilter={filters.quotaTypeFilter}
          endpointTypeFilter={filters.endpointTypeFilter}
          vendorFilter={filters.vendorFilter}
          groupFilter={filters.groupFilter}
          tagFilter={filters.tagFilter}
          onQuotaTypeChange={filters.setQuotaTypeFilter}
          onEndpointTypeChange={filters.setEndpointTypeFilter}
          onVendorChange={filters.setVendorFilter}
          onGroupChange={filters.setGroupFilter}
          onTagChange={filters.setTagFilter}
          vendors={pricing.vendors}
          groups={availableGroups}
          groupRatios={pricing.groupRatio}
          tags={filters.availableTags}
          models={pricing.models}
          hasActiveFilters={filters.hasActiveFilters}
          onClearFilters={filters.clearFilters}
          className='hover-scrollbar sticky top-24 hidden max-h-[calc(100dvh-7rem)] self-start overflow-y-auto xl:block'
        />

        <section className='flex min-w-0 flex-col gap-4'>
          <PricingToolbar
            filteredCount={filters.filteredModels.length}
            totalCount={pricing.models.length}
            sortBy={filters.sortBy}
            onSortChange={filters.setSortBy}
            tokenUnit={filters.tokenUnit}
            onTokenUnitChange={filters.setTokenUnit}
            showRechargePrice={filters.showRechargePrice}
            onRechargePriceChange={filters.setShowRechargePrice}
            viewMode={filters.viewMode}
            onViewModeChange={filters.setViewMode}
            quotaTypeFilter={filters.quotaTypeFilter}
            endpointTypeFilter={filters.endpointTypeFilter}
            vendorFilter={filters.vendorFilter}
            groupFilter={filters.groupFilter}
            tagFilter={filters.tagFilter}
            onQuotaTypeChange={filters.setQuotaTypeFilter}
            onEndpointTypeChange={filters.setEndpointTypeFilter}
            onVendorChange={filters.setVendorFilter}
            onGroupChange={filters.setGroupFilter}
            onTagChange={filters.setTagFilter}
            vendors={pricing.vendors}
            groups={availableGroups}
            groupRatios={pricing.groupRatio}
            tags={filters.availableTags}
            models={pricing.models}
            hasActiveFilters={filters.hasActiveFilters}
            activeFilterCount={filters.activeFilterCount}
            onClearFilters={filters.clearFilters}
          />

          {modelResults}
        </section>
      </div>

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
          tokenUnit={filters.tokenUnit}
          showRechargePrice={filters.showRechargePrice}
        />
      ) : null}
    </div>
  )
}
