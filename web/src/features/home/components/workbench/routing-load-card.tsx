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

import { Badge } from '@/components/ui/badge'

const LOAD_VALUES = [
  { day: '01', value: 34, className: 'h-[34%]' },
  { day: '02', value: 58, className: 'h-[58%]' },
  { day: '03', value: 43, className: 'h-[43%]' },
  { day: '04', value: 72, className: 'h-[72%]' },
  { day: '05', value: 52, className: 'h-[52%]' },
  {
    day: '06',
    value: 86,
    className: 'h-[86%] bg-[var(--aivanta-signal)]!',
  },
  { day: '07', value: 64, className: 'h-[64%]' },
] as const

export function RoutingLoadCard() {
  const { t } = useTranslation()

  return (
    <article className='aivanta-panel flex min-h-72 flex-col p-5 lg:col-start-2 lg:row-start-1'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h2 className='text-lg font-semibold tracking-[-0.025em]'>
            {t('Requests')}
          </h2>
          <p className='mt-1 text-xs text-[var(--aivanta-secondary)]'>
            {t('Lightning Fast')}
          </p>
        </div>
        <span className='font-mono text-[9px] tracking-[0.14em] text-[var(--aivanta-faint)] uppercase'>
          7D / API
        </span>
      </div>

      <div className='mt-5 flex items-baseline gap-3'>
        <span className='deck-metric text-5xl leading-none'>6.1M</span>
        <Badge className='bg-[var(--aivanta-signal)] font-mono text-[9px] text-[var(--aivanta-ink)]'>
          +18%
        </Badge>
      </div>

      <div
        aria-label={t('Requests')}
        className='mt-auto flex h-28 items-end justify-between gap-2 pt-5'
      >
        {LOAD_VALUES.map((item) => (
          <div key={item.day} className='flex h-full flex-1 items-end'>
            <span
              aria-hidden='true'
              className={`gateway-load-bar w-full rounded-full bg-[var(--aivanta-ink)] ${item.className}`}
            />
          </div>
        ))}
      </div>
      <div className='mt-3 flex justify-between font-mono text-[9px] text-[var(--aivanta-faint)]'>
        <span>01</span>
        <span>04</span>
        <span>07</span>
      </div>
    </article>
  )
}
