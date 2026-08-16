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
import { KeyRound, ListTree, Send, ShieldCheck, Terminal } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import type { DocsCodeSamples } from '../content'
import { DocsCodeBlock } from './docs-code-block'
import { DocsSection } from './docs-section'

type GettingStartedSectionsProps = {
  apiOrigin: string
  samples: DocsCodeSamples
}

export function GettingStartedSections(props: GettingStartedSectionsProps) {
  const { t } = useTranslation()
  const steps = [
    {
      number: '01',
      title: t('Create an API key'),
      description: t(
        'Create a dedicated key for your application and copy it when it is shown.'
      ),
      action: t('Open API Keys'),
      to: '/keys' as const,
      icon: KeyRound,
    },
    {
      number: '02',
      title: t('Choose a model'),
      description: t(
        'Pick a model that is enabled for your group and note its exact model ID.'
      ),
      action: t('Browse models'),
      to: '/model-catalog' as const,
      icon: ListTree,
    },
    {
      number: '03',
      title: t('Send your first request'),
      description: t(
        'Replace <MODEL_ID> in the sample, then send the request from your server.'
      ),
      action: t('Open Playground'),
      to: '/playground' as const,
      icon: Send,
    },
  ]

  return (
    <>
      <DocsSection
        id='quick-start'
        index='01 / START'
        title={t('Quick start')}
        description={t(
          'Create a key, choose an available model, and complete a real request in a few minutes.'
        )}
        icon={Terminal}
      >
        <div className='grid gap-3 lg:grid-cols-3'>
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <article key={step.number} className='aivanta-panel p-5'>
                <div className='flex items-center justify-between'>
                  <span className='font-mono text-[11px] tracking-[0.14em] text-[var(--aivanta-faint)]'>
                    STEP {step.number}
                  </span>
                  <Icon className='size-4 text-[var(--aivanta-faint)]' />
                </div>
                <h3 className='mt-5 font-semibold'>{step.title}</h3>
                <p className='text-muted-foreground mt-2 min-h-12 text-sm leading-6'>
                  {step.description}
                </p>
                <Button
                  variant='outline'
                  size='sm'
                  className='mt-4'
                  render={<Link to={step.to} />}
                >
                  {step.action}
                </Button>
              </article>
            )
          })}
        </div>

        <Tabs defaultValue='curl' className='mt-6 gap-3'>
          <TabsList aria-label={t('Example language')}>
            <TabsTrigger value='curl'>cURL</TabsTrigger>
            <TabsTrigger value='python'>Python</TabsTrigger>
            <TabsTrigger value='javascript'>JavaScript</TabsTrigger>
          </TabsList>
          <TabsContent value='curl'>
            <DocsCodeBlock code={props.samples.chatCurl} label='cURL' />
          </TabsContent>
          <TabsContent value='python'>
            <DocsCodeBlock code={props.samples.chatPython} label='Python' />
          </TabsContent>
          <TabsContent value='javascript'>
            <DocsCodeBlock
              code={props.samples.chatJavaScript}
              label='JavaScript'
            />
          </TabsContent>
        </Tabs>
      </DocsSection>

      <DocsSection
        id='authentication'
        index='02 / AUTH'
        title={t('Authentication')}
        description={t('One API key. Every model.')}
        icon={ShieldCheck}
      >
        <div className='grid gap-4 lg:grid-cols-[1fr_1.2fr]'>
          <div className='aivanta-panel p-5'>
            <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
              {t('Base URL')}
            </p>
            <div className='mt-3 flex min-w-0 items-center gap-2 rounded-lg border bg-[var(--aivanta-panel)] px-3 py-2.5'>
              <code className='min-w-0 flex-1 truncate font-mono text-sm'>
                {props.apiOrigin}
              </code>
              <CopyButton value={props.apiOrigin} />
            </div>
            <p className='text-muted-foreground mt-3 text-sm leading-6'>
              {t(
                'Use the origin shown here. OpenAI-compatible SDKs should use the /v1 suffix.'
              )}
            </p>
          </div>

          <DocsCodeBlock
            label={t('Request header')}
            code={`Authorization: Bearer $AIVANTA_API_KEY\nContent-Type: application/json`}
          />
        </div>

        <Alert className='mt-4 border-[var(--aivanta-rule)] bg-[var(--aivanta-panel)] p-4'>
          <ShieldCheck aria-hidden='true' />
          <AlertTitle>{t('Keep API keys on your server')}</AlertTitle>
          <AlertDescription>
            {t(
              'Do not place a permanent API key in browser code, mobile packages, public repositories, or screenshots. Rotate a key immediately if it is exposed.'
            )}
          </AlertDescription>
        </Alert>
      </DocsSection>

      <DocsSection
        id='models'
        index='03 / MODELS'
        title={t('Model discovery')}
        description={t(
          'Query the gateway before hard-coding a model. The result reflects the models available to this API key.'
        )}
        icon={ListTree}
      >
        <DocsCodeBlock code={props.samples.models} label='GET /v1/models' />
        <div className='mt-4 grid gap-4 md:grid-cols-2'>
          <div className='aivanta-panel p-5'>
            <h3 className='font-semibold'>{t('Use the returned model ID')}</h3>
            <p className='text-muted-foreground mt-2 text-sm leading-6'>
              {t(
                'Read data[].id from the response and pass that exact value as model in later requests.'
              )}
            </p>
          </div>
          <div className='aivanta-panel p-5'>
            <h3 className='font-semibold'>{t('Check protocol support')}</h3>
            <p className='text-muted-foreground mt-2 text-sm leading-6'>
              {t(
                'The model directory shows the request endpoints enabled for each model. Not every model supports every protocol.'
              )}
            </p>
          </div>
        </div>
      </DocsSection>
    </>
  )
}
