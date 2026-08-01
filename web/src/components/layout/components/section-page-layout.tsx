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
import { useLocation } from '@tanstack/react-router'
import {
  Children,
  isValidElement,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'

import { Main } from './main'
import { PageFooterProvider } from './page-footer'

type SlotProps = { children?: ReactNode }

function SectionPageLayoutTitle(_props: SlotProps) {
  return null
}
SectionPageLayoutTitle.displayName = 'SectionPageLayout.Title'

function SectionPageLayoutActions(_props: SlotProps) {
  return null
}
SectionPageLayoutActions.displayName = 'SectionPageLayout.Actions'

function SectionPageLayoutContent(_props: SlotProps) {
  return null
}
SectionPageLayoutContent.displayName = 'SectionPageLayout.Content'

function SectionPageLayoutBreadcrumb(_props: SlotProps) {
  return null
}
SectionPageLayoutBreadcrumb.displayName = 'SectionPageLayout.Breadcrumb'

export type SectionPageLayoutProps = {
  children: ReactNode
  fixedContent?: boolean
}

export function SectionPageLayout(props: SectionPageLayoutProps) {
  const pathname = useLocation({ select: (location) => location.pathname })
  const [footerContainer, setFooterContainer] = useState<HTMLDivElement | null>(
    null
  )
  const routeCode = pathname
    .split('/')
    .filter(Boolean)
    .slice(0, 2)
    .join(' / ')
    .toUpperCase()

  let title: ReactNode = null
  let actions: ReactNode = null
  let content: ReactNode = null
  let breadcrumb: ReactNode = null

  Children.forEach(props.children, (node) => {
    if (!isValidElement(node)) return
    const child = node as ReactElement<SlotProps>
    if (child.type === SectionPageLayoutTitle) {
      title = child.props.children
    } else if (child.type === SectionPageLayoutActions) {
      actions = child.props.children
    } else if (child.type === SectionPageLayoutContent) {
      content = child.props.children
    } else if (child.type === SectionPageLayoutBreadcrumb) {
      breadcrumb = child.props.children
    }
  })

  return (
    <PageFooterProvider container={footerContainer}>
      <Main>
        <div className='route-page-heading shrink-0 px-4 py-4 sm:px-6 sm:py-5 lg:px-8'>
          {breadcrumb != null && (
            <div className='mb-2 sm:mb-3'>{breadcrumb}</div>
          )}
          <div className='flex flex-wrap items-end justify-between gap-x-6 gap-y-3'>
            <div className='min-w-0 flex-1'>
              <div className='text-muted-foreground flex items-center gap-2 font-mono text-[9px] tracking-[0.2em] uppercase'>
                <span className='gateway-status-dot size-1.5 shrink-0 rounded-full bg-[var(--deck-signal)]' />
                <span className='truncate'>
                  AIVANTA / {routeCode || 'CONSOLE'}
                </span>
              </div>
              <h1 className='mt-1.5 truncate text-2xl font-normal tracking-[-0.04em] sm:text-[2rem]'>
                {title}
              </h1>
            </div>
            {actions != null && (
              <div className='flex shrink-0 flex-wrap items-center justify-end gap-2'>
                {actions}
              </div>
            )}
          </div>
        </div>

        <div
          className={
            props.fixedContent
              ? 'route-page-content min-h-0 flex-1 overflow-hidden px-4 py-4 sm:px-6 sm:py-5 lg:px-8'
              : 'route-page-content min-h-0 flex-1 overflow-auto px-4 py-4 sm:px-6 sm:py-5 lg:px-8'
          }
        >
          {content}
        </div>

        <div
          ref={setFooterContainer}
          className='route-page-footer shrink-0 border-t px-3 py-2.5 empty:hidden sm:px-4 sm:py-3'
        />
      </Main>
    </PageFooterProvider>
  )
}

SectionPageLayout.Title = SectionPageLayoutTitle
SectionPageLayout.Actions = SectionPageLayoutActions
SectionPageLayout.Content = SectionPageLayoutContent
SectionPageLayout.Breadcrumb = SectionPageLayoutBreadcrumb
