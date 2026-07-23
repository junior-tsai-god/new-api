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

import {
  AIVANTA_BRAND_NAME,
  AivantaBrand,
  AivantaMark,
} from '@/components/aivanta-brand'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useStatus } from '@/hooks/use-status'
import { useSystemConfig } from '@/hooks/use-system-config'
import { cn } from '@/lib/utils'

type SystemBrandProps = {
  defaultName?: string
  defaultVersion?: string
  /**
   * Visual layout:
   * - 'sidebar': stacked card style (used inside the sidebar header).
   * - 'inline': compact horizontal pill (used inside the top app bar).
   */
  variant?: 'sidebar' | 'inline'
}

/**
 * System brand component
 * Displays current system logo + name.
 * - inline: compact pill in the top app bar; clicking navigates to home (/)
 * - sidebar: stacked card in the sidebar header (display only)
 */
export function SystemBrand(props: SystemBrandProps) {
  const { t } = useTranslation()
  const { status } = useStatus()
  const { systemName, logo } = useSystemConfig()

  const variant = props.variant ?? 'sidebar'
  const name = systemName || props.defaultName || AIVANTA_BRAND_NAME
  const version =
    status?.version || props.defaultVersion || t('Unknown version')

  if (variant === 'inline') {
    return (
      <Link
        to='/'
        aria-label={t('Go to home')}
        className={cn(
          'text-foreground bg-card/65 inline-flex h-9 items-center gap-1.5 rounded-full border px-2.5 text-sm font-medium transition-colors outline-none select-none',
          'hover:bg-card focus-visible:ring-ring/40 focus-visible:ring-2'
        )}
      >
        <AivantaBrand
          projectName={name}
          projectLogo={logo}
          markClassName='size-6 rounded-full'
          nameClassName='text-sm'
        />
      </Link>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size='lg'
          className='hover:text-sidebar-foreground active:text-sidebar-foreground cursor-default hover:bg-transparent active:bg-transparent'
          render={<div />}
        >
          <AivantaMark className='size-8 rounded-lg' />
          <div className='grid flex-1 text-start text-sm leading-tight group-data-[collapsible=icon]:hidden'>
            <span className='truncate font-semibold'>{AIVANTA_BRAND_NAME}</span>
            <span className='text-muted-foreground flex min-w-0 items-center gap-1 truncate text-[10px]'>
              <img
                src={logo}
                alt=''
                className='size-2.5 shrink-0 rounded-[0.2rem] object-cover'
              />
              <span className='truncate'>{name}</span>
              <span aria-hidden='true'>·</span>
              <span className='truncate'>{version}</span>
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
