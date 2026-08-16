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
import {
  AiBrain01Icon,
  ArrowLeft01Icon,
  FlaskConicalIcon,
  Home01Icon,
  Key01Icon,
  Settings02Icon,
  Wallet01Icon,
  WalletAdd01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link, useLocation } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { ConfigDrawer } from '@/components/config-drawer'
import { Button } from '@/components/ui/button'
import { ROLE } from '@/lib/roles'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

import { Header } from './header'

const ADMIN_PATH_PREFIXES = [
  '/channels',
  '/models/metadata',
  '/models/deployments',
  '/users',
  '/redemption-codes',
  '/subscriptions',
  '/architecture',
  '/system-info',
  '/system-settings',
  '/dashboard/flow',
  '/dashboard/users',
]

export function AppHeader() {
  const { t } = useTranslation()
  const pathname = useLocation({ select: (location) => location.pathname })
  const role = useAuthStore((state) => state.auth.user?.role ?? ROLE.GUEST)
  const isAdminWorkspace =
    role >= ROLE.ADMIN &&
    ADMIN_PATH_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  const userNavigation = useMemo(
    () => [
      {
        id: 'overview',
        title: t('Overview'),
        to: '/dashboard' as const,
        icon: Home01Icon,
        matches: ['/dashboard/overview'],
      },
      {
        id: 'playground',
        title: t('Playground'),
        to: '/playground' as const,
        icon: FlaskConicalIcon,
        matches: ['/playground'],
      },
      {
        id: 'keys',
        title: t('API Keys'),
        to: '/keys' as const,
        icon: Key01Icon,
        matches: ['/keys'],
      },
      {
        id: 'models',
        title: t('Models'),
        to: '/model-catalog' as const,
        icon: AiBrain01Icon,
        matches: ['/model-catalog', '/model-status', '/pricing'],
      },
      {
        id: 'usage',
        title: t('Usage & Billing'),
        to: '/usage' as const,
        icon: Wallet01Icon,
        matches: ['/dashboard/models', '/usage-logs', '/wallet'],
      },
    ],
    [t]
  )

  return (
    <Header>
      <nav
        className='console-primary-nav mx-auto hidden items-center gap-0.5 rounded-full border p-1 lg:flex'
        aria-label={t('Workspace')}
      >
        {isAdminWorkspace ? (
          <>
            <Link
              to='/dashboard'
              className='text-muted-foreground hover:text-foreground focus-visible:ring-ring flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium outline-none focus-visible:ring-2'
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                className='size-3.5'
                strokeWidth={1.9}
                aria-hidden='true'
              />
              {t('Back to workspace')}
            </Link>
            <span className='flex h-8 items-center gap-1.5 rounded-full bg-[var(--deck-ink)] px-3 text-xs font-medium text-[var(--deck-panel)]'>
              <HugeiconsIcon
                icon={Settings02Icon}
                className='size-3.5'
                strokeWidth={1.9}
                aria-hidden='true'
              />
              {t('Administration')}
            </span>
          </>
        ) : (
          userNavigation.map((item) => {
            const isActive = item.matches.some(
              (prefix) =>
                pathname === prefix || pathname.startsWith(`${prefix}/`)
            )

            return (
              <Link
                key={item.id}
                to={item.to}
                data-active={isActive || undefined}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'focus-visible:ring-ring flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium outline-none transition-colors focus-visible:ring-2',
                  isActive
                    ? 'bg-[var(--deck-ink)] text-[var(--deck-panel)]'
                    : 'text-muted-foreground hover:bg-[var(--deck-panel)] hover:text-foreground'
                )}
              >
                <HugeiconsIcon
                  icon={item.icon}
                  className='size-3.5'
                  strokeWidth={1.9}
                  aria-hidden='true'
                />
                {item.title}
              </Link>
            )
          })
        )}
      </nav>

      <div className='ms-auto flex items-center gap-1 sm:gap-1.5'>
        <Button
          aria-label={t('Recharge')}
          className='bg-[var(--deck-signal)] text-[var(--deck-ink)] hover:bg-[var(--deck-signal)] hover:brightness-95'
          render={<Link to='/wallet' />}
          size='sm'
        >
          <HugeiconsIcon
            icon={WalletAdd01Icon}
            data-icon='inline-start'
            strokeWidth={2}
          />
          <span className='hidden sm:inline'>{t('Recharge')}</span>
        </Button>
        <ConfigDrawer />
      </div>
    </Header>
  )
}
