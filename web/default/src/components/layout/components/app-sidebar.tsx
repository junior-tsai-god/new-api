import { Link, useLocation } from '@tanstack/react-router'
import { Activity, MessageSquare, Settings2, UserRound } from 'lucide-react'
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
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { AivantaMark } from '@/components/aivanta-brand'
import { Sidebar, SidebarContent, SidebarRail } from '@/components/ui/sidebar'
import { useLayout } from '@/context/layout-provider'
import { useSidebarView } from '@/hooks/use-sidebar-view'
import { MOTION_TRANSITION, MOTION_VARIANTS } from '@/lib/motion'
import { ROLE } from '@/lib/roles'
import { useAuthStore } from '@/stores/auth-store'

import { NavGroup } from './nav-group'
import { SidebarViewHeader } from './sidebar-view-header'

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
  const { collapsible, variant } = useLayout()
  const { key, view, navGroups } = useSidebarView()
  const shouldReduce = useReducedMotion()
  const { t } = useTranslation()
  const pathname = useLocation({ select: (location) => location.pathname })
  const role = useAuthStore((state) => state.auth.user?.role ?? ROLE.GUEST)

  const routeZones = useMemo(
    () => [
      {
        id: 'chat',
        title: t('Chat'),
        to: '/playground' as const,
        icon: MessageSquare,
        matches: ['/playground', '/chat'],
      },
      {
        id: 'general',
        title: t('General'),
        to: '/dashboard' as const,
        icon: Activity,
        matches: ['/dashboard', '/keys', '/usage-logs', '/pricing'],
      },
      {
        id: 'personal',
        title: t('Personal'),
        to: '/wallet' as const,
        icon: UserRound,
        matches: ['/wallet', '/profile'],
      },
      ...(role >= ROLE.ADMIN
        ? [
            {
              id: 'admin',
              title: t('Admin'),
              to: '/channels' as const,
              icon: Settings2,
              matches: [
                '/channels',
                '/models',
                '/users',
                '/redemption-codes',
                '/subscriptions',
                '/architecture',
                '/system-info',
                '/system-settings',
              ],
            },
          ]
        : []),
    ],
    [role, t]
  )

  const activeZoneId =
    routeZones.find((zone) =>
      zone.matches.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
      )
    )?.id ?? 'general'

  return (
    <Sidebar
      collapsible={collapsible}
      variant={variant}
      className='route-sidebar absolute! top-0! bottom-0! left-0! h-full!'
    >
      <div className='route-sidebar-frame flex size-full min-w-0 overflow-hidden'>
        <nav
          className='route-spine hidden w-[4.75rem] shrink-0 flex-col items-center md:flex'
          aria-label={t('Console')}
        >
          <Link
            to='/'
            className='route-spine-brand mt-4 flex size-11 items-center justify-center rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-white/70'
            aria-label={t('Go to home')}
          >
            <AivantaMark className='size-9 rounded-xl' />
          </Link>

          <div className='mt-8 flex w-full flex-1 flex-col items-center gap-2 px-2'>
            {routeZones.map((zone, index) => {
              const Icon = zone.icon
              const isActive = zone.id === activeZoneId

              return (
                <Link
                  key={zone.id}
                  to={zone.to}
                  data-active={isActive || undefined}
                  className='route-zone-link group/zone relative flex w-full flex-col items-center gap-1 rounded-2xl px-1 py-2.5 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/70'
                  aria-current={isActive ? 'page' : undefined}
                  title={zone.title}
                >
                  <span className='route-zone-index font-mono text-[9px] leading-none tabular-nums'>
                    0{index + 1}
                  </span>
                  <Icon className='size-4' aria-hidden='true' />
                  <span className='max-w-full truncate text-[10px] leading-none font-medium'>
                    {zone.title}
                  </span>
                </Link>
              )
            })}
          </div>

          <div
            className='mb-4 flex flex-col items-center gap-2'
            aria-hidden='true'
          >
            <span className='gateway-status-dot bg-warning size-2 rounded-full' />
            <span className='font-mono text-[8px] tracking-[0.2em] text-white/45 [writing-mode:vertical-rl]'>
              AIVANTA
            </span>
          </div>
        </nav>

        <div className='route-directory flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden'>
          <div className='route-directory-heading flex h-[4.75rem] shrink-0 items-center justify-between gap-3 border-b px-4'>
            <div className='min-w-0'>
              <div className='text-muted-foreground font-mono text-[9px] tracking-[0.22em] uppercase'>
                AIVANTA / {view ? view.id : activeZoneId}
              </div>
              <div className='mt-1 truncate text-sm font-semibold'>
                {t('Routing desk')}
              </div>
            </div>
            <span className='route-directory-status flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-medium'>
              <span className='bg-success size-1.5 rounded-full' />
              {t('Online')}
            </span>
          </div>

          {view && <SidebarViewHeader view={view} />}

          <SidebarContent className='py-3'>
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
        </div>
      </div>

      <SidebarRail />
    </Sidebar>
  )
}
