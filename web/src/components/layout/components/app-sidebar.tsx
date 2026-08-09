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
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { useSidebarView } from '@/hooks/use-sidebar-view'
import { MOTION_TRANSITION, MOTION_VARIANTS } from '@/lib/motion'

import { NavGroup } from './nav-group'
import { SidebarViewHeader } from './sidebar-view-header'
import { SystemBrand } from './system-brand'

/**
 * Application sidebar.
 *
 * Adopts the Vercel / Cloudflare "drill-in" pattern: the URL drives
 * which sidebar *view* is rendered. Clicking a top-level entry like
 * `System Settings` swaps the sidebar to a contextual workspace —
 * with a `← Back to Dashboard` affordance — instead of stacking the
 * sub-navigation inside the root tree.
 *
 * Architecture:
 *   - View resolution + filtering: {@link useSidebarView}
 *   - View registry: `layout/lib/sidebar-view-registry.ts`
 *   - Per-view header: {@link SidebarViewHeader}
 *
 * Adding a new nested view only requires registering a {@link SidebarView}
 * in the registry; this component requires no changes.
 */
export function AppSidebar() {
  const { key, view, navGroups } = useSidebarView()
  const shouldReduce = useReducedMotion()
  const { t } = useTranslation()

  return (
    <Sidebar
      collapsible='offcanvas'
      variant='sidebar'
      className='console-menu-sidebar absolute! top-0! bottom-0! h-full!'
    >
      <div className='console-menu-frame flex size-full min-w-0 flex-col overflow-hidden'>
        <div className='console-menu-heading flex h-[var(--app-header-height,4.75rem)] shrink-0 items-center justify-between gap-3 border-b px-4'>
          <SystemBrand variant='inline' />
          <SidebarTrigger
            variant='outline'
            className='size-9 rounded-full'
            aria-label={t('Workspace')}
          />
        </div>

        {view ? <SidebarViewHeader view={view} /> : null}

        <SidebarContent className='px-1 py-3'>
          <AnimatePresence mode='wait' initial={false}>
            <motion.div
              key={key}
              initial={
                shouldReduce ? false : MOTION_VARIANTS.sidebarSlide.initial
              }
              animate={MOTION_VARIANTS.sidebarSlide.animate}
              exit={
                shouldReduce ? undefined : MOTION_VARIANTS.sidebarSlide.exit
              }
              transition={MOTION_TRANSITION.fast}
              className='flex flex-col'
            >
              {navGroups.map((props, index) => (
                <NavGroup
                  key={props.id || props.title}
                  routeIndex={index + 1}
                  {...props}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </SidebarContent>

        <SidebarFooter className='border-t px-4 py-3'>
          <div className='flex items-center justify-between gap-3 text-xs'>
            <span className='text-muted-foreground'>{t('Workspace')}</span>
            <span className='flex items-center gap-2 font-medium'>
              <span className='gateway-status-dot bg-success size-1.5 rounded-full' />
              {t('Online')}
            </span>
          </div>
        </SidebarFooter>
      </div>
    </Sidebar>
  )
}
