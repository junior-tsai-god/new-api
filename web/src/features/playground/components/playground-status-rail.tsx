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
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { Separator } from '@/components/ui/separator'

import { API_ENDPOINTS } from '../constants'
import type { PlaygroundAuthMode } from '../types'

type PlaygroundStatusRailProps = {
  authMode: PlaygroundAuthMode
  isLoading: boolean
  model: string
  modelCount: number
}

export function PlaygroundStatusRail(props: PlaygroundStatusRailProps) {
  const { t } = useTranslation()
  const endpoint =
    props.authMode === 'session'
      ? API_ENDPOINTS.SESSION_CHAT_COMPLETIONS
      : API_ENDPOINTS.API_KEY_CHAT_COMPLETIONS

  return (
    <div className='console-overview-rail flex min-w-0 items-center gap-3 overflow-x-auto rounded-xl border px-3 py-2 text-xs'>
      <span className='flex shrink-0 items-center gap-2 font-medium'>
        <span className='bg-success size-1.5 rounded-full' aria-hidden='true' />
        {props.isLoading ? t('Loading...') : t('Ready')}
      </span>
      <Separator orientation='vertical' className='h-4' />
      <span className='min-w-0 shrink-0'>
        <span className='text-muted-foreground'>{t('Model')}</span>{' '}
        <code className='font-medium'>{props.model || t('Select Model')}</code>
      </span>
      <Separator orientation='vertical' className='h-4' />
      <span className='shrink-0'>
        <span className='text-muted-foreground'>{t('Endpoint')}</span>{' '}
        <code>{endpoint}</code>
      </span>
      <Separator orientation='vertical' className='h-4' />
      <span className='text-muted-foreground shrink-0'>
        {props.modelCount} {t('Models')}
      </span>
      <Link
        to='/model-catalog/$section'
        params={{ section: 'status' }}
        className='text-foreground focus-visible:ring-ring ms-auto shrink-0 font-medium underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none'
      >
        {t('View status')}
      </Link>
    </div>
  )
}
