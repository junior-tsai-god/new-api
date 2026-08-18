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

import { CodeBlock } from '@/components/ai-elements/code-block'
import { Badge } from '@/components/ui/badge'

import type { PlaygroundEndpointResult } from '../../api'

type PlaygroundEndpointResponseProps = {
  error: string
  result: PlaygroundEndpointResult | null
}

export function PlaygroundEndpointResponse(
  props: PlaygroundEndpointResponseProps
) {
  const { t } = useTranslation()
  const responseBody = props.result?.body || props.error
  const language = props.result?.contentType.toLowerCase().includes('json')
    ? 'json'
    : 'plaintext'

  return (
    <section
      aria-label={t('Response')}
      className='border-border/70 bg-background overflow-hidden rounded-xl border'
    >
      <header className='border-border/60 bg-muted/20 flex min-h-11 items-center gap-2 border-b px-4 py-2'>
        <h2 className='text-sm font-semibold'>{t('Response')}</h2>
        <div className='ms-auto flex items-center gap-2' aria-live='polite'>
          {props.result ? (
            <>
              <Badge variant={props.result.ok ? 'secondary' : 'destructive'}>
                {props.result.status}
              </Badge>
              <span className='text-muted-foreground text-xs tabular-nums'>
                {props.result.durationMs} ms
              </span>
              {props.result.truncated ? (
                <Badge variant='outline'>{t('Truncated')}</Badge>
              ) : null}
            </>
          ) : null}
        </div>
      </header>

      {responseBody ? (
        <CodeBlock
          className='rounded-none border-0'
          code={responseBody}
          language={language}
          maxExpandedLines={120}
          showLineNumbers
          showToolbar
        />
      ) : (
        <div
          className='text-muted-foreground flex min-h-48 items-center justify-center text-sm'
          role='status'
        >
          —
        </div>
      )}
    </section>
  )
}
