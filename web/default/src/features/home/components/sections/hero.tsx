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
import { ArrowRight01Icon, BookOpen01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

import { GatewayWorkbench } from '../workbench/gateway-workbench'

interface HeroProps {
  className?: string
  isAuthenticated?: boolean
}

export function Hero(props: HeroProps) {
  const { t } = useTranslation()

  const stats = [
    { value: '50+', label: t('upstream services integrated') },
    { value: '100+', label: t('model billing support') },
    { value: '24/7', label: t('Observability') },
  ]

  return (
    <section className='aivanta-paper-grid relative overflow-hidden px-2 pt-2 md:px-4 md:pt-4'>
      <div className='aivanta-workbench px-3 pt-20 pb-3 sm:px-5 sm:pt-24 sm:pb-5 lg:px-6'>
        <div className='flex flex-wrap items-center justify-between gap-3 border-b border-[var(--aivanta-rule)] py-3 font-mono text-[9px] tracking-[0.16em] uppercase sm:text-[10px]'>
          <span>Aivanta / Gateway</span>
          <span className='flex items-center gap-2'>
            <span className='gateway-status-dot size-1.5 rounded-full bg-[var(--aivanta-signal)]' />
            {t('AI Application Infrastructure Foundation')}
          </span>
        </div>

        <div className='grid gap-8 py-7 lg:grid-cols-[minmax(0,1.2fr)_minmax(30rem,0.8fr)] lg:items-end'>
          <div className='max-w-3xl'>
            <p className='mb-3 font-mono text-[10px] tracking-[0.16em] text-[var(--aivanta-faint)] uppercase'>
              {t('Unified API Gateway for')} {t('Vast Range of AI Models')}
            </p>
            <h1 className='text-[clamp(3rem,6vw,5.75rem)] leading-[0.9] font-light tracking-[-0.065em]'>
              {t('Intelligence, connected.')}
            </h1>
          </div>
          <div className='grid grid-cols-3 gap-4 lg:pb-1'>
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className='deck-metric text-3xl leading-none sm:text-4xl'>
                  {stat.value}
                </p>
                <p className='mt-2 text-[10px] leading-relaxed text-[var(--aivanta-secondary)] sm:text-xs'>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
          <div className='flex flex-col justify-center gap-2 sm:flex-row lg:col-span-2'>
            <Button
              size='lg'
              className='justify-between sm:min-w-48'
              render={
                <Link to={props.isAuthenticated ? '/dashboard' : '/sign-in'} />
              }
            >
              {props.isAuthenticated ? t('Enter Console') : t('Sign in')}
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                data-icon='inline-end'
                strokeWidth={2}
              />
            </Button>
            <Button
              size='lg'
              variant='outline'
              className='sm:min-w-40'
              render={<Link to='/pricing' />}
            >
              {t('Model Square')}
            </Button>
          </div>
        </div>

        <div className='mb-3 grid gap-4 rounded-[1.5rem] border border-[var(--aivanta-rule)] bg-[var(--aivanta-panel)] p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center'>
          <div>
            <div className='mb-2 flex items-center justify-between font-mono text-[9px] tracking-[0.12em] uppercase'>
              <span>{t('Routes')}</span>
              <span className='text-[var(--aivanta-faint)]'>
                50+ / {t('Healthy')}
              </span>
            </div>
            <div className='gateway-route-rail grid h-8 grid-cols-[18%_16%_1fr_12%] overflow-hidden rounded-full text-[8px] font-medium'>
              <span className='flex items-center justify-center bg-[var(--aivanta-ink)] text-[var(--aivanta-paper)]'>
                18%
              </span>
              <span className='flex items-center justify-center bg-[var(--aivanta-signal)] text-[var(--aivanta-ink)]'>
                16%
              </span>
              <span className='deck-track-striped' aria-hidden='true' />
              <span className='flex items-center justify-center border border-[var(--aivanta-rule)]'>
                12%
              </span>
            </div>
          </div>
          <div className='grid grid-cols-3 gap-5 font-mono text-[9px] tracking-[0.12em] uppercase'>
            <span>{t('Providers')} / 50+</span>
            <span>{t('Models')} / 100+</span>
            <span>{t('Requests')} / 6.1M</span>
          </div>
        </div>

        <GatewayWorkbench />

        <div className='mt-3 flex flex-col gap-4 rounded-[1.5rem] border border-[var(--aivanta-rule)] bg-[var(--aivanta-panel)] p-4 md:flex-row md:items-center md:justify-between'>
          <p className='max-w-2xl font-mono text-[9px] leading-relaxed text-[var(--aivanta-faint)] uppercase sm:text-[10px]'>
            {t(
              'Supports one-click configuration and perfectly adapts to NewAPI multi-protocol configuration.'
            )}
          </p>
          <div className='flex flex-col gap-2 sm:flex-row'>
            <Button
              className='justify-between'
              render={
                <Link to={props.isAuthenticated ? '/dashboard' : '/sign-in'} />
              }
            >
              {props.isAuthenticated ? t('Enter Console') : t('Sign in')}
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                data-icon='inline-end'
                strokeWidth={2}
              />
            </Button>
            <Button variant='outline' render={<Link to='/docs' />}>
              <HugeiconsIcon
                icon={BookOpen01Icon}
                data-icon='inline-start'
                strokeWidth={2}
              />
              {t('Docs')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
