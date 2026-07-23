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

export function HowItWorks() {
  const { t } = useTranslation()
  const steps = [
    {
      number: '01',
      title: t('Configure'),
      description: t(
        'Add your API keys, set up channels and configure access permissions'
      ),
    },
    {
      number: '02',
      title: t('Connect'),
      description: t(
        'Connect through OpenAI, Claude, Gemini, and other compatible API routes'
      ),
    },
    {
      number: '03',
      title: t('Monitor'),
      description: t(
        'Track usage, costs and performance with real-time analytics'
      ),
    },
  ]

  return (
    <section className='aivanta-home-section aivanta-ink-section mx-auto mt-4 w-[min(calc(100%_-_1rem),96rem)] rounded-[2rem] py-16 md:py-24'>
      <div className='px-4 sm:px-6 lg:px-8'>
        <AnimateInView className='grid gap-8 pb-12 md:grid-cols-12 md:pb-16'>
          <p className='font-mono text-[10px] tracking-[0.18em] uppercase md:col-span-3'>
            {t('How It Works')} / 01—03
          </p>
          <h2 className='max-w-4xl text-4xl leading-[0.95] font-light tracking-[-0.055em] sm:text-6xl md:col-span-8 md:col-start-5'>
            {t('Three steps to get started')}
          </h2>
        </AnimateInView>

        <div className='relative grid overflow-hidden rounded-3xl border border-[var(--aivanta-rule)] md:grid-cols-3'>
          <span
            aria-hidden='true'
            className='aivanta-route-thread absolute top-12 right-0 left-0 hidden h-px md:block'
          />
          {steps.map((step, index) => (
            <AnimateInView
              key={step.number}
              animation='fade-up'
              delay={index * 100}
              className='relative border-b border-[var(--aivanta-rule)] p-8 md:min-h-72 md:border-r md:border-b-0 md:last:border-r-0'
            >
              <div className='mb-12 flex items-center gap-3 font-mono text-[10px] tracking-[0.16em] uppercase'>
                <span className='size-2 rounded-full bg-[var(--aivanta-signal)]' />
                {step.number}
              </div>
              <h3 className='text-2xl font-semibold tracking-[-0.035em]'>
                {step.title}
              </h3>
              <p className='mt-4 max-w-sm text-sm leading-relaxed text-[var(--aivanta-secondary)]'>
                {step.description}
              </p>
            </AnimateInView>
          ))}
        </div>

        <AnimateInView className='grid gap-6 border-b border-[var(--aivanta-rule)] py-6 font-mono text-[10px] md:grid-cols-12'>
          <span className='tracking-[0.16em] uppercase md:col-span-3'>
            Request / Example
          </span>
          <code className='overflow-x-auto text-[var(--aivanta-secondary)] md:col-span-8 md:col-start-5'>
            curl /v1/chat/completions -H &quot;Authorization: Bearer ••••&quot;
          </code>
        </AnimateInView>
      </div>
    </section>
  )
}
