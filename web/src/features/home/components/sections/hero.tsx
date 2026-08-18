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
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { getModelStatus } from '@/features/model-status/api'

interface HeroProps {
  className?: string
  isAuthenticated?: boolean
}

export function Hero(props: HeroProps) {
  const { t } = useTranslation()
  const statusQuery = useQuery({
    queryKey: ['model-status'],
    queryFn: getModelStatus,
    staleTime: 45 * 1000,
  })
  const statusSummary = useMemo(() => {
    const models = statusQuery.data?.models ?? []
    const healthy = models.filter((model) => model.status === 'healthy').length
    const measured = models.filter((model) => model.latency_ms > 0)
    const latencyTotal = measured.reduce(
      (total, model) => total + model.latency_ms,
      0
    )
    return {
      healthy,
      total: models.length,
      averageLatency:
        measured.length > 0 ? Math.round(latencyTotal / measured.length) : 0,
    }
  }, [statusQuery.data?.models])
  const serviceHealthy =
    !statusQuery.isError &&
    statusSummary.total > 0 &&
    statusSummary.healthy === statusSummary.total
  let serviceLabel = t('Online')
  if (statusQuery.isError) {
    serviceLabel = t('Unknown')
  } else if (serviceHealthy) {
    serviceLabel = t('Healthy')
  }

  return (
    <section className='aivanta-paper-grid relative overflow-hidden px-2 pt-2 md:px-4 md:pt-4'>
      <div className='aivanta-workbench px-3 pt-20 pb-3 sm:px-6 sm:pt-24 sm:pb-6 lg:px-8'>
        <div className='flex flex-wrap items-center justify-between gap-3 border-b border-[var(--aivanta-rule)] py-3 font-mono text-[9px] tracking-[0.16em] uppercase sm:text-[10px]'>
          <span>Aivanta / Gateway</span>
          <span className='flex items-center gap-2'>
            <span
              className='gateway-status-dot size-1.5 rounded-full bg-[var(--aivanta-signal)]'
              aria-hidden='true'
            />
            {t('Model Status')}
          </span>
        </div>

        <div className='grid gap-8 py-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(24rem,0.85fr)] lg:items-center lg:py-12'>
          <div className='max-w-4xl'>
            <p className='mb-4 font-mono text-[10px] tracking-[0.16em] text-[var(--aivanta-faint)] uppercase'>
              {t('Unified API Gateway for')} {t('Vast Range of AI Models')}
            </p>
            <h1 className='text-[clamp(3.25rem,7vw,7rem)] leading-[0.88] font-light tracking-[-0.07em]'>
              {t('One API key. Every model.')}
            </h1>
            <p className='mt-6 max-w-2xl text-base leading-7 text-[var(--aivanta-secondary)] sm:text-lg'>
              {t(
                'Test models in Playground, then use the same API key in your app.'
              )}
            </p>
            <div className='mt-7 flex flex-col gap-2 sm:flex-row'>
              <Button
                size='lg'
                className='justify-between sm:min-w-44'
                render={
                  <Link
                    to={props.isAuthenticated ? '/playground' : '/sign-in'}
                  />
                }
              >
                {t('Start testing')}
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  data-icon='inline-end'
                  strokeWidth={2}
                />
              </Button>
              <Button
                size='lg'
                variant='outline'
                className='sm:min-w-36'
                render={
                  props.isAuthenticated ? (
                    <Link
                      to='/model-catalog/$section'
                      params={{ section: 'catalog' }}
                    />
                  ) : (
                    <Link to='/pricing' />
                  )
                }
              >
                {t('Model Center')}
              </Button>
            </div>
          </div>

          <aside
            className='aivanta-panel overflow-hidden'
            aria-label={t('Model Status')}
          >
            <div className='flex items-center justify-between border-b border-[var(--aivanta-rule)] px-4 py-3 font-mono text-[10px] tracking-[0.14em] uppercase sm:px-5'>
              <span>{t('Model Status')}</span>
              <span className='flex items-center gap-2'>
                <span
                  className={
                    serviceHealthy
                      ? 'bg-success size-1.5 rounded-full'
                      : 'bg-warning size-1.5 rounded-full'
                  }
                  aria-hidden='true'
                />
                {serviceLabel}
              </span>
            </div>
            <div className='grid grid-cols-2 divide-x border-b border-[var(--aivanta-rule)]'>
              <div className='px-4 py-5 sm:px-5'>
                <p className='text-[10px] tracking-[0.12em] text-[var(--aivanta-faint)] uppercase'>
                  {t('Healthy models')}
                </p>
                <p className='deck-metric mt-2 text-4xl'>
                  {statusQuery.isLoading
                    ? '—'
                    : `${statusSummary.healthy}/${statusSummary.total}`}
                </p>
              </div>
              <div className='px-4 py-5 sm:px-5'>
                <p className='text-[10px] tracking-[0.12em] text-[var(--aivanta-faint)] uppercase'>
                  {t('Average latency')}
                </p>
                <p className='deck-metric mt-2 text-4xl'>
                  {statusSummary.averageLatency > 0
                    ? statusSummary.averageLatency
                    : '—'}
                  {statusSummary.averageLatency > 0 ? (
                    <span className='ms-1 font-mono text-xs tracking-normal'>
                      ms
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
            <div className='px-4 py-4 sm:px-5'>
              <p className='text-[10px] tracking-[0.12em] text-[var(--aivanta-faint)] uppercase'>
                {t('Unified endpoint')}
              </p>
              <code className='mt-2 block truncate rounded-lg border border-[var(--aivanta-rule)] bg-[var(--aivanta-paper)] px-3 py-2.5 text-xs'>
                POST /v1/chat/completions
              </code>
              <Link
                to={
                  props.isAuthenticated ? '/model-catalog/$section' : '/pricing'
                }
                params={
                  props.isAuthenticated ? { section: 'catalog' } : undefined
                }
                className='mt-4 inline-flex items-center text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-none'
              >
                {t('View status')}
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
