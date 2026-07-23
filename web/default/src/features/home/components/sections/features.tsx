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

import { AnimateInView } from '@/components/animate-in-view'

interface FeaturesProps {
  className?: string
}

const PROVIDERS = ['OpenAI', 'Claude', 'Gemini', 'DeepSeek', 'Qwen', 'Llama']

export function Features(_props: FeaturesProps) {
  const { t } = useTranslation()

  return (
    <section className='aivanta-home-section mx-auto mt-4 w-[min(calc(100%_-_1rem),96rem)] rounded-[2rem] border border-[var(--aivanta-rule)] bg-[var(--aivanta-paper)] px-4 py-16 sm:px-6 md:py-24 lg:px-8'>
      <AnimateInView className='grid gap-8 pb-12 md:grid-cols-12 md:pb-16'>
        <p className='font-mono text-[10px] tracking-[0.18em] uppercase md:col-span-3'>
          {t('Core Features')} / 01—03
        </p>
        <h2 className='max-w-4xl text-4xl leading-[0.95] font-light tracking-[-0.055em] sm:text-6xl md:col-span-8 md:col-start-5'>
          {t('Built for developers,')} {t('designed for scale')}
        </h2>
      </AnimateInView>

      <AnimateInView
        animation='fade-up'
        className='aivanta-panel grid gap-8 p-6 md:grid-cols-12 md:p-8'
      >
        <span className='deck-metric text-6xl leading-none text-[var(--aivanta-signal)] md:col-span-2 md:text-7xl'>
          01
        </span>
        <div className='md:col-span-4'>
          <h3 className='text-2xl font-semibold tracking-[-0.035em]'>
            {t('Lightning Fast')}
          </h3>
          <p className='mt-4 max-w-sm text-sm leading-relaxed text-[var(--aivanta-secondary)]'>
            {t(
              'Optimized network architecture ensures millisecond response times'
            )}
          </p>
        </div>
        <div className='md:col-span-6'>
          <div className='grid grid-cols-2 border-t border-l border-[var(--aivanta-rule)] sm:grid-cols-3'>
            {PROVIDERS.map((provider, index) => (
              <div
                key={provider}
                className='flex items-center justify-between border-r border-b border-[var(--aivanta-rule)] px-3 py-4 font-mono text-[10px] uppercase sm:text-xs'
              >
                <span>{provider}</span>
                <span className='text-[var(--aivanta-faint)]'>
                  0{index + 1}
                </span>
              </div>
            ))}
          </div>
          <div className='flex items-center justify-between border-b border-[var(--aivanta-rule)] py-4 font-mono text-[10px] sm:text-xs'>
            <code>POST /v1/chat/completions</code>
            <span className='text-[var(--aivanta-signal)]'>128ms</span>
          </div>
        </div>
      </AnimateInView>

      <AnimateInView
        animation='fade-up'
        className='aivanta-panel mt-4 grid gap-8 p-6 md:grid-cols-12 md:p-8'
      >
        <span className='deck-metric text-6xl leading-none text-[var(--aivanta-signal)] md:col-span-2 md:text-7xl'>
          02
        </span>
        <div className='md:col-span-4'>
          <h3 className='text-2xl font-semibold tracking-[-0.035em]'>
            {t('Transparent Billing')}
          </h3>
          <p className='mt-4 max-w-sm text-sm leading-relaxed text-[var(--aivanta-secondary)]'>
            {t('Pay-as-you-go with real-time usage monitoring')}
          </p>
        </div>
        <div className='md:col-span-6'>
          <div className='flex items-end justify-between border-b border-[var(--aivanta-rule)] pb-5'>
            <div>
              <p className='font-mono text-[9px] tracking-[0.16em] uppercase'>
                {t('Usage')} / 30D
              </p>
              <p className='mt-3 font-mono text-5xl tracking-[-0.06em] tabular-nums sm:text-7xl'>
                $24.80
              </p>
            </div>
            <span className='font-mono text-[10px] text-[var(--aivanta-signal)] uppercase'>
              {t('Cost Tracking')}
            </span>
          </div>
          <svg
            aria-hidden='true'
            viewBox='0 0 600 120'
            preserveAspectRatio='none'
            className='mt-5 h-28 w-full'
          >
            <path
              d='M0 96 C70 94 72 68 145 70 S230 82 295 52 390 62 445 28 535 40 600 12'
              fill='none'
              stroke='var(--aivanta-signal)'
              strokeWidth='2'
              vectorEffect='non-scaling-stroke'
            />
            <path
              d='M0 119 H600 M0 80 H600 M0 40 H600'
              fill='none'
              stroke='var(--aivanta-rule)'
              strokeWidth='1'
              vectorEffect='non-scaling-stroke'
            />
          </svg>
        </div>
      </AnimateInView>

      <AnimateInView
        animation='fade-up'
        className='aivanta-panel mt-4 grid gap-8 p-6 md:grid-cols-12 md:p-8'
      >
        <span className='deck-metric text-6xl leading-none text-[var(--aivanta-signal)] md:col-span-2 md:text-7xl'>
          03
        </span>
        <div className='md:col-span-4'>
          <h3 className='text-2xl font-semibold tracking-[-0.035em]'>
            {t('Secure & Reliable')}
          </h3>
          <p className='mt-4 max-w-sm text-sm leading-relaxed text-[var(--aivanta-secondary)]'>
            {t(
              'Enterprise-grade security with comprehensive permission management'
            )}
          </p>
        </div>
        <div className='md:col-span-6'>
          {[t('API Keys'), t('Rate Limiting'), t('Team Collaboration')].map(
            (item, index) => (
              <div
                key={item}
                className='flex items-center justify-between border-b border-[var(--aivanta-rule)] py-4'
              >
                <span className='text-sm font-medium'>{item}</span>
                <span className='font-mono text-[10px] text-[var(--aivanta-signal)] uppercase'>
                  0{index + 1} / {t('Healthy')}
                </span>
              </div>
            )
          )}
        </div>
      </AnimateInView>
    </section>
  )
}
