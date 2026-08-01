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
import { ArrowDown01Icon, ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link, useLocation } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSidebar } from '@/components/ui/sidebar'
import { useSidebarView } from '@/hooks/use-sidebar-view'
import { cn } from '@/lib/utils'

import { checkIsActive } from '../lib/url-utils'
import type {
  NavChatPresets,
  NavCollapsible,
  NavGroup,
  NavItem,
  NavLink,
} from '../types'

function findActiveGroup(groups: NavGroup[], href: string): NavGroup | null {
  const activeGroup = groups.find((group) =>
    group.items.some((item) => checkIsActive(href, item))
  )
  if (activeGroup) return activeGroup

  return groups.find((group) => group.id === 'general') ?? groups.at(0) ?? null
}

function ConsoleModuleLink(props: { item: NavLink; href: string }) {
  const Icon = props.item.icon
  const isActive = checkIsActive(props.href, props.item)

  return (
    <Link
      to={props.item.url}
      data-active={isActive || undefined}
      aria-current={isActive ? 'page' : undefined}
      className='console-module-link focus-visible:ring-ring flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-2'
    >
      {Icon ? <Icon aria-hidden='true' /> : null}
      <span>{props.item.title}</span>
      {props.item.badge ? (
        <span className='console-module-badge'>{props.item.badge}</span>
      ) : null}
    </Link>
  )
}

function ConsoleModuleDropdown(props: { item: NavCollapsible; href: string }) {
  const Icon = props.item.icon
  const isActive = checkIsActive(props.href, props.item)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant='ghost'
            size='sm'
            data-active={isActive || undefined}
            className='console-module-link h-8 shrink-0 rounded-full px-3'
          />
        }
      >
        {Icon ? <Icon data-icon='inline-start' aria-hidden='true' /> : null}
        {props.item.title}
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          data-icon='inline-end'
          strokeWidth={2}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='start'
        className='console-module-menu min-w-56'
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>{props.item.title}</DropdownMenuLabel>
          {props.item.items.map((subItem) => (
            <DropdownMenuItem
              key={`${subItem.title}-${subItem.url}`}
              className={cn(
                'py-2',
                checkIsActive(props.href, subItem) && 'bg-accent'
              )}
              render={<Link to={subItem.url} />}
            >
              {subItem.icon ? <subItem.icon aria-hidden='true' /> : null}
              <span>{subItem.title}</span>
              {subItem.badge ? (
                <span className='ms-auto text-xs'>{subItem.badge}</span>
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ConsoleChatMenuButton(props: { item: NavChatPresets }) {
  const { isMobile, setOpen, setOpenMobile } = useSidebar()

  return (
    <Button
      variant='ghost'
      size='sm'
      className='console-module-link h-8 shrink-0 rounded-full px-3'
      onClick={() => {
        if (isMobile) {
          setOpenMobile(true)
          return
        }
        setOpen(true)
      }}
    >
      {props.item.icon ? (
        <props.item.icon data-icon='inline-start' aria-hidden='true' />
      ) : null}
      {props.item.title}
    </Button>
  )
}

function ConsoleModuleItem(props: { item: NavItem; href: string }) {
  if (props.item.type === 'chat-presets') {
    return <ConsoleChatMenuButton item={props.item as NavChatPresets} />
  }

  if (props.item.items) {
    return (
      <ConsoleModuleDropdown
        item={props.item as NavCollapsible}
        href={props.href}
      />
    )
  }

  return <ConsoleModuleLink item={props.item as NavLink} href={props.href} />
}

export function ConsoleModuleNavigation() {
  const { t } = useTranslation()
  const href = useLocation({ select: (location) => location.href })
  const { view, navGroups } = useSidebarView()
  const activeGroup = findActiveGroup(navGroups, href)
  let groups: NavGroup[] = []
  if (view) {
    groups = navGroups
  } else if (activeGroup) {
    groups = [activeGroup]
  }
  const contextLabel = view?.id ?? activeGroup?.title ?? t('Console')

  return (
    <div className='console-module-bar flex h-[3.35rem] shrink-0 items-center gap-3 border-b px-3 sm:px-5 lg:px-7'>
      <div className='hidden shrink-0 items-center gap-2 font-mono text-[9px] tracking-[0.18em] uppercase lg:flex'>
        <span className='gateway-status-dot size-1.5 rounded-full bg-[var(--deck-signal)]' />
        <span>AIVANTA / {contextLabel}</span>
      </div>

      <nav
        className='no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto'
        aria-label={t('Console')}
      >
        {view ? (
          <Link
            to={view.parent.to}
            className='console-module-link focus-visible:ring-ring flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium outline-none focus-visible:ring-2'
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              className='size-3.5'
              strokeWidth={2}
              aria-hidden='true'
            />
            {t(view.parent.label)}
          </Link>
        ) : null}
        {groups.flatMap((group) =>
          group.items.map((item) => (
            <ConsoleModuleItem
              key={`${group.id ?? group.title}-${item.title}-${item.url ?? item.type}`}
              item={item}
              href={href}
            />
          ))
        )}
      </nav>

      <div className='console-module-status hidden shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-medium md:flex'>
        <span className='bg-success size-1.5 rounded-full' />
        {t('Online')}
      </div>
    </div>
  )
}
