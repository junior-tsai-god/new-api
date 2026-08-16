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
  Archive02Icon,
  RefreshIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { DataTablePage, useDataTable } from '@/components/data-table'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  SecureVerificationDialog,
  useSecureVerification,
} from '@/features/auth/secure-verification'
import { useIsAdmin } from '@/hooks/use-admin'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useTableUrlState } from '@/hooks/use-table-url-state'
import { formatTimestampToDate } from '@/lib/format'

import { getRequestArchives, revealRequestArchive } from '../api'
import {
  buildRequestArchiveParams,
  formatRequestArchiveBytes,
  formatRequestArchiveCredential,
  formatRequestArchiveDuration,
  getRequestArchiveStatusVariant,
} from '../lib/request-archive'
import type { RequestArchiveDetail, RequestArchiveRecord } from '../types'
import { RequestArchiveDetailDialog } from './dialogs/request-archive-detail-dialog'
import { RequestArchiveFilterBar } from './request-archive-filter-bar'
import { RequestArchiveMobileList } from './request-archive-mobile-card'

const route = getRouteApi('/_authenticated/usage-logs/$section')
const EMPTY_ARCHIVES = { items: [], total: 0, page: 1, page_size: 20 }

export function RequestArchiveTable() {
  const { t } = useTranslation()
  const isAdmin = useIsAdmin()
  const isMobile = useMediaQuery('(max-width: 640px)')
  const search = route.useSearch()
  const [detail, setDetail] = useState<RequestArchiveDetail | null>(null)
  const [revealingId, setRevealingId] = useState<number | null>(null)
  const {
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search,
    navigate: route.useNavigate(),
    pagination: { defaultPage: 1, defaultPageSize: isMobile ? 20 : 100 },
    globalFilter: { enabled: false },
  })

  const archiveParams = useMemo(
    () =>
      buildRequestArchiveParams({
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        search,
      }),
    [pagination.pageIndex, pagination.pageSize, search]
  )
  const archiveQuery = useQuery({
    queryKey: ['request-archives', archiveParams],
    enabled: isAdmin,
    queryFn: async () => {
      const result = await getRequestArchives(archiveParams)
      if (!result.success) {
        throw new Error(result.message || t('Failed to load request archives'))
      }
      return result.data || EMPTY_ARCHIVES
    },
    placeholderData: (previousData) => previousData,
  })

  const {
    open: verificationOpen,
    methods: verificationMethods,
    state: verificationState,
    executeVerification,
    cancel: cancelVerification,
    setCode: setVerificationCode,
    switchMethod: switchVerificationMethod,
    withVerification,
  } = useSecureVerification()

  const handleReveal = useCallback(
    async (archive: RequestArchiveRecord) => {
      const fetchDetail = async (proof?: string) => {
        setRevealingId(archive.id)
        try {
          const result = await revealRequestArchive(archive.id, proof)
          if (!result.success || !result.data) {
            throw new Error(
              result.message || t('Failed to reveal request archive')
            )
          }
          setDetail(result.data)
          return result
        } finally {
          setRevealingId(null)
        }
      }

      try {
        await withVerification(fetchDetail, {
          scope: 'request_archive.read',
          preferredMethod: 'passkey',
          title: t('Verify to view archived content'),
          description: t(
            'Confirm your identity before revealing archived request and response bodies.'
          ),
        })
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t('Failed to reveal request archive')
        )
      }
    },
    [t, withVerification]
  )

  const columns = useMemo<ColumnDef<RequestArchiveRecord>[]>(
    () => [
      {
        accessorKey: 'created_at',
        header: t('Time'),
        size: 155,
        cell: ({ row }) => (
          <span className='font-mono text-xs tabular-nums'>
            {formatTimestampToDate(row.original.created_at)}
          </span>
        ),
      },
      {
        id: 'request',
        header: t('Request'),
        minSize: 240,
        cell: ({ row }) => (
          <div className='min-w-0 space-y-1'>
            <div className='flex min-w-0 items-center gap-2'>
              <StatusBadge
                label={row.original.method || '-'}
                variant='info'
                copyable={false}
              />
              <span
                className='max-w-80 truncate font-mono text-xs font-medium'
                title={row.original.path}
              >
                {row.original.path || '-'}
              </span>
            </div>
            <span
              className='text-muted-foreground block max-w-96 truncate font-mono text-[11px]'
              title={row.original.request_id}
            >
              {row.original.request_id || `#${row.original.id}`}
            </span>
          </div>
        ),
      },
      {
        id: 'identity',
        header: t('User / API key'),
        size: 170,
        cell: ({ row }) => (
          <div className='min-w-0 space-y-1'>
            <div className='truncate text-xs font-medium'>
              {row.original.username || '-'}
            </div>
            <div className='text-muted-foreground truncate text-[11px]'>
              {formatRequestArchiveCredential(row.original, t('Session'))}
            </div>
          </div>
        ),
      },
      {
        id: 'target',
        header: t('Model / Channel'),
        size: 170,
        cell: ({ row }) => (
          <div className='min-w-0 space-y-1'>
            <div
              className='truncate font-mono text-xs font-medium'
              title={row.original.model_name}
            >
              {row.original.model_name || '-'}
            </div>
            <div className='text-muted-foreground text-[11px]'>
              {t('Channel')}{' '}
              {row.original.channel_id ? `#${row.original.channel_id}` : '-'}
              {row.original.is_stream ? ` · ${t('Stream')}` : ''}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'status_code',
        header: t('Status'),
        size: 100,
        cell: ({ row }) => (
          <div className='space-y-1'>
            <StatusBadge
              label={String(row.original.status_code)}
              variant={getRequestArchiveStatusVariant(row.original.status_code)}
              copyable={false}
              showDot
            />
            {row.original.capture_error && (
              <div
                className='text-destructive max-w-28 truncate text-[11px]'
                title={row.original.capture_error}
              >
                {t('Capture error')}
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'metrics',
        header: t('Duration / Size'),
        size: 135,
        cell: ({ row }) => (
          <div className='space-y-1 font-mono text-xs tabular-nums'>
            <div>{formatRequestArchiveDuration(row.original.duration_ms)}</div>
            <div className='text-muted-foreground text-[11px]'>
              {formatRequestArchiveBytes(row.original.request_size)} →{' '}
              {formatRequestArchiveBytes(row.original.response_size)}
            </div>
          </div>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 110,
        enableHiding: false,
        cell: ({ row }) => {
          const revealing = revealingId === row.original.id
          return (
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={revealing}
              onClick={() => handleReveal(row.original)}
            >
              {revealing ? (
                <Spinner data-icon='inline-start' />
              ) : (
                <HugeiconsIcon
                  icon={ViewIcon}
                  data-icon='inline-start'
                  strokeWidth={2}
                />
              )}
              {t('View')}
            </Button>
          )
        },
      },
    ],
    [handleReveal, revealingId, t]
  )

  const data = archiveQuery.data || EMPTY_ARCHIVES
  const { table } = useDataTable({
    data: data.items,
    columns,
    columnFilters,
    pagination,
    enableRowSelection: false,
    onPaginationChange,
    onColumnFiltersChange,
    manualPagination: true,
    manualFiltering: true,
    totalCount: data.total,
    ensurePageInRange,
    columnVisibilityStorageKey: 'request-archives:column-visibility',
  })

  if (!isAdmin) return null

  const initialError = archiveQuery.isError && !archiveQuery.data
  const retryAction = initialError ? (
    <Button
      type='button'
      variant='outline'
      onClick={() => archiveQuery.refetch()}
    >
      <HugeiconsIcon
        icon={RefreshIcon}
        data-icon='inline-start'
        strokeWidth={2}
      />
      {t('Try again')}
    </Button>
  ) : undefined

  return (
    <>
      <DataTablePage
        table={table}
        columns={columns}
        isLoading={archiveQuery.isLoading}
        isFetching={archiveQuery.isFetching}
        emptyTitle={
          initialError
            ? t('Failed to load request archives')
            : t('No request archives found')
        }
        emptyDescription={
          initialError
            ? t('Check your connection and try again.')
            : t('Captured API requests will appear here.')
        }
        emptyIcon={
          <HugeiconsIcon
            icon={initialError ? RefreshIcon : Archive02Icon}
            strokeWidth={2}
          />
        }
        emptyAction={retryAction}
        skeletonKeyPrefix='request-archive-skeleton'
        applyHeaderSize
        tableClassName='[&_[data-slot=table]]:text-[13px] [&_[data-slot=table]_td]:py-2.5'
        toolbar={<RequestArchiveFilterBar table={table} />}
        mobile={
          <RequestArchiveMobileList
            archives={data.items}
            isLoading={archiveQuery.isLoading}
            isError={initialError}
            revealingId={revealingId ?? undefined}
            onRetry={() => archiveQuery.refetch()}
            onReveal={handleReveal}
          />
        }
      />

      <RequestArchiveDetailDialog
        detail={detail}
        onOpenChange={(open) => {
          if (!open) setDetail(null)
        }}
      />

      <SecureVerificationDialog
        open={verificationOpen}
        onOpenChange={(open) => {
          if (!open) cancelVerification()
        }}
        methods={verificationMethods}
        state={verificationState}
        onVerify={async (method, code) => {
          try {
            await executeVerification(method, code)
          } catch {
            // The verification hook already reports the actionable error.
          }
        }}
        onCancel={cancelVerification}
        onCodeChange={setVerificationCode}
        onMethodChange={switchVerificationMethod}
      />
    </>
  )
}
