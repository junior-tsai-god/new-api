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

const CONTROLS = ['API Keys', 'Rate Limiting', 'Load Balancing'] as const

export function GatewayControlsCard() {
  const { t } = useTranslation()

  return (
    <article className='aivanta-panel flex min-h-64 flex-col p-5 lg:col-start-1 lg:row-start-2'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h2 className='text-lg font-semibold tracking-[-0.025em]'>
            {t('Configure')}
          </h2>
          <p className='mt-1 text-xs leading-relaxed text-[var(--aivanta-secondary)]'>
            {t(
              'Add your API keys, set up channels and configure access permissions'
            )}
          </p>
        </div>
        <span className='font-mono text-[9px] tracking-[0.14em] text-[var(--aivanta-faint)] uppercase'>
          01—03
        </span>
      </div>

      <div className='mt-auto pt-5'>
        {CONTROLS.map((control, index) => (
          <div
            key={control}
            className='flex items-center justify-between border-b border-[var(--aivanta-rule)] py-3 last:border-b-0'
          >
            <span className='text-sm font-medium'>{t(control)}</span>
            <span className='flex items-center gap-2 font-mono text-[9px] text-[var(--aivanta-faint)]'>
              0{index + 1}
              <span className='size-1.5 rounded-full bg-[var(--aivanta-signal)]' />
            </span>
          </div>
        ))}
      </div>
    </article>
  )
}
