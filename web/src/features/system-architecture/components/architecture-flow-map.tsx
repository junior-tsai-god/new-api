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
  ArrowDown01Icon,
  ArrowRight01Icon,
  FlowConnectionIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import type { ArchitectureFlow, ArchitectureFlowId } from '../types'

type ArchitectureFlowMapProps = {
  flows: ArchitectureFlow[]
  activeFlow: ArchitectureFlow
  onFlowChange: (flowId: ArchitectureFlowId) => void
}

function ArchitectureNode(props: {
  step: ArchitectureFlow['steps'][number]
  isLast: boolean
  compact?: boolean
}) {
  const node = (
    <div className='bg-background text-foreground ring-background/15 relative z-10 min-w-0 flex-1 rounded-xl p-3.5 ring-1 transition-colors sm:p-4'>
      <div className='flex items-center justify-between gap-3'>
        <span className='bg-warning text-warning-foreground inline-flex size-7 items-center justify-center rounded-full font-mono text-[10px] font-semibold'>
          {props.step.code}
        </span>
        <span className='text-muted-foreground truncate font-mono text-[10px] tracking-[0.08em] uppercase'>
          {props.step.technology}
        </span>
      </div>
      <h3 className='mt-4 text-sm leading-tight font-semibold'>
        {props.step.title}
      </h3>
      <p className='text-muted-foreground mt-1.5 text-xs leading-5'>
        {props.step.description}
      </p>
    </div>
  )

  if (props.compact) {
    return (
      <li className='flex flex-col items-center gap-2.5'>
        {node}
        {!props.isLast ? (
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            aria-hidden='true'
            className='text-warning size-4'
          />
        ) : null}
      </li>
    )
  }

  return (
    <li className='flex w-48 shrink-0 items-center gap-3 xl:w-52'>
      {node}
      {!props.isLast ? (
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          aria-hidden='true'
          className='text-warning size-5 shrink-0'
        />
      ) : null}
    </li>
  )
}

export function ArchitectureFlowMap(props: ArchitectureFlowMapProps) {
  const { t } = useTranslation()

  return (
    <section
      aria-labelledby='request-rail-title'
      className='bg-foreground text-background dark:text-foreground overflow-hidden rounded-2xl border border-transparent dark:bg-black/35'
    >
      <div className='border-background/15 flex flex-col gap-5 border-b p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between lg:p-6'>
        <div className='max-w-2xl'>
          <div className='text-warning flex items-center gap-2'>
            <HugeiconsIcon
              icon={FlowConnectionIcon}
              aria-hidden='true'
              className='size-4'
            />
            <span className='font-mono text-[10px] font-semibold tracking-[0.16em] uppercase'>
              {t('Logical flow')}
            </span>
          </div>
          <h2
            id='request-rail-title'
            className='mt-2 text-xl font-semibold tracking-[-0.025em] sm:text-2xl'
          >
            {t('Request rail')}
          </h2>
          <p className='text-background/65 dark:text-muted-foreground mt-2 text-sm leading-6'>
            {t(
              'Switch paths to see where work happens and which boundary owns each decision.'
            )}
          </p>
        </div>

        <div
          role='group'
          aria-label={t('Architecture paths')}
          className='bg-background/10 flex max-w-full gap-1 overflow-x-auto rounded-full p-1'
        >
          {props.flows.map((flow) => (
            <button
              key={flow.id}
              type='button'
              aria-pressed={props.activeFlow.id === flow.id}
              onClick={() => props.onFlowChange(flow.id)}
              className={cn(
                'focus-visible:ring-warning min-h-8 shrink-0 rounded-full px-3 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
                props.activeFlow.id === flow.id
                  ? 'bg-warning text-warning-foreground'
                  : 'text-background/70 hover:bg-background/10 hover:text-background dark:text-muted-foreground dark:hover:text-foreground'
              )}
            >
              {flow.label}
            </button>
          ))}
        </div>
      </div>

      <div className='p-4 sm:p-5 lg:p-6'>
        <div className='mb-5 flex items-start gap-3' aria-live='polite'>
          <span className='bg-warning mt-2 size-2 shrink-0 rounded-full' />
          <p className='text-background/75 dark:text-muted-foreground max-w-3xl text-sm leading-6'>
            {props.activeFlow.summary}
          </p>
        </div>

        <ol className='space-y-2.5 md:hidden'>
          {props.activeFlow.steps.map((step, index) => (
            <ArchitectureNode
              key={step.code}
              step={step}
              isLast={index === props.activeFlow.steps.length - 1}
              compact
            />
          ))}
        </ol>

        <div className='hidden overflow-x-auto pb-2 md:block'>
          <ol className='flex min-w-max items-stretch'>
            {props.activeFlow.steps.map((step, index) => (
              <ArchitectureNode
                key={step.code}
                step={step}
                isLast={index === props.activeFlow.steps.length - 1}
              />
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
