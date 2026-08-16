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
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import type { DocsSectionId } from '../content'

type DocsSectionProps = {
  id: DocsSectionId
  index: string
  title: string
  description: string
  icon: LucideIcon
  children: ReactNode
}

export function DocsSection(props: DocsSectionProps) {
  const Icon = props.icon

  return (
    <section
      id={props.id}
      className='scroll-mt-28 border-b border-[var(--aivanta-rule)] pb-12 last:border-b-0 last:pb-0'
    >
      <header className='mb-6 grid gap-4 sm:grid-cols-[3rem_1fr]'>
        <div className='flex size-10 items-center justify-center rounded-lg border border-[var(--aivanta-rule)] bg-[var(--aivanta-panel)]'>
          <Icon className='size-4.5' aria-hidden='true' />
        </div>
        <div>
          <p className='font-mono text-[10px] tracking-[0.16em] text-[var(--aivanta-faint)] uppercase'>
            {props.index}
          </p>
          <h2 className='mt-1 text-2xl font-semibold tracking-[-0.03em]'>
            {props.title}
          </h2>
          <p className='text-muted-foreground mt-2 max-w-3xl text-sm leading-6 sm:text-base sm:leading-7'>
            {props.description}
          </p>
        </div>
      </header>
      {props.children}
    </section>
  )
}
