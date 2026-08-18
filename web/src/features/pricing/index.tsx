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
import { useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { Footer } from '@/components/layout/components/footer'
import { PageTransition } from '@/components/page-transition'

import { ModelDirectoryContent } from './components/model-directory-content'

export function Pricing() {
  const { t } = useTranslation()
  const initialFilters = useSearch({ from: '/pricing/' })

  return (
    <PublicLayout showMainContainer={false}>
      <div className='aivanta-public-surface min-h-svh px-2 py-2 md:px-4 md:py-4'>
        <PageTransition className='aivanta-public-frame px-3 pt-24 pb-6 sm:px-6 sm:pt-28 sm:pb-8 lg:px-8'>
          <header className='border-b border-[var(--aivanta-rule)] py-6'>
            <div>
              <p className='font-mono text-[10px] tracking-[0.18em] text-[var(--aivanta-faint)] uppercase'>
                Aivanta / {t('Model Center')}
              </p>
              <h1 className='mt-2 text-[clamp(2.5rem,5vw,4.75rem)] leading-[0.95] font-light tracking-[-0.06em]'>
                {t('Model Center')}
              </h1>
            </div>
          </header>

          <div className='py-5'>
            <ModelDirectoryContent initialFilters={initialFilters} />
          </div>
        </PageTransition>
        <Footer className='mx-auto mt-3 w-[min(calc(100%_-_1rem),96rem)] rounded-[2rem] border border-[var(--aivanta-rule)] bg-[var(--aivanta-paper)]' />
      </div>
    </PublicLayout>
  )
}
