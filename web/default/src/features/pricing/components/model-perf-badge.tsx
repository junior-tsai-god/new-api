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
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import { getSuccessRateDotClass } from '@/features/performance-metrics/lib/format'
import { formatTimestampRelative } from '@/lib/format'
import { cn } from '@/lib/utils'

import type { ModelProbeLatency } from '../types'

export type ModelPerfBadgeData = {
  avg_latency_ms: number
  success_rate: number
  avg_tps: number
  recent_success_rates?: number[]
}

export interface ModelPerfBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  perf: ModelPerfBadgeData | undefined
  probe: ModelProbeLatency | undefined
}

function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '—'
  return value > 1 ? String(Math.round(value)) : value.toFixed(1)
}

function formatCompactLatency(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '—'
  if (ms >= 1_000) return `${formatCompactNumber(ms / 1_000)}s`
  return `${formatCompactNumber(ms)}ms`
}

function formatCompactThroughput(tps: number): string {
  if (!Number.isFinite(tps) || tps <= 0) return '—'
  if (tps >= 1_000) return `${formatCompactNumber(tps / 1_000)}Kt`
  return `${formatCompactNumber(tps)}t`
}

export const ModelPerfBadge = memo(function ModelPerfBadge(
  props: ModelPerfBadgeProps
) {
  const { i18n, t } = useTranslation()

  if (!props.perf && !props.probe) {
    return null
  }

  const avgLatencyMs =
    props.probe?.avg_latency_ms ?? props.perf?.avg_latency_ms ?? 0
  const avgTps = props.perf?.avg_tps ?? 0
  const successRate = props.perf?.success_rate ?? Number.NaN

  const recentRates =
    props.perf?.recent_success_rates?.filter((rate) => Number.isFinite(rate)) ??
    []
  const statusRates =
    recentRates.length > 0 ? recentRates.slice(-3) : [successRate]
  const statusBars = [
    ...Array(Math.max(0, 3 - statusRates.length)).fill(null),
    ...statusRates,
  ]
    .slice(-3)
    .map((rate, index) => ({
      rate,
      slot: ['oldest', 'previous', 'latest'][index],
    }))

  return (
    <div
      className={cn(
        'hidden items-start gap-x-2 text-right tabular-nums min-[460px]:flex',
        props.className
      )}
    >
      <div
        title={
          props.probe
            ? t('Average of {{count}} tested channels, last probed {{time}}', {
                count: props.probe.tested_channels,
                time: formatTimestampRelative(
                  props.probe.last_test_time,
                  'seconds',
                  i18n.resolvedLanguage
                ),
              })
            : t('Average latency')
        }
        className='min-w-[38px]'
      >
        <div className='text-muted-foreground/55 text-[10px] leading-4'>
          {props.probe ? t('Probe latency short') : t('Latency short')}
        </div>
        <div className='text-muted-foreground/80 font-mono text-xs leading-4 whitespace-nowrap'>
          {formatCompactLatency(avgLatencyMs)}
        </div>
      </div>
      {props.perf && (
        <>
          <div title={t('Throughput')} className='min-w-[48px]'>
            <div className='text-muted-foreground/55 truncate text-[10px] leading-4'>
              {t('Throughput short')}
            </div>
            <div className='text-muted-foreground/80 font-mono text-xs leading-4 whitespace-nowrap'>
              {formatCompactThroughput(avgTps)}
            </div>
          </div>
          <div
            title={`${t('Success rate')}: ${successRate.toFixed(1)}%`}
            className='min-w-[30px]'
          >
            <div className='text-muted-foreground/55 truncate text-[10px] leading-4'>
              {t('Status short')}
            </div>
            <div className='flex h-4 items-center justify-end gap-0.5'>
              {statusBars.map((bar) => {
                let backgroundClass = getSuccessRateDotClass(bar.rate)
                if (bar.rate == null) {
                  backgroundClass =
                    bar.slot === 'oldest'
                      ? 'bg-muted-foreground/10'
                      : 'bg-muted-foreground/15'
                }

                return (
                  <span
                    key={bar.slot}
                    className={cn(
                      'w-1 rounded-full',
                      bar.slot === 'oldest' && 'h-2',
                      bar.slot === 'previous' && 'h-2.5',
                      bar.slot === 'latest' && 'h-3',
                      backgroundClass
                    )}
                  />
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
})
