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
  FlaskConicalIcon,
  Key01Icon,
  WalletAdd01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getApiKeys } from '@/features/keys/api'
import { getModelStatus } from '@/features/model-status/api'
import { formatNumber, formatQuota } from '@/lib/format'
import { useAuthStore } from '@/stores/auth-store'

function Metric(props: { label: string; loading?: boolean; value: string }) {
  return (
    <div className='flex min-w-0 flex-col gap-1 px-4 py-3.5 sm:px-5 sm:py-4'>
      <span className='text-muted-foreground text-xs'>{props.label}</span>
      {props.loading ? (
        <Skeleton className='h-7 w-24' />
      ) : (
        <span className='deck-metric truncate text-2xl'>{props.value}</span>
      )}
    </div>
  )
}

export function FocusedOverview() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.auth.user)
  const keysQuery = useQuery({
    queryKey: ['dashboard', 'overview', 'api-key-count'],
    queryFn: () => getApiKeys({ p: 1, size: 1 }),
    staleTime: 60 * 1000,
  })
  const statusQuery = useQuery({
    queryKey: ['model-status'],
    queryFn: getModelStatus,
    staleTime: 45 * 1000,
  })
  const statusSummary = useMemo(() => {
    const models = statusQuery.data?.models ?? []
    const healthyModels = models.filter((model) => model.status === 'healthy')
    const measuredModels = models.filter((model) => model.latency_ms > 0)
    const latencyTotal = measuredModels.reduce(
      (total, model) => total + model.latency_ms,
      0
    )
    return {
      healthy: healthyModels.length,
      total: models.length,
      averageLatency:
        measuredModels.length > 0
          ? Math.round(latencyTotal / measuredModels.length)
          : 0,
    }
  }, [statusQuery.data?.models])
  const keyCount = keysQuery.data?.data?.total ?? 0
  const requestCount = Number(user?.request_count ?? 0)
  const needsApiKey = !keysQuery.isLoading && keyCount === 0
  const needsFirstRequest = !needsApiKey && requestCount === 0
  let statusDotClass = 'bg-muted-foreground'
  if (statusSummary.total > 0) {
    statusDotClass =
      statusSummary.healthy === statusSummary.total
        ? 'bg-success'
        : 'bg-warning'
  }

  return (
    <div className='flex flex-col gap-4'>
      <section className='deck-panel overflow-hidden'>
        <div className='grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center'>
          <div className='grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0'>
            <Metric
              label={t('Credit remaining')}
              value={formatQuota(Number(user?.quota ?? 0))}
            />
            <Metric
              label={t('Total Usage')}
              value={formatQuota(Number(user?.used_quota ?? 0))}
            />
            <Metric label={t('Requests')} value={formatNumber(requestCount)} />
          </div>
          <div className='flex flex-wrap gap-2 border-t px-4 py-3 sm:px-5 lg:border-t-0 lg:border-l'>
            <Button
              className='bg-[var(--deck-signal)] text-[var(--deck-ink)] hover:bg-[var(--deck-signal)] hover:brightness-95'
              render={<Link to='/wallet' />}
              size='sm'
            >
              <HugeiconsIcon
                icon={WalletAdd01Icon}
                data-icon='inline-start'
                strokeWidth={2}
              />
              {t('Recharge')}
            </Button>
            <Button
              render={<Link to='/playground' />}
              size='sm'
              variant='outline'
            >
              <HugeiconsIcon
                icon={FlaskConicalIcon}
                data-icon='inline-start'
                strokeWidth={2}
              />
              {t('Playground')}
            </Button>
            <Button render={<Link to='/keys' />} size='sm' variant='outline'>
              <HugeiconsIcon
                icon={Key01Icon}
                data-icon='inline-start'
                strokeWidth={2}
              />
              {t('Create API Key')}
            </Button>
          </div>
        </div>
      </section>

      <section className='deck-panel overflow-hidden'>
        <div className='flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3.5 sm:px-5'>
          <div className='flex items-center gap-2 font-medium'>
            <span
              className={`${statusDotClass} size-2 rounded-full`}
              aria-hidden='true'
            />
            {t('Model Status')}
          </div>
          <Metric
            label={t('Healthy')}
            loading={statusQuery.isLoading}
            value={`${statusSummary.healthy} / ${statusSummary.total}`}
          />
          <Metric
            label={t('Average latency')}
            loading={statusQuery.isLoading}
            value={
              statusSummary.averageLatency > 0
                ? `${statusSummary.averageLatency} ms`
                : '—'
            }
          />
          <Link
            to='/model-catalog/$section'
            params={{ section: 'catalog' }}
            className='text-foreground focus-visible:ring-ring ms-auto text-sm font-medium underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none'
          >
            {t('Models')}
          </Link>
        </div>
      </section>

      {needsApiKey || needsFirstRequest ? (
        <section className='deck-panel flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5'>
          <div>
            <h2 className='text-sm font-semibold'>
              {needsApiKey ? t('No API key yet') : t('Playground')}
            </h2>
            <p className='text-muted-foreground mt-1 text-sm'>
              {needsApiKey
                ? t('Create a key for your app or service')
                : t('Verify routing with Playground or your client')}
            </p>
          </div>
          <Button
            render={<Link to={needsApiKey ? '/keys' : '/playground'} />}
            size='sm'
          >
            {needsApiKey ? t('Create API Key') : t('Playground')}
          </Button>
        </section>
      ) : null}
    </div>
  )
}
