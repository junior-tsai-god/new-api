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
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

import type { PlaygroundSessionStats as SessionStats } from '../../types'

type PlaygroundSessionStatsProps = {
  hasError?: boolean
  isLoading?: boolean
  isSettling?: boolean
  onRetry?: () => void
  stats?: Pick<
    SessionStats,
    | 'cache_hit_rate'
    | 'cached_tokens'
    | 'cost_usd'
    | 'requested_request_count'
    | 'total_tokens'
  >
}

export function PlaygroundSessionStats({
  hasError = false,
  isLoading = false,
  isSettling = false,
  onRetry,
  stats,
}: PlaygroundSessionStatsProps) {
  const { i18n, t } = useTranslation()
  const locale = i18n.resolvedLanguage || i18n.language
  const numberFormatter = new Intl.NumberFormat(locale)
  const costFormatter = new Intl.NumberFormat(locale, {
    currency: 'USD',
    maximumFractionDigits: 6,
    minimumFractionDigits: 4,
    style: 'currency',
  })
  let fallbackValue: string | undefined
  if (isLoading && !stats) {
    fallbackValue = '…'
  } else if (hasError && !stats) {
    fallbackValue = '—'
  }
  const metrics = [
    {
      label: t('Requests'),
      value:
        fallbackValue ??
        numberFormatter.format(stats?.requested_request_count ?? 0),
    },
    {
      label: t('Total Tokens'),
      value: fallbackValue ?? numberFormatter.format(stats?.total_tokens ?? 0),
    },
    {
      label: t('Cached Tokens'),
      value: fallbackValue ?? numberFormatter.format(stats?.cached_tokens ?? 0),
    },
    {
      label: t('Cache Hit Rate'),
      value:
        fallbackValue ??
        new Intl.NumberFormat(locale, {
          maximumFractionDigits: 1,
          style: 'percent',
        }).format(stats?.cache_hit_rate ?? 0),
    },
    {
      label: t('Actual Cost'),
      title: isSettling ? t('Final cost is being settled') : undefined,
      value:
        fallbackValue ??
        (isSettling ? '…' : costFormatter.format(stats?.cost_usd ?? 0)),
    },
  ]

  return (
    <div
      aria-live='polite'
      className='border-border/60 bg-muted/20 scrollbar-none overflow-x-auto rounded-lg border'
      data-layout='single-line-scroll'
      data-slot='playground-session-stats'
    >
      <div className='flex min-w-max items-center'>
        <dl className='flex items-center divide-x text-xs'>
          {metrics.map((metric) => (
            <div
              className='flex shrink-0 items-baseline gap-2 px-3 py-2'
              key={metric.label}
            >
              <dt className='text-muted-foreground'>{metric.label}</dt>
              <dd
                className='text-foreground font-mono font-semibold tabular-nums'
                title={metric.title}
              >
                {metric.value}
              </dd>
            </div>
          ))}
        </dl>
        {hasError ? (
          <div
            className='border-border/60 text-destructive flex shrink-0 items-center gap-1 border-l px-2 text-xs'
            role='alert'
          >
            <span>{t('Failed to fetch usage')}</span>
            <Button onClick={onRetry} size='xs' type='button' variant='ghost'>
              {t('Retry')}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
