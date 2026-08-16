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
import { Clock3 } from 'lucide-react'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import { Skeleton } from '@/components/ui/skeleton'
import { createModelStatusHistorySlots } from '@/features/model-status/lib/model-status'
import type {
  ModelProbeStatus,
  ModelStatusItem,
} from '@/features/model-status/types'
import { toIntlLocale } from '@/i18n/languages'
import { formatTimestampRelative } from '@/lib/format'
import { cn } from '@/lib/utils'

const statusVisuals: Record<
  ModelProbeStatus,
  { bar: string; dot: string; label: string }
> = {
  healthy: { bar: 'bg-success', dot: 'bg-success', label: 'Healthy' },
  degraded: { bar: 'bg-warning', dot: 'bg-warning', label: 'Degraded' },
  down: {
    bar: 'bg-destructive',
    dot: 'bg-destructive',
    label: 'Unavailable',
  },
  unknown: {
    bar: 'bg-muted-foreground/15',
    dot: 'bg-muted-foreground/35',
    label: 'Unknown',
  },
}

type ModelStatusSummaryProps = {
  status?: ModelStatusItem
  loading?: boolean
}

const barHeightClasses = ['h-1', 'h-2', 'h-3', 'h-4', 'h-5', 'h-7'] as const

export const ModelStatusSummary = memo(function ModelStatusSummary(
  props: ModelStatusSummaryProps
) {
  const { i18n, t } = useTranslation()

  if (props.loading) {
    return (
      <div
        className='mt-4 border-y py-3'
        aria-busy='true'
        aria-label={t('Latency')}
      >
        <div className='flex items-end justify-between gap-4'>
          <div className='flex flex-col gap-2'>
            <Skeleton className='h-3 w-16' />
            <Skeleton className='h-8 w-28' />
          </div>
          <div className='flex flex-col items-end gap-2'>
            <Skeleton className='h-3 w-14' />
            <Skeleton className='h-6 w-16' />
          </div>
        </div>
        <Skeleton className='mt-3 h-7 w-full' />
      </div>
    )
  }

  const status = props.status?.status ?? 'unknown'
  const visual = statusVisuals[status]
  const history = createModelStatusHistorySlots(props.status?.history ?? [], 12)
  const measuredLatency = history.flatMap((item) =>
    'latency_ms' in item && item.latency_ms > 0 ? [item.latency_ms] : []
  )
  const minimum = measuredLatency.length > 0 ? Math.min(...measuredLatency) : 0
  const maximum = measuredLatency.length > 0 ? Math.max(...measuredLatency) : 0
  const logarithmicRange = Math.log1p(maximum) - Math.log1p(minimum)
  const historyBars = history.map((item) => {
    if (!('latency_ms' in item) || item.latency_ms <= 0) {
      return { item, heightClass: barHeightClasses[0] }
    }

    let level = 3
    if (logarithmicRange > 0) {
      const position =
        (Math.log1p(item.latency_ms) - Math.log1p(minimum)) / logarithmicRange
      level = 1 + Math.round(position * 4)
    }

    return { item, heightClass: barHeightClasses[level] }
  })
  const locale = toIntlLocale(i18n.resolvedLanguage ?? i18n.language)
  const latency =
    props.status && props.status.latency_ms > 0
      ? new Intl.NumberFormat(locale).format(props.status.latency_ms)
      : '—'
  const availability =
    props.status && props.status.availability_samples_7d > 0
      ? `${Number(props.status.availability_7d.toFixed(2))}%`
      : '—'
  const lastChecked = props.status?.last_checked_at
    ? formatTimestampRelative(
        props.status.last_checked_at,
        'seconds',
        i18n.resolvedLanguage ?? i18n.language
      )
    : '—'

  return (
    <section
      className='mt-4 border-y py-3 tabular-nums'
      aria-label={t('Latency')}
    >
      <div className='flex items-end justify-between gap-4'>
        <div className='min-w-0'>
          <p className='text-muted-foreground text-xs'>{t('Latency')}</p>
          <p className='mt-1 flex items-baseline gap-1'>
            <span className='deck-metric truncate text-3xl leading-none'>
              {latency}
            </span>
            {latency !== '—' ? (
              <span className='text-muted-foreground text-xs'>ms</span>
            ) : null}
          </p>
        </div>

        <div className='shrink-0 text-right'>
          <p className='flex items-center justify-end gap-1.5 text-xs font-medium'>
            <span
              className={cn('size-1.5 rounded-full', visual.dot)}
              aria-hidden='true'
            />
            {t(visual.label)}
          </p>
          <p className='deck-metric mt-1 text-xl leading-none'>
            {availability}
          </p>
          <p className='text-muted-foreground mt-1 text-[11px]'>
            {t('7-day availability')}
          </p>
        </div>
      </div>

      <div className='mt-3 flex min-w-0 items-end gap-2'>
        <span
          className='flex h-7 min-w-0 flex-1 items-end gap-1'
          role='img'
          aria-label={t('Latency')}
        >
          {historyBars.map(({ item, heightClass }) => (
            <span
              key={item.batch_id}
              className={cn(
                'min-w-1 flex-1 rounded-sm',
                heightClass,
                statusVisuals[item.status].bar
              )}
              title={
                'latency_ms' in item && item.latency_ms > 0
                  ? `${item.latency_ms} ms`
                  : undefined
              }
            />
          ))}
        </span>
        <time
          className='text-muted-foreground flex shrink-0 items-center gap-1 text-[11px]'
          title={t('Last checked')}
          dateTime={
            props.status?.last_checked_at
              ? new Date(props.status.last_checked_at * 1000).toISOString()
              : undefined
          }
        >
          <Clock3 className='size-3' aria-hidden='true' />
          {lastChecked}
        </time>
      </div>
    </section>
  )
})
