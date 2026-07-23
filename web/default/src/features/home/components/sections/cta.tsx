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
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { AivantaMark } from '@/components/aivanta-brand'
import { AnimateInView } from '@/components/animate-in-view'
import { Button } from '@/components/ui/button'

interface CTAProps {
  className?: string
  isAuthenticated?: boolean
}

export function CTA(props: CTAProps) {
  const { t } = useTranslation()

  return (
    <section className='aivanta-home-section aivanta-signal-section mx-auto mt-4 w-[min(calc(100%_-_1rem),96rem)] rounded-[2rem]'>
      <AnimateInView className='grid gap-12 px-5 py-16 sm:px-8 md:grid-cols-12 md:items-end md:py-20 lg:px-10'>
        <div className='md:col-span-2'>
          <AivantaMark className='size-12' />
        </div>
        <div className='md:col-span-7'>
          <h2 className='text-5xl leading-[0.88] font-light tracking-[-0.065em] sm:text-7xl'>
            {t('Ready to simplify')}
            <br />
            {t('your AI integration?')}
          </h2>
        </div>
        <div className='flex flex-col gap-3 sm:flex-row md:col-span-3 md:flex-col'>
          <Button
            size='lg'
            className='w-full justify-between'
            render={
              <Link to={props.isAuthenticated ? '/dashboard' : '/sign-up'} />
            }
          >
            {props.isAuthenticated ? t('Go to Dashboard') : t('Get Started')}
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              data-icon='inline-end'
              strokeWidth={2}
            />
          </Button>
          <Button
            size='lg'
            variant='outline'
            className='w-full justify-between'
            render={<Link to='/pricing' />}
          >
            {t('View Pricing')}
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              data-icon='inline-end'
              strokeWidth={2}
            />
          </Button>
        </div>
      </AnimateInView>
    </section>
  )
}
