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

import { cn } from '@/lib/utils'

import type { RankingPeriod } from '../types'

const PERIODS: { id: RankingPeriod; labelKey: string }[] = [
  { id: 'today', labelKey: 'Today' },
  { id: 'week', labelKey: 'Week' },
  { id: 'month', labelKey: 'Month' },
  { id: 'year', labelKey: 'Year' },
]

type RankingsHeroProps = {
  period: RankingPeriod
  onPeriodChange: (period: RankingPeriod) => void
}

/**
 * Hero strip for the rankings page. Intentionally minimal — title +
 * subtitle + period tabs only.
 */
export function RankingsHero(props: RankingsHeroProps) {
  const { t } = useTranslation()

  return (
    <section className='grid gap-6 border-b border-[var(--aivanta-rule)] py-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(28rem,1.15fr)] lg:items-end'>
      <div>
        <p className='font-mono text-[10px] tracking-[0.18em] text-[var(--aivanta-faint)] uppercase'>
          Aivanta / {t('Rankings')}
        </p>
        <h1 className='mt-2 text-[clamp(2.5rem,5vw,4.75rem)] leading-[0.95] font-light tracking-[-0.06em]'>
          {t('Rankings')}
        </h1>
      </div>

      <div className='w-full max-w-2xl lg:justify-self-end'>
        <p className='text-muted-foreground/80 max-w-2xl text-sm'>
          {t(
            'Discover the most-used models and rising vendors on the platform, updated from live usage data.'
          )}
        </p>

        <div
          role='tablist'
          aria-label={t('Period')}
          className='mt-4 inline-flex max-w-full flex-wrap items-center gap-1 rounded-full border border-[var(--aivanta-rule)] bg-[var(--aivanta-panel)] p-1'
        >
          {PERIODS.map((period) => {
            const isActive = props.period === period.id
            return (
              <button
                key={period.id}
                role='tab'
                type='button'
                aria-selected={isActive}
                onClick={() => props.onPeriodChange(period.id)}
                className={cn(
                  'focus-visible:ring-ring/40 rounded-full px-3 py-1.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {t(period.labelKey)}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
