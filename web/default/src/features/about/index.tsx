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
import { useQuery } from '@tanstack/react-query'
import { Construction } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { Footer } from '@/components/layout/components/footer'
import { RichContent } from '@/components/rich-content'
import { Skeleton } from '@/components/ui/skeleton'
import { isHttpUrl, isLikelyHtml } from '@/lib/content-format'

import { getAboutContent } from './api'

function AboutPageFrame(props: { children: React.ReactNode }) {
  const { t } = useTranslation()

  return (
    <PublicLayout showMainContainer={false}>
      <div className='aivanta-public-surface min-h-svh px-2 py-2 md:px-4 md:py-4'>
        <main className='aivanta-public-frame px-3 pt-24 pb-6 sm:px-6 sm:pt-28 sm:pb-8 lg:px-8'>
          <header className='border-b border-[var(--aivanta-rule)] py-6'>
            <p className='font-mono text-[10px] tracking-[0.18em] text-[var(--aivanta-faint)] uppercase'>
              Aivanta / {t('About')}
            </p>
            <h1 className='mt-2 text-[clamp(2.5rem,5vw,4.75rem)] leading-[0.95] font-light tracking-[-0.06em]'>
              {t('About')}
            </h1>
          </header>
          <div className='py-6 sm:py-8'>{props.children}</div>
        </main>
        <Footer className='mx-auto mt-3 w-[min(calc(100%_-_1rem),96rem)] rounded-[2rem] border border-[var(--aivanta-rule)] bg-[var(--aivanta-paper)]' />
      </div>
    </PublicLayout>
  )
}

function EmptyAboutState() {
  const { t } = useTranslation()

  return (
    <div className='flex min-h-[60vh] items-center justify-center p-8'>
      <div className='max-w-2xl space-y-6 text-center'>
        <div className='flex justify-center'>
          <Construction className='text-muted-foreground h-24 w-24' />
        </div>
        <div className='space-y-2'>
          <h2 className='text-2xl font-bold'>{t('No About Content Set')}</h2>
          <p className='text-muted-foreground'>
            {t(
              'The administrator has not configured any about content yet. You can set it in the settings page, supporting HTML or URL.'
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

export function About() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['about-content'],
    queryFn: getAboutContent,
  })

  const rawContent = data?.data?.trim() ?? ''
  const hasContent = rawContent.length > 0
  const isUrl = hasContent && isHttpUrl(rawContent)

  if (isLoading) {
    return (
      <AboutPageFrame>
        <div className='mx-auto flex max-w-4xl flex-col gap-4 py-12'>
          <Skeleton className='h-8 w-[45%]' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-[90%]' />
          <Skeleton className='h-4 w-[80%]' />
        </div>
      </AboutPageFrame>
    )
  }

  if (!hasContent) {
    return (
      <AboutPageFrame>
        <EmptyAboutState />
      </AboutPageFrame>
    )
  }

  if (isUrl) {
    return (
      <PublicLayout showMainContainer={false}>
        <iframe
          src={rawContent}
          className='h-[calc(100vh-3.5rem)] w-full border-0'
          title={t('About')}
          sandbox='allow-forms allow-popups allow-popups-to-escape-sandbox allow-scripts'
        />
      </PublicLayout>
    )
  }

  return (
    <AboutPageFrame>
      <div className='mx-auto max-w-6xl px-4 py-8'>
        <RichContent
          mode={isLikelyHtml(rawContent) ? 'html' : 'markdown'}
          content={rawContent}
          className='prose-neutral dark:prose-invert max-w-none'
        />
      </div>
    </AboutPageFrame>
  )
}
