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
  DatabaseIcon,
  Layers01Icon,
  ServerStack01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'

import type {
  ArchitectureLayer,
  DiagnosticBoundary,
  RuntimeNode,
} from '../types'

type ArchitectureReferenceProps = {
  layers: ArchitectureLayer[]
  runtimeNodes: RuntimeNode[]
  diagnosticBoundaries: DiagnosticBoundary[]
}

export function ArchitectureReference(props: ArchitectureReferenceProps) {
  const { t } = useTranslation()

  return (
    <div className='grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.7fr)]'>
      <section
        aria-labelledby='layer-map-title'
        className='bg-card ring-foreground/10 overflow-hidden rounded-2xl ring-1'
      >
        <div className='flex items-start gap-3 border-b p-4 sm:p-5'>
          <span className='bg-warning/20 text-warning-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-lg'>
            <HugeiconsIcon
              icon={Layers01Icon}
              aria-hidden='true'
              className='size-4'
            />
          </span>
          <div>
            <h2 id='layer-map-title' className='text-base font-semibold'>
              {t('Layer map')}
            </h2>
            <p className='text-muted-foreground mt-1 text-sm leading-5'>
              {t('Responsibilities stay separated by a clear boundary.')}
            </p>
          </div>
        </div>

        <ol className='divide-y'>
          {props.layers.map((layer) => (
            <li
              key={layer.code}
              className='grid gap-3 p-4 sm:grid-cols-[3rem_minmax(0,1fr)] sm:p-5'
            >
              <span className='text-muted-foreground font-mono text-xs tracking-[0.12em]'>
                {layer.code}
              </span>
              <div className='min-w-0'>
                <h3 className='text-sm font-semibold'>{layer.title}</h3>
                <p className='text-muted-foreground mt-1 text-sm leading-6'>
                  {layer.description}
                </p>
                <div className='mt-3 flex flex-wrap gap-1.5'>
                  {layer.technologies.map((technology) => (
                    <Badge key={technology} variant='outline'>
                      {technology}
                    </Badge>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <aside
        aria-labelledby='runtime-title'
        className='bg-card ring-foreground/10 overflow-hidden rounded-2xl ring-1'
      >
        <div className='flex items-start gap-3 border-b p-4 sm:p-5'>
          <span className='bg-warning/20 text-warning-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-lg'>
            <HugeiconsIcon
              icon={ServerStack01Icon}
              aria-hidden='true'
              className='size-4'
            />
          </span>
          <div>
            <h2 id='runtime-title' className='text-base font-semibold'>
              {t('Current deployment')}
            </h2>
            <p className='text-muted-foreground mt-1 text-sm leading-5'>
              {t('Docker Compose topology')}
            </p>
          </div>
        </div>

        <ol className='relative p-4 sm:p-5'>
          <span
            aria-hidden='true'
            className='bg-border absolute top-8 bottom-8 left-7 w-px sm:left-11'
          />
          {props.runtimeNodes.map((node) => (
            <li
              key={node.label}
              className='relative grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3 pb-5 last:pb-0'
            >
              <span className='bg-card ring-warning relative z-10 mt-1 inline-flex size-4 items-center justify-center rounded-full ring-2'>
                <span className='bg-warning size-1.5 rounded-full' />
              </span>
              <div>
                <p className='text-muted-foreground font-mono text-[10px] tracking-[0.1em] uppercase'>
                  {node.label}
                </p>
                <p className='mt-0.5 text-sm font-semibold'>{node.value}</p>
                <p className='text-muted-foreground mt-1 text-xs leading-5'>
                  {node.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </aside>

      <section
        aria-labelledby='diagnostic-title'
        className='bg-card ring-foreground/10 overflow-hidden rounded-2xl ring-1 xl:col-span-2'
      >
        <div className='flex items-start gap-3 border-b p-4 sm:p-5'>
          <span className='bg-warning/20 text-warning-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-lg'>
            <HugeiconsIcon
              icon={DatabaseIcon}
              aria-hidden='true'
              className='size-4'
            />
          </span>
          <div>
            <h2 id='diagnostic-title' className='text-base font-semibold'>
              {t('Troubleshooting order')}
            </h2>
            <p className='text-muted-foreground mt-1 text-sm leading-5'>
              {t(
                'Start at the first boundary that fails, then move inward one layer at a time.'
              )}
            </p>
          </div>
        </div>

        <ol className='grid divide-y xl:grid-cols-4 xl:divide-x xl:divide-y-0'>
          {props.diagnosticBoundaries.map((boundary) => (
            <li key={boundary.code} className='p-4 sm:p-5'>
              <span className='bg-foreground text-background inline-flex size-7 items-center justify-center rounded-full font-mono text-[10px] font-semibold'>
                {boundary.code}
              </span>
              <h3 className='mt-4 text-sm font-semibold'>{boundary.title}</h3>
              <p className='text-muted-foreground mt-1.5 text-xs leading-5'>
                {boundary.description}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
