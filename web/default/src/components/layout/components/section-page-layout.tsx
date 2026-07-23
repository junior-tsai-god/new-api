import { useLocation } from '@tanstack/react-router'
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
        <div className='route-page-heading shrink-0 px-4 pt-5 pb-3 sm:px-6 sm:pt-7 sm:pb-4 lg:px-8'>
          {breadcrumb != null && (
            <div className='mb-2 sm:mb-3'>{breadcrumb}</div>
          )}
          <div className='flex flex-wrap items-end justify-between gap-x-4 gap-y-3'>
            <div className='flex min-w-0 flex-1 items-stretch gap-3 sm:gap-4'>
              <div className='route-page-index hidden w-11 shrink-0 flex-col items-center justify-center rounded-2xl sm:flex'>
                <span className='font-mono text-[9px] tracking-[0.12em]'>
                  RT
                </span>
                <span className='mt-0.5 font-mono text-xs font-semibold'>
                  01
                </span>
              </div>
              <div className='min-w-0 flex-1'>
                <div className='text-muted-foreground truncate font-mono text-[9px] tracking-[0.2em] uppercase'>
                  ROUTE / {routeCode || 'CONSOLE'}
                </div>
                <h2 className='mt-1 truncate text-2xl font-normal tracking-[-0.04em] sm:text-3xl'>
                  {title}
                </h2>
                <div className='route-page-track mt-3 flex h-1.5 w-full max-w-md overflow-hidden rounded-full'>
                  <span className='bg-warning w-2/5 rounded-full' />
                  <span className='route-page-track-stripes flex-1' />
                </div>
              </div>
            </div>
            {actions != null && (
              <div className='flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-x-4'>
                {actions}
              </div>
            )}
          </div>
        </div>

        <div
          className={
            props.fixedContent
              ? 'route-page-content min-h-0 flex-1 overflow-hidden px-4 pt-1 pb-4 sm:px-6 sm:pb-6 lg:px-8'
              : 'route-page-content min-h-0 flex-1 overflow-auto px-4 pt-1 pb-4 sm:px-6 sm:pb-6 lg:px-8'
          }
        >
          {content}
        </div>

        <div
          ref={setFooterContainer}
          className='bg-background shrink-0 border-t px-3 py-2.5 empty:hidden sm:px-4 sm:py-3'
        />
      </Main>
    </PageFooterProvider>
  )
}

SectionPageLayout.Title = SectionPageLayoutTitle
SectionPageLayout.Actions = SectionPageLayoutActions
SectionPageLayout.Content = SectionPageLayoutContent
SectionPageLayout.Breadcrumb = SectionPageLayoutBreadcrumb
