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

interface StatsProps {
  className?: string
}

export function Stats(_props: StatsProps) {
  const { t } = useTranslation()
  const stats = [
    { value: '50+', label: t('upstream services integrated') },
    { value: '100+', label: t('model billing support') },
    { value: '50+', label: t('compatible API routes') },
    { value: '10+', label: t('scheduling controls') },
  ]

  return (
    <section className='aivanta-home-section mx-auto mt-4 w-[min(calc(100%_-_1rem),96rem)] overflow-hidden rounded-[2rem] border border-[var(--aivanta-rule)] bg-[var(--aivanta-paper)]'>
      <div className='grid grid-cols-2 px-4 sm:px-6 md:grid-cols-4 lg:px-8'>
        {stats.map((stat) => (
          <div
            key={stat.label}
            className='border-r border-[var(--aivanta-rule)] py-8 pr-4 pl-4 first:pl-0 even:border-r-0 md:py-10 md:pr-6 md:pl-6 md:last:border-r-0 md:even:border-r'
          >
            <span className='deck-metric text-4xl sm:text-5xl'>
              {stat.value}
            </span>
            <span className='mt-2 block max-w-36 text-xs leading-relaxed text-[var(--aivanta-secondary)]'>
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
