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
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'

const REQUESTS = [
  {
    provider: 'OpenAI',
    route: 'POST /v1/chat/completions',
    latency: '124ms',
  },
  { provider: 'Claude', route: 'POST /v1/messages', latency: '161ms' },
  { provider: 'Gemini', route: 'POST /v1/responses', latency: '98ms' },
  {
    provider: 'DeepSeek',
    route: 'POST /v1/chat/completions',
    latency: '143ms',
  },
] as const

export function LiveRequestsCard() {
  const { t } = useTranslation()

  return (
    <article className='aivanta-ink-section flex min-h-[30rem] flex-col overflow-hidden rounded-[1.75rem] p-5 lg:col-start-4 lg:row-span-2 lg:row-start-1'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <p className='font-mono text-[9px] tracking-[0.16em] uppercase'>
            {t('Observability')}
          </p>
          <h2 className='mt-2 text-2xl font-semibold tracking-[-0.035em]'>
            {t('Requests')}
          </h2>
        </div>
        <Badge className='bg-[var(--aivanta-signal)] text-[var(--aivanta-ink)]'>
          24 / 7
        </Badge>
      </div>

      <div className='gateway-live-stream relative mt-6 flex flex-col gap-2'>
        {REQUESTS.map((request, index) => (
          <div
            key={request.provider}
            className='relative flex items-start gap-3 rounded-2xl bg-[color-mix(in_oklch,var(--aivanta-paper)_8%,transparent)] p-3'
          >
            <div className='mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--aivanta-paper)] text-[var(--aivanta-ink)]'>
              <span className='font-mono text-[10px]'>0{index + 1}</span>
            </div>
            <div className='min-w-0 flex-1'>
              <div className='flex items-center justify-between gap-3'>
                <span className='text-sm font-medium'>{request.provider}</span>
                <span className='font-mono text-[9px] text-[var(--aivanta-secondary)]'>
                  {request.latency}
                </span>
              </div>
              <code className='mt-1 block truncate font-mono text-[9px] text-[var(--aivanta-secondary)]'>
                {request.route}
              </code>
            </div>
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              className='mt-1 size-4 shrink-0 text-[var(--aivanta-signal)]'
              strokeWidth={1.8}
            />
          </div>
        ))}
      </div>

      <div className='mt-auto pt-8'>
        <div className='mb-3 flex items-center justify-between font-mono text-[9px] tracking-[0.12em] uppercase'>
          <span>{t('Secure & Reliable')}</span>
          <span>99.99%</span>
        </div>
        <div className='deck-track gateway-uptime-track'>
          <span className='sr-only'>99.99%</span>
        </div>
      </div>
    </article>
  )
}
