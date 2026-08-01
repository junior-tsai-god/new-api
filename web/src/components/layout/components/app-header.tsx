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
  DashboardSquare01Icon,
  Message01Icon,
  Settings02Icon,
  UserCircleIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link, useLocation } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { ConfigDrawer } from '@/components/config-drawer'
import { LanguageSwitcher } from '@/components/language-switcher'
import { NotificationPopover } from '@/components/notification-popover'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { useNotifications } from '@/hooks/use-notifications'
import { useTopNavLinks } from '@/hooks/use-top-nav-links'
import { ROLE } from '@/lib/roles'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

import { defaultTopNavLinks } from '../config/top-nav.config'
import type { TopNavLink } from '../types'
import { Header } from './header'
import { SystemBrand } from './system-brand'
import { TopNav } from './top-nav'

/**
 * General application Header component
 * Integrates navigation bar, search, configuration and profile functions
 *
 * @example
 * // Basic usage
 * <AppHeader />
 *
 * @example
 * // Custom navigation links
 * <AppHeader navLinks={customLinks} />
 *
 * @example
 * // Hide navigation bar and search box
 * <AppHeader showTopNav={false} showSearch={false} />
 *
 * @example
 * // Fully customize left and right content
 * <AppHeader
 *   leftContent={<CustomLeft />}
 *   rightContent={<CustomRight />}
 * />
 */
type AppHeaderProps = {
  /**
   * Custom navigation links, uses default global navigation or dynamically generated from backend if not provided
   */
  navLinks?: TopNavLink[]
  /**
   * Whether to show top navigation bar
   * @default true
   */
  showTopNav?: boolean
  /**
   * Left content, overrides TopNav if provided
   */
  leftContent?: React.ReactNode
  /**
   * Whether to show search box
   * @default true
   */
  showSearch?: boolean
  /**
   * Custom right content, overrides default right content if provided
   */
  rightContent?: React.ReactNode
  /**
   * Whether to show notification button
   * @default true
   */
  showNotifications?: boolean
  /**
   * Whether to show config drawer
   * @default true
   */
  showConfigDrawer?: boolean
  /**
   * Whether to show profile dropdown
   * @default true
   */
  showProfileDropdown?: boolean
}

export function AppHeader({
  navLinks = defaultTopNavLinks,
  showTopNav = true,
  leftContent,
  showSearch = true,
  rightContent,
  showNotifications = true,
  showConfigDrawer = true,
  showProfileDropdown = true,
}: AppHeaderProps) {
  const { t } = useTranslation()
  const dynamicLinks = useTopNavLinks()
  const links = dynamicLinks.length > 0 ? dynamicLinks : navLinks
  const pathname = useLocation({ select: (location) => location.pathname })
  const role = useAuthStore((state) => state.auth.user?.role ?? ROLE.GUEST)
  const notifications = useNotifications()
  const primaryNavigation = useMemo(
    () => [
      {
        id: 'chat',
        title: t('Chat'),
        to: '/playground' as const,
        icon: Message01Icon,
        matches: ['/playground', '/chat', '/chat2link'],
      },
      {
        id: 'console',
        title: t('Console'),
        to: '/dashboard' as const,
        icon: DashboardSquare01Icon,
        matches: ['/dashboard', '/keys', '/usage-logs'],
      },
      {
        id: 'personal',
        title: t('Personal'),
        to: '/wallet' as const,
        icon: UserCircleIcon,
        matches: ['/wallet', '/profile'],
      },
      ...(role >= ROLE.ADMIN
        ? [
            {
              id: 'admin',
              title: t('Admin'),
              to: '/channels' as const,
              icon: Settings02Icon,
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

  return (
    <Header>
      <div className='min-w-0 shrink'>
        <SystemBrand variant='inline' />
      </div>

      {leftContent ? (
        <div className='ms-2 flex items-center'>{leftContent}</div>
      ) : null}

      <nav
        className='console-primary-nav mx-auto hidden items-center gap-0.5 rounded-full border p-1 lg:flex'
        aria-label={t('Console')}
      >
        {primaryNavigation.map((item) => {
          const isActive = item.matches.some(
            (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
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
        })}
      </nav>

      {rightContent ?? (
        <div className='ms-auto flex items-center gap-1 sm:gap-1.5'>
          {showTopNav && links.length > 0 ? (
            <div className='me-2 hidden 2xl:block'>
              <TopNav links={links} />
            </div>
          ) : null}
          {showSearch && <Search />}
          {showNotifications && (
            <NotificationPopover
              open={notifications.popoverOpen}
              onOpenChange={notifications.setPopoverOpen}
              unreadCount={notifications.unreadCount}
              activeTab={notifications.activeTab}
              onTabChange={notifications.setActiveTab}
              notice={notifications.notice}
              announcements={notifications.announcements}
              loading={notifications.loading}
            />
          )}
          <LanguageSwitcher />
          {showConfigDrawer && <ConfigDrawer />}
          {showProfileDropdown && <ProfileDropdown />}
        </div>
      )}
    </Header>
  )
}
