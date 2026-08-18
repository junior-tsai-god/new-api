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
import { Waypoints } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

import type { DocsCodeSamples } from '../content'
import { DocsCodeBlock } from './docs-code-block'
import { DocsSection } from './docs-section'

type NativeProtocolsSectionProps = {
  samples: DocsCodeSamples
}

export function NativeProtocolsSection(props: NativeProtocolsSectionProps) {
  const { t } = useTranslation()

  return (
    <DocsSection
      id='native-protocols'
      index='08 / NATIVE'
      title={t('Native protocols')}
      description={t(
        'Use a native request shape when your client already speaks Anthropic Messages or Gemini Generate Content.'
      )}
      icon={Waypoints}
    >
      <div className='grid gap-5 xl:grid-cols-2'>
        <div className='min-w-0 space-y-3'>
          <div>
            <h3 className='font-semibold'>{t('Anthropic Messages')}</h3>
            <p className='text-muted-foreground mt-1 text-sm leading-6'>
              {t(
                'Authenticate with x-api-key and include an anthropic-version header.'
              )}
            </p>
          </div>
          <DocsCodeBlock
            code={props.samples.anthropic}
            label='POST /v1/messages'
          />
        </div>
        <div className='min-w-0 space-y-3'>
          <div>
            <h3 className='font-semibold'>{t('Gemini Generate Content')}</h3>
            <p className='text-muted-foreground mt-1 text-sm leading-6'>
              {t(
                'Authenticate with x-goog-api-key and place the model ID in the request path.'
              )}
            </p>
          </div>
          <DocsCodeBlock
            code={props.samples.gemini}
            label='POST /v1beta/models/{model}:generateContent'
          />
        </div>
      </div>

      <Alert className='mt-4 border-[var(--aivanta-rule)] bg-[var(--aivanta-panel)] p-4'>
        <Waypoints aria-hidden='true' />
        <AlertTitle>{t('Match the model to the protocol')}</AlertTitle>
        <AlertDescription>
          {t(
            'Only use a native route when the model directory lists that endpoint. Otherwise use Chat Completions or Responses.'
          )}
        </AlertDescription>
      </Alert>
    </DocsSection>
  )
}
