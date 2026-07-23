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

import { AivantaMark } from '@/components/aivanta-brand'
import { Badge } from '@/components/ui/badge'

const PROVIDERS = [
  { name: 'OpenAI', index: '01' },
  { name: 'Claude', index: '02' },
  { name: 'Gemini', index: '03' },
  { name: 'DeepSeek', index: '04' },
] as const

export function ModelPoolCard() {
  const { t } = useTranslation()

  return (
    <article className='aivanta-panel flex min-h-72 flex-col overflow-hidden lg:col-start-1 lg:row-start-1'>
      <div className='aivanta-signal-section flex items-start justify-between p-4'>
        <div>
          <p className='font-mono text-[9px] tracking-[0.16em] uppercase'>
            {t('Model Access')}
          </p>
          <p className='deck-metric mt-4 text-4xl leading-none'>100+</p>
          <p className='mt-2 max-w-40 text-xs leading-relaxed opacity-70'>
            {t('model billing support')}
          </p>
        </div>
        <AivantaMark className='size-10' />
      </div>

      <div className='flex flex-1 flex-col p-4'>
        <div className='mb-3 flex items-center justify-between'>
          <h2 className='text-sm font-semibold'>{t('Providers')}</h2>
          <Badge variant='secondary'>{t('Healthy')}</Badge>
        </div>
        <div className='grid grid-cols-2 gap-2'>
          {PROVIDERS.map((provider) => (
            <div
              key={provider.name}
              className='flex min-h-10 items-center justify-between rounded-xl border border-[var(--aivanta-rule)] px-3 font-mono text-[10px]'
            >
              <span>{provider.name}</span>
              <span className='text-[var(--aivanta-faint)]'>
                {provider.index}
              </span>
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}
