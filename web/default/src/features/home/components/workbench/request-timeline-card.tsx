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
import { useTranslation } from 'react-i18next'

const TICKS = ['08:00', '09:00', '10:00', '11:00'] as const

export function RequestTimelineCard() {
  const { t } = useTranslation()

  return (
    <article className='aivanta-panel min-h-64 overflow-hidden lg:col-span-2 lg:col-start-2 lg:row-start-2'>
      <div className='flex flex-wrap items-start justify-between gap-4 px-5 pt-5'>
        <div>
          <h2 className='text-lg font-semibold tracking-[-0.025em]'>
            {t('Monitor')}
          </h2>
          <p className='mt-1 text-xs text-[var(--aivanta-secondary)]'>
            {t('Track usage, costs and performance with real-time analytics')}
          </p>
        </div>
        <div className='text-right'>
          <p className='font-mono text-[9px] tracking-[0.14em] text-[var(--aivanta-faint)] uppercase'>
            {t('Cost Tracking')}
          </p>
          <p className='deck-metric mt-1 text-2xl'>$24.80</p>
        </div>
      </div>

      <div className='mt-5 grid grid-cols-[3.5rem_1fr] border-t border-[var(--aivanta-rule)]'>
        <div className='grid grid-rows-4 border-r border-[var(--aivanta-rule)]'>
          {TICKS.map((tick) => (
            <span
              key={tick}
              className='flex min-h-10 items-center px-3 font-mono text-[9px] text-[var(--aivanta-faint)]'
            >
              {tick}
            </span>
          ))}
        </div>
        <div className='gateway-timeline-grid relative min-h-40'>
          <div className='absolute top-3 left-[8%] w-[52%] rounded-xl bg-[var(--aivanta-ink)] px-3 py-2 text-[var(--aivanta-paper)]'>
            <p className='text-xs font-medium'>OpenAI · GPT-4.1</p>
            <code className='mt-1 block truncate font-mono text-[8px] opacity-65'>
              POST /v1/chat/completions
            </code>
          </div>
          <div className='absolute top-20 right-[7%] w-[46%] rounded-xl bg-[var(--aivanta-signal)] px-3 py-2 text-[var(--aivanta-ink)]'>
            <p className='text-xs font-medium'>Claude · Sonnet</p>
            <code className='mt-1 block truncate font-mono text-[8px] opacity-65'>
              POST /v1/messages
            </code>
          </div>
        </div>
      </div>
    </article>
  )
}
