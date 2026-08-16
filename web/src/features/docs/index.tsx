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
import { Link } from '@tanstack/react-router'
import { ArrowLeft, BookOpen, KeyRound, Route, ScanSearch } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { PublicLayout } from '@/components/layout'
import { Footer } from '@/components/layout/components/footer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { GettingStartedSections } from './components/getting-started-sections'
import { NativeProtocolsSection } from './components/native-protocols-section'
import { ReferenceSections } from './components/reference-sections'
import { TextProtocolSections } from './components/text-protocol-sections'
import { createDocsCodeSamples, getDocsSectionLinks } from './content'

export function Docs() {
  const { t } = useTranslation()
  const apiOrigin =
    typeof window === 'undefined'
      ? 'https://apibex.com'
      : window.location.origin
  const apiBaseUrl = `${apiOrigin}/v1`
  const samples = createDocsCodeSamples(apiOrigin)
  const sectionLinks = getDocsSectionLinks(t)
  const quickFacts = [
    {
      label: t('Authentication'),
      value: t('Bearer API key'),
      icon: KeyRound,
    },
    {
      label: t('Model discovery'),
      value: 'GET /v1/models',
      icon: ScanSearch,
    },
    {
      label: t('Request tracking'),
      value: 'x-oneapi-request-id',
      icon: Route,
    },
  ]

  return (
    <PublicLayout showMainContainer={false}>
      <div className='aivanta-public-surface min-h-svh px-2 py-2 md:px-4 md:py-4'>
        <main className='aivanta-public-frame px-3 pt-24 pb-6 sm:px-6 sm:pt-28 sm:pb-8 lg:px-8'>
          <section className='border-b border-[var(--aivanta-rule)] py-6 md:pb-10'>
            <div className='mx-auto max-w-6xl'>
              <Button
                variant='outline'
                className='mb-8 gap-2'
                render={<Link to='/' />}
              >
                <ArrowLeft className='size-4' aria-hidden='true' />
                {t('Back to Home')}
              </Button>

              <div className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-end'>
                <div>
                  <p className='font-mono text-[10px] tracking-[0.18em] text-[var(--aivanta-faint)] uppercase'>
                    Aivanta / {t('Docs')}
                  </p>
                  <div className='mt-5 flex flex-wrap gap-2'>
                    <Badge variant='secondary'>{t('Usage guide')}</Badge>
                    <Badge variant='outline'>{t('Self-contained')}</Badge>
                    <Badge variant='outline'>OpenAI · Anthropic · Gemini</Badge>
                  </div>
                  <h1 className='mt-6 max-w-4xl text-[clamp(2.5rem,5vw,4.75rem)] leading-[0.98] font-light tracking-[-0.055em]'>
                    {t('API usage guide')}
                  </h1>
                </div>

                <div className='overflow-hidden rounded-xl border border-[var(--aivanta-rule)] bg-[var(--aivanta-ink)] text-[var(--aivanta-paper)]'>
                  <div className='border-b border-white/10 px-4 py-3 font-mono text-[10px] tracking-[0.14em] text-white/55 uppercase'>
                    {t('API Base URL')}
                  </div>
                  <div className='flex min-w-0 items-center gap-2 px-4 py-4'>
                    <code className='min-w-0 flex-1 truncate font-mono text-sm'>
                      {apiBaseUrl}
                    </code>
                    <CopyButton
                      value={apiBaseUrl}
                      className='text-white/70 hover:bg-white/10 hover:text-white'
                    />
                  </div>
                </div>
              </div>

              <div className='mt-8 grid border-y border-[var(--aivanta-rule)] sm:grid-cols-3 sm:divide-x sm:divide-[var(--aivanta-rule)]'>
                {quickFacts.map((fact) => {
                  const Icon = fact.icon
                  return (
                    <div
                      key={fact.label}
                      className='flex items-start gap-3 border-b border-[var(--aivanta-rule)] px-3 py-4 last:border-b-0 sm:border-b-0 sm:px-5'
                    >
                      <Icon
                        className='mt-0.5 size-4 text-[var(--aivanta-faint)]'
                        aria-hidden='true'
                      />
                      <div className='min-w-0'>
                        <p className='text-muted-foreground text-xs'>
                          {fact.label}
                        </p>
                        <p className='mt-1 truncate font-mono text-sm'>
                          {fact.value}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          <nav
            className='mx-auto mt-5 flex max-w-6xl gap-2 overflow-x-auto pb-2 xl:hidden'
            aria-label={t('On this page')}
          >
            {sectionLinks.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className='text-muted-foreground hover:text-foreground shrink-0 rounded-full border border-[var(--aivanta-rule)] bg-[var(--aivanta-panel)] px-3 py-1.5 text-xs transition-colors'
              >
                {section.label}
              </a>
            ))}
          </nav>

          <div className='mx-auto grid max-w-6xl gap-10 py-10 xl:grid-cols-[13rem_minmax(0,1fr)] xl:py-14'>
            <aside className='hidden xl:block'>
              <nav
                className='aivanta-panel sticky top-24 p-3'
                aria-label={t('On this page')}
              >
                <div className='mb-3 flex items-center gap-2 px-2 text-sm font-semibold'>
                  <BookOpen className='size-4' aria-hidden='true' />
                  {t('On this page')}
                </div>
                <div className='space-y-1'>
                  {sectionLinks.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className='text-muted-foreground hover:bg-muted hover:text-foreground block rounded-md px-2 py-2 text-sm transition-colors'
                    >
                      {section.label}
                    </a>
                  ))}
                </div>
              </nav>
            </aside>

            <div className='min-w-0 space-y-12'>
              <GettingStartedSections apiOrigin={apiOrigin} samples={samples} />
              <TextProtocolSections samples={samples} />
              <NativeProtocolsSection samples={samples} />
              <ReferenceSections />
            </div>
          </div>

          <Footer />
        </main>
      </div>
    </PublicLayout>
  )
}
