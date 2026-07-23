import { useLocation } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { ConfigDrawer } from '@/components/config-drawer'
import { LanguageSwitcher } from '@/components/language-switcher'
import { NotificationPopover } from '@/components/notification-popover'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
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
import { useNotifications } from '@/hooks/use-notifications'
import { useSidebarView } from '@/hooks/use-sidebar-view'
import { useTopNavLinks } from '@/hooks/use-top-nav-links'

import { defaultTopNavLinks } from '../config/top-nav.config'
import { checkIsActive } from '../lib/url-utils'
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
  // Prioritize dynamically generated links from backend
  const dynamicLinks = useTopNavLinks()
  const links = dynamicLinks.length > 0 ? dynamicLinks : navLinks
  const href = useLocation({ select: (location) => location.href })
  const { view, navGroups } = useSidebarView()

  const routeContext = useMemo(() => {
    for (const group of navGroups) {
      for (const item of group.items) {
        if (checkIsActive(href, item)) {
          return {
            code: (view?.id || group.id || 'route').toUpperCase(),
            group: group.title,
            title: item.title,
          }
        }
      }
    }

    return {
      code: (view?.id || 'route').toUpperCase(),
      group: t('Console'),
      title: t('Overview'),
    }
  }, [href, navGroups, t, view?.id])

  // Notifications hook
  const notifications = useNotifications()

  return (
    <Header>
      <div className='md:hidden'>
        <SystemBrand variant='inline' />
      </div>

      <div className='hidden min-w-0 items-center gap-3 md:flex'>
        <span className='route-header-code flex size-9 shrink-0 items-center justify-center rounded-xl font-mono text-[9px] font-semibold tracking-[0.08em]'>
          {routeContext.code.slice(0, 3)}
        </span>
        <div className='min-w-0 leading-tight'>
          <div className='text-muted-foreground truncate font-mono text-[9px] tracking-[0.2em] uppercase'>
            {routeContext.group} / {routeContext.code}
          </div>
          <div className='mt-1 truncate text-sm font-semibold'>
            {routeContext.title}
          </div>
        </div>
      </div>

      {leftContent ? (
        <div className='ms-2 flex items-center'>{leftContent}</div>
      ) : null}

      {rightContent ?? (
        <div className='ms-auto flex items-center gap-1 sm:gap-1.5'>
          {showTopNav && (
            <div className='me-2 hidden 2xl:block'>
              <TopNav links={links} />
            </div>
          )}
          <div className='route-header-status me-1 hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium lg:flex'>
            <span className='gateway-status-dot bg-success size-1.5 rounded-full' />
            <span>{t('Online')}</span>
            <span className='text-muted-foreground font-mono text-[9px] tracking-[0.14em]'>
              NODE 01
            </span>
          </div>
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
