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

export function LatencyCard() {
  const { t } = useTranslation()

  return (
    <article className='aivanta-panel flex min-h-72 flex-col p-5 lg:col-start-3 lg:row-start-1'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h2 className='text-lg font-semibold tracking-[-0.025em]'>
            {t('Latency')}
          </h2>
          <p className='mt-1 text-xs text-[var(--aivanta-secondary)]'>
            {t(
              'Optimized network architecture ensures millisecond response times'
            )}
          </p>
        </div>
        <Badge variant='secondary'>{t('Healthy')}</Badge>
      </div>

      <div className='gateway-latency-ring relative mx-auto mt-4 flex size-40 items-center justify-center rounded-full'>
        <div className='absolute inset-4 rounded-full bg-[var(--aivanta-panel)]' />
        <div className='relative text-center'>
          <p className='deck-metric text-4xl leading-none'>128</p>
          <p className='mt-1 font-mono text-[9px] tracking-[0.14em] text-[var(--aivanta-faint)] uppercase'>
            ms / p95
          </p>
        </div>
      </div>

      <div className='mt-auto flex items-center justify-between pt-4 font-mono text-[9px] tracking-[0.12em] uppercase'>
        <span>{t('Routes')}</span>
        <span className='text-[var(--aivanta-faint)]'>50+</span>
      </div>
    </article>
  )
}
