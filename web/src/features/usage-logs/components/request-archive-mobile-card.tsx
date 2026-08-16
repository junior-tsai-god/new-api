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
import { useTranslation } from 'react-i18next'

import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { formatTimestampToDate } from '@/lib/format'

import {
  formatRequestArchiveBytes,
  formatRequestArchiveCredential,
  formatRequestArchiveDuration,
  getRequestArchiveStatusVariant,
} from '../lib/request-archive'
import type { RequestArchiveRecord } from '../types'

interface RequestArchiveMobileListProps {
  archives: RequestArchiveRecord[]
  isLoading: boolean
  isError: boolean
  revealingId?: number
  onRetry: () => void
  onReveal: (archive: RequestArchiveRecord) => void
}

function RequestArchiveMobileSkeleton() {
  return (
    <div className='space-y-3'>
      {[1, 2, 3].map((item) => (
        <Card key={item} size='sm'>
          <CardHeader className='grid-cols-[1fr_auto]'>
            <Skeleton className='h-5 w-48' />
            <Skeleton className='h-5 w-12 rounded-full' />
          </CardHeader>
          <CardContent className='grid grid-cols-2 gap-2'>
            {[1, 2, 3, 4].map((field) => (
              <Skeleton key={field} className='h-10 rounded-lg' />
            ))}
          </CardContent>
          <CardFooter>
            <Skeleton className='h-8 w-full rounded-full' />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

function ArchiveEmptyState({
  isError,
  onRetry,
}: {
  isError: boolean
  onRetry: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className='route-data-frame border p-6'>
      <Empty className='border-none p-0'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <HugeiconsIcon
              icon={isError ? RefreshIcon : Archive02Icon}
              strokeWidth={2}
            />
          </EmptyMedia>
          <EmptyTitle>
            {isError
              ? t('Failed to load request archives')
              : t('No request archives found')}
          </EmptyTitle>
          <EmptyDescription>
            {isError
              ? t('Check your connection and try again.')
              : t('Captured API requests will appear here.')}
          </EmptyDescription>
        </EmptyHeader>
        {isError && (
          <EmptyContent>
            <Button type='button' variant='outline' onClick={onRetry}>
              <HugeiconsIcon icon={RefreshIcon} data-icon='inline-start' />
              {t('Try again')}
            </Button>
          </EmptyContent>
        )}
      </Empty>
    </div>
  )
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div className='bg-muted/25 min-w-0 rounded-lg px-2.5 py-2'>
      <div className='text-muted-foreground text-[11px] leading-none font-medium'>
        {label}
      </div>
      <div className='mt-1.5 truncate font-mono text-xs' title={value}>
        {value}
      </div>
    </div>
  )
}

export function RequestArchiveMobileList({
  archives,
  isLoading,
  isError,
  revealingId,
  onRetry,
  onReveal,
}: RequestArchiveMobileListProps) {
  const { t } = useTranslation()

  if (isLoading) return <RequestArchiveMobileSkeleton />
  if (isError || archives.length === 0) {
    return <ArchiveEmptyState isError={isError} onRetry={onRetry} />
  }

  return (
    <div className='space-y-3'>
      {archives.map((archive) => {
        const revealing = revealingId === archive.id
        return (
          <Card key={archive.id} size='sm'>
            <CardHeader className='grid-cols-[minmax(0,1fr)_auto] gap-2'>
              <div className='min-w-0'>
                <div className='flex min-w-0 items-center gap-2'>
                  <StatusBadge
                    label={archive.method || '-'}
                    variant='info'
                    copyable={false}
                  />
                  <span className='truncate font-mono text-xs font-medium'>
                    {archive.path || '-'}
                  </span>
                </div>
                <div className='text-muted-foreground mt-1 truncate font-mono text-[11px]'>
                  {archive.request_id || `#${archive.id}`}
                </div>
              </div>
              <StatusBadge
                label={String(archive.status_code)}
                variant={getRequestArchiveStatusVariant(archive.status_code)}
                copyable={false}
                showDot
              />
            </CardHeader>

            <CardContent className='grid grid-cols-2 gap-2'>
              <SummaryField
                label={t('Time')}
                value={formatTimestampToDate(archive.created_at)}
              />
              <SummaryField
                label={t('User / API key')}
                value={`${archive.username || '-'} / ${formatRequestArchiveCredential(archive, t('Session'))}`}
              />
              <SummaryField
                label={t('Model / Channel')}
                value={`${archive.model_name || '-'} / ${archive.channel_id ? `#${archive.channel_id}` : '-'}`}
              />
              <SummaryField
                label={t('Duration / Size')}
                value={`${formatRequestArchiveDuration(archive.duration_ms)} / ${formatRequestArchiveBytes(archive.request_size + archive.response_size)}`}
              />
            </CardContent>

            {archive.capture_error && (
              <div className='text-destructive mx-3 rounded-lg border border-current/20 px-2.5 py-2 font-mono text-xs break-all'>
                {t('Capture error')}: {archive.capture_error}
              </div>
            )}

            <CardFooter>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='w-full'
                disabled={revealing}
                onClick={() => onReveal(archive)}
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
                {t('View content')}
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
