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

import { AIVANTA_BRAND_NAME, AivantaMark } from '@/components/aivanta-brand'

const PROVIDERS = ['OpenAI', 'Claude', 'Gemini', 'DeepSeek']
const OUTPUTS = ['Chat', 'Apps', 'Models', 'Usage']

export function AivantaRoutingMap() {
  const { t } = useTranslation()

  return (
    <div className='aivanta-panel overflow-hidden'>
      <div className='flex items-center justify-between border-b border-[var(--aivanta-rule)] px-5 py-4 font-mono text-[10px] tracking-[0.16em] uppercase sm:px-6'>
        <span>{t('Routes')} / 01</span>
        <span className='flex items-center gap-2'>
          <span className='size-1.5 rounded-full bg-[var(--aivanta-signal)]' />
          {t('Healthy')}
        </span>
      </div>

      <div className='relative p-4 sm:p-6'>
        <span
          aria-hidden='true'
          className='absolute top-[12%] bottom-[12%] left-1/2 w-px -translate-x-1/2 bg-[var(--aivanta-signal)] md:top-1/2 md:right-[10%] md:bottom-auto md:left-[10%] md:h-2 md:w-auto md:translate-x-0 md:rounded-full'
        />

        <div className='relative grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(13rem,0.72fr)_minmax(0,1fr)] md:items-center md:gap-10'>
          <div className='relative rounded-2xl bg-[var(--aivanta-panel)] p-4 md:mr-2'>
            <div className='mb-4 flex items-center justify-between font-mono text-[9px] tracking-[0.16em] uppercase sm:text-[10px]'>
              <span>{t('Providers')}</span>
              <span className='text-[var(--aivanta-faint)]'>IN / 04</span>
            </div>
            <div className='grid grid-cols-2 gap-2'>
              {PROVIDERS.map((provider, index) => (
                <div
                  key={provider}
                  className='flex min-h-12 items-center justify-between rounded-xl border border-[var(--aivanta-rule)] px-3 font-mono text-[10px] sm:min-h-14 sm:text-xs'
                >
                  <span>{provider}</span>
                  <span className='text-[var(--aivanta-faint)]'>
                    0{index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className='aivanta-signal-section relative mx-auto flex min-h-52 w-full max-w-72 flex-col justify-between rounded-3xl p-5 sm:min-h-60 sm:p-6 md:max-w-none'>
            <div className='flex items-start justify-between'>
              <AivantaMark className='size-10' />
              <span className='font-mono text-[9px] tracking-[0.14em] uppercase'>
                CORE / 01
              </span>
            </div>
            <div>
              <p className='deck-metric text-5xl leading-none sm:text-6xl'>
                128
                <span className='ml-1 font-mono text-xs tracking-normal'>
                  ms
                </span>
              </p>
              <div className='mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3 font-mono text-[9px] tracking-[0.12em] uppercase'>
                <span>{AIVANTA_BRAND_NAME}</span>
                <span>{t('Routes')}</span>
              </div>
            </div>
          </div>

          <div className='relative rounded-2xl bg-[var(--aivanta-panel)] p-4 md:ml-2'>
            <div className='mb-4 flex items-center justify-between font-mono text-[9px] tracking-[0.16em] uppercase sm:text-[10px]'>
              <span>{t('Apps')}</span>
              <span className='text-[var(--aivanta-faint)]'>OUT / 04</span>
            </div>
            <div className='grid grid-cols-2 gap-2'>
              {OUTPUTS.map((output, index) => (
                <div
                  key={output}
                  className='flex min-h-12 items-center justify-between rounded-xl border border-[var(--aivanta-rule)] px-3 font-mono text-[10px] sm:min-h-14 sm:text-xs'
                >
                  <span>{t(output)}</span>
                  <span className='flex items-center gap-2'>
                    <span className='text-[var(--aivanta-faint)]'>
                      0{index + 1}
                    </span>
                    <span className='size-1.5 rounded-full bg-[var(--aivanta-signal)]' />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-3 border-t border-[var(--aivanta-rule)] px-5 py-4 font-mono uppercase sm:px-6'>
        <div>
          <p className='text-[8px] tracking-[0.12em] text-[var(--aivanta-faint)] sm:text-[9px]'>
            {t('Requests')}
          </p>
          <p className='mt-1 text-xs sm:text-sm'>128ms</p>
        </div>
        <div className='text-center'>
          <p className='text-[8px] tracking-[0.12em] text-[var(--aivanta-faint)] sm:text-[9px]'>
            {t('Providers')}
          </p>
          <p className='mt-1 text-xs sm:text-sm'>50+</p>
        </div>
        <div className='text-right'>
          <p className='text-[8px] tracking-[0.12em] text-[var(--aivanta-faint)] sm:text-[9px]'>
            {t('Observability')}
          </p>
          <p className='mt-1 text-xs sm:text-sm'>24 / 7</p>
        </div>
      </div>
    </div>
  )
}
