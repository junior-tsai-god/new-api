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

export const AIVANTA_BRAND_NAME = 'Aivanta'

type AivantaMarkProps = {
  className?: string
}

type AivantaBrandProps = {
  className?: string
  markClassName?: string
  nameClassName?: string
  projectName?: string
  projectLogo?: string
  showProjectAttribution?: boolean
}

export function AivantaMark(props: AivantaMarkProps) {
  return (
    <span
      aria-hidden='true'
      className={cn(
        'relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md',
        props.className
      )}
    >
      <svg viewBox='0 0 36 36' className='size-full' fill='none'>
        <rect
          width='36'
          height='36'
          rx='6'
          fill='var(--aivanta-mark, oklch(0.68 0.19 42))'
        />
        <path
          d='M10.2 25.5 17.1 9.8c.3-.7 1.3-.7 1.6 0l7.1 15.7M13.2 20.2h9.6'
          stroke='var(--aivanta-mark-ink, oklch(0.18 0.02 55))'
          strokeWidth='2.6'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <circle
          cx='26.1'
          cy='10.4'
          r='1.7'
          fill='var(--aivanta-mark-ink, oklch(0.18 0.02 55))'
        />
      </svg>
    </span>
  )
}

export function AivantaBrand(props: AivantaBrandProps) {
  const { t } = useTranslation()
  const showProjectAttribution = props.showProjectAttribution === true
  const hasProjectAttribution = showProjectAttribution && !!props.projectName

  return (
    <span
      className={cn(
        'inline-flex min-w-0 items-center gap-2.5',
        props.className
      )}
    >
      <AivantaMark className={props.markClassName} />
      <span className='grid min-w-0 leading-none'>
        <span
          className={cn(
            'truncate text-base font-semibold tracking-[-0.025em]',
            props.nameClassName
          )}
        >
          {AIVANTA_BRAND_NAME}
        </span>
        {hasProjectAttribution && (
          <span className='text-muted-foreground mt-1 flex min-w-0 items-center gap-1 text-[9px] leading-none font-medium tracking-wide'>
            {props.projectLogo && (
              <img
                src={props.projectLogo}
                alt=''
                className='size-2.5 shrink-0 rounded-[0.2rem] object-cover'
              />
            )}
            <span className='truncate'>
              {t('Powered by {{name}}', { name: props.projectName })}
            </span>
          </span>
        )}
      </span>
    </span>
  )
}
