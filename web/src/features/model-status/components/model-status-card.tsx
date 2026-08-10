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
import { Activity, Box, Radio, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { StatusBadge, type StatusVariant } from '@/components/status-badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatEndpointDisplay } from '@/features/models/lib/model-utils'
import { getLobeIcon } from '@/lib/lobe-icon'
import { cn } from '@/lib/utils'

import {
  createModelStatusHistorySlots,
  formatModelStatusCheckedAt,
} from '../lib/model-status'
import type { ModelProbeStatus, ModelStatusItem } from '../types'

const statusStyles: Record<
  ModelProbeStatus,
  { badge: StatusVariant; border: string; bar: string; availability: string }
> = {
  healthy: {
    badge: 'success',
    border: 'border-success/30',
    bar: 'bg-success',
    availability: 'text-success',
  },
  degraded: {
    badge: 'warning',
    border: 'border-warning/35',
    bar: 'bg-warning',
    availability: 'text-warning',
  },
  down: {
    badge: 'danger',
    border: 'border-destructive/35',
    bar: 'bg-destructive',
    availability: 'text-destructive',
  },
  unknown: {
    badge: 'neutral',
    border: 'border-border',
    bar: 'bg-muted-foreground/20',
    availability: 'text-muted-foreground',
  },
}

function statusLabel(status: ModelProbeStatus, t: (key: string) => string) {
  if (status === 'healthy') return t('Healthy')
  if (status === 'degraded') return t('Degraded')
  if (status === 'down') return t('Unavailable')
  return t('Unknown')
}

type ModelStatusCardProps = {
  model: ModelStatusItem
}

export function ModelStatusCard(props: ModelStatusCardProps) {
  const { t, i18n } = useTranslation()
  const model = props.model
  const visual = statusStyles[model.status]
  const history = createModelStatusHistorySlots(model.history)
  const iconKey = model.icon || model.vendor_icon
  const icon = iconKey ? getLobeIcon(iconKey, 30) : null
  const availability =
    model.availability_samples_7d > 0
      ? `${model.availability_7d.toFixed(2)}%`
      : '—'
  const endpoints = (model.supported_endpoint_types ?? [])
    .map((endpoint) => formatEndpointDisplay(endpoint))
    .slice(0, 2)
  const checkedAt = model.last_checked_at
    ? formatModelStatusCheckedAt(
        model.last_checked_at,
        i18n.resolvedLanguage || i18n.language
      )
    : '—'

  return (
    <Card className={cn('gap-0 py-0 shadow-sm', visual.border)}>
      <CardHeader className='grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 border-b px-4 py-4 sm:px-5'>
        <div className='bg-muted/55 flex size-11 shrink-0 items-center justify-center rounded-xl border'>
          {icon ?? <Box className='text-muted-foreground size-5' aria-hidden />}
        </div>
        <div className='min-w-0 pt-0.5'>
          <h2 className='truncate text-base leading-5 font-semibold tracking-[-0.02em]'>
            {model.model_name}
          </h2>
          <div className='mt-2 flex min-w-0 flex-wrap items-center gap-1.5'>
            {model.vendor_name ? (
              <StatusBadge
                label={model.vendor_name}
                variant='info'
                copyable={false}
              />
            ) : null}
            {endpoints.map((endpoint) => (
              <StatusBadge
                key={endpoint}
                label={endpoint}
                variant='neutral'
                copyable={false}
                className='max-w-full font-mono text-[10px]'
              />
            ))}
          </div>
        </div>
        <StatusBadge
          label={statusLabel(model.status, t)}
          variant={visual.badge}
          copyable={false}
          pulse={model.status === 'degraded'}
          className='mt-0.5'
        />
      </CardHeader>

      <CardContent className='space-y-5 px-4 py-5 sm:px-5'>
        <div className='grid grid-cols-2 gap-3'>
          <div className='bg-muted/30 rounded-xl border p-3.5'>
            <div className='text-muted-foreground flex items-center gap-2 text-xs font-medium'>
              <Zap className='size-3.5' aria-hidden />
              {t('Probe latency')}
            </div>
            <div className='mt-3 text-2xl font-semibold tracking-[-0.04em] tabular-nums'>
              {model.latency_ms > 0 ? model.latency_ms : '—'}
              {model.latency_ms > 0 ? (
                <span className='text-muted-foreground ms-1 text-xs font-normal'>
                  ms
                </span>
              ) : null}
            </div>
          </div>
          <div className='bg-muted/30 rounded-xl border p-3.5'>
            <div className='text-muted-foreground flex items-center gap-2 text-xs font-medium'>
              <Radio className='size-3.5' aria-hidden />
              {t('Healthy channels')}
            </div>
            <div className='mt-3 text-2xl font-semibold tracking-[-0.04em] tabular-nums'>
              {model.total_channels > 0
                ? `${model.healthy_channels}/${model.total_channels}`
                : '—'}
            </div>
          </div>
        </div>

        <div className='flex items-end justify-between gap-4 border-y py-4'>
          <div>
            <div className='text-muted-foreground text-xs font-medium'>
              {t('7-day availability')}
            </div>
            <div className='text-muted-foreground mt-1 text-[11px]'>
              {t('Last checked')}: {checkedAt}
            </div>
          </div>
          <div
            className={cn(
              'text-right text-3xl font-semibold tracking-[-0.05em] tabular-nums',
              visual.availability
            )}
          >
            {availability}
          </div>
        </div>

        <div>
          <div className='text-muted-foreground mb-2.5 flex items-center justify-between gap-3 text-[11px] font-medium'>
            <span className='inline-flex items-center gap-1.5'>
              <Activity className='size-3.5' aria-hidden />
              {t('Recent {{count}} probes', { count: history.length })}
            </span>
          </div>
          <div className='overflow-x-auto pb-1'>
            <div
              className='grid min-w-[260px] grid-cols-[repeat(60,minmax(2px,1fr))] items-end gap-1'
              role='img'
              aria-label={t('Recent {{count}} probes', {
                count: history.length,
              })}
            >
              {history.map((probe) => (
                <span
                  key={probe.batch_id}
                  className={cn(
                    'h-7 rounded-full',
                    statusStyles[probe.status].bar
                  )}
                  title={statusLabel(probe.status, t)}
                  aria-hidden='true'
                />
              ))}
            </div>
          </div>
          <div className='text-muted-foreground mt-1 flex justify-between font-mono text-[9px] tracking-[0.16em] uppercase'>
            <span>{t('Past')}</span>
            <span>{t('Now')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
