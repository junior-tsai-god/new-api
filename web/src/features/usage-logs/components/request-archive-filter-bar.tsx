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
import { useIsFetching } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { Table } from '@tanstack/react-table'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { getDefaultTimeRange } from '../lib/utils'
import { CompactDateTimeRangePicker } from './compact-date-time-range-picker'
import {
  LogsFilterField,
  LogsFilterInput,
  LogsFilterToolbar,
} from './logs-filter-toolbar'

const route = getRouteApi('/_authenticated/usage-logs/$section')

interface RequestArchiveFilterValues {
  startTime?: Date
  endTime?: Date
  model: string
  requestId: string
  username: string
  path: string
  statusCode: string
}

interface RequestArchiveFilterDraft {
  sourceKey: string
  values: RequestArchiveFilterValues
}

function buildSourceKey(search: Record<string, unknown>) {
  return [
    search.startTime,
    search.endTime,
    search.model,
    search.requestId,
    search.username,
    search.path,
    search.statusCode,
  ]
    .map((value) => String(value ?? ''))
    .join('\u001f')
}

export function RequestArchiveFilterBar<TData>({
  table,
}: {
  table: Table<TData>
}) {
  const { t } = useTranslation()
  const navigate = route.useNavigate()
  const search = route.useSearch()
  const fetchingArchives = useIsFetching({ queryKey: ['request-archives'] })

  const searchState = useMemo<RequestArchiveFilterDraft>(() => {
    const { start, end } = getDefaultTimeRange()
    const sourceValues = {
      startTime: search.startTime,
      endTime: search.endTime,
      model: search.model,
      requestId: search.requestId,
      username: search.username,
      path: search.path,
      statusCode: search.statusCode,
    }
    return {
      sourceKey: buildSourceKey(sourceValues),
      values: {
        startTime: search.startTime ? new Date(search.startTime) : start,
        endTime: search.endTime ? new Date(search.endTime) : end,
        model: search.model || '',
        requestId: search.requestId || '',
        username: search.username || '',
        path: search.path || '',
        statusCode: search.statusCode ? String(search.statusCode) : '',
      },
    }
  }, [
    search.endTime,
    search.model,
    search.path,
    search.requestId,
    search.startTime,
    search.statusCode,
    search.username,
  ])
  const [draft, setDraft] = useState<RequestArchiveFilterDraft>(searchState)
  const activeDraft =
    draft.sourceKey === searchState.sourceKey ? draft : searchState
  const values = activeDraft.values

  const updateValue = useCallback(
    <Key extends keyof RequestArchiveFilterValues>(
      key: Key,
      value: RequestArchiveFilterValues[Key]
    ) => {
      setDraft((current) => {
        const base =
          current.sourceKey === searchState.sourceKey ? current : searchState
        return {
          sourceKey: searchState.sourceKey,
          values: { ...base.values, [key]: value },
        }
      })
    },
    [searchState]
  )

  const handleApply = useCallback(() => {
    const normalizedStatus = values.statusCode.trim()
    const statusCode = normalizedStatus ? Number(normalizedStatus) : undefined
    if (
      statusCode !== undefined &&
      (!Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599)
    ) {
      toast.error(t('Enter a status code from 100 to 599'))
      return
    }

    void navigate({
      to: '/usage-logs/$section',
      params: { section: 'archive' },
      search: {
        page: 1,
        pageSize: search.pageSize,
        startTime: values.startTime?.getTime(),
        endTime: values.endTime?.getTime(),
        model: values.model.trim() || undefined,
        requestId: values.requestId.trim() || undefined,
        username: values.username.trim() || undefined,
        path: values.path.trim() || undefined,
        statusCode,
      },
    })
  }, [navigate, search.pageSize, t, values])

  const handleReset = useCallback(() => {
    const { start, end } = getDefaultTimeRange()
    const nextValues: RequestArchiveFilterValues = {
      startTime: start,
      endTime: end,
      model: '',
      requestId: '',
      username: '',
      path: '',
      statusCode: '',
    }
    const nextSearch = {
      startTime: start.getTime(),
      endTime: end.getTime(),
    }
    setDraft({ sourceKey: buildSourceKey(nextSearch), values: nextValues })
    void navigate({
      to: '/usage-logs/$section',
      params: { section: 'archive' },
      search: { page: 1, pageSize: search.pageSize, ...nextSearch },
    })
  }, [navigate, search.pageSize])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') handleApply()
    },
    [handleApply]
  )

  const dateRangeFilter = (
    <LogsFilterField wide>
      <CompactDateTimeRangePicker
        start={values.startTime}
        end={values.endTime}
        onChange={({ start, end }) => {
          updateValue('startTime', start)
          updateValue('endTime', end)
        }}
      />
    </LogsFilterField>
  )
  const modelFilter = (
    <LogsFilterField>
      <LogsFilterInput
        placeholder={t('Model Name')}
        value={values.model}
        onChange={(event) => updateValue('model', event.target.value)}
        onKeyDown={handleKeyDown}
      />
    </LogsFilterField>
  )
  const requestIdFilter = (
    <LogsFilterField>
      <LogsFilterInput
        placeholder={t('Request ID')}
        value={values.requestId}
        onChange={(event) => updateValue('requestId', event.target.value)}
        onKeyDown={handleKeyDown}
      />
    </LogsFilterField>
  )
  const usernameFilter = (
    <LogsFilterField>
      <LogsFilterInput
        placeholder={t('Username')}
        value={values.username}
        onChange={(event) => updateValue('username', event.target.value)}
        onKeyDown={handleKeyDown}
      />
    </LogsFilterField>
  )
  const pathFilter = (
    <LogsFilterField>
      <LogsFilterInput
        placeholder={t('Path')}
        value={values.path}
        onChange={(event) => updateValue('path', event.target.value)}
        onKeyDown={handleKeyDown}
      />
    </LogsFilterField>
  )
  const statusFilter = (
    <LogsFilterField>
      <LogsFilterInput
        type='number'
        inputMode='numeric'
        min={100}
        max={599}
        placeholder={t('Status Code')}
        value={values.statusCode}
        onChange={(event) => updateValue('statusCode', event.target.value)}
        onKeyDown={handleKeyDown}
      />
    </LogsFilterField>
  )
  const advancedFilters = (
    <>
      {usernameFilter}
      {pathFilter}
      {statusFilter}
    </>
  )
  const mobileFilters = (
    <>
      {dateRangeFilter}
      {modelFilter}
      {requestIdFilter}
      {advancedFilters}
    </>
  )
  const advancedFilterCount = [
    values.username,
    values.path,
    values.statusCode,
  ].filter(Boolean).length
  const mobileFilterCount = [
    values.model,
    values.requestId,
    values.username,
    values.path,
    values.statusCode,
  ].filter(Boolean).length

  return (
    <LogsFilterToolbar
      table={table}
      primaryFilters={
        <>
          {dateRangeFilter}
          {modelFilter}
          {requestIdFilter}
        </>
      }
      advancedFilters={advancedFilters}
      mobilePinnedFilters={dateRangeFilter}
      mobileFilters={mobileFilters}
      mobileFilterCount={mobileFilterCount}
      advancedFilterCount={advancedFilterCount}
      hasActiveFilters
      hasAdvancedActiveFilters={advancedFilterCount > 0}
      searchLoading={fetchingArchives > 0}
      onReset={handleReset}
      onSearch={handleApply}
    />
  )
}
