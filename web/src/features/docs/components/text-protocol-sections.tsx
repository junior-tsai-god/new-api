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
import { Braces, MessageSquareText, Radio } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import type { DocsCodeSamples } from '../content'
import { DocsCodeBlock } from './docs-code-block'
import { DocsSection } from './docs-section'

type TextProtocolSectionsProps = {
  samples: DocsCodeSamples
}

export function TextProtocolSections(props: TextProtocolSectionsProps) {
  const { t } = useTranslation()

  return (
    <>
      <DocsSection
        id='chat-completions'
        index='04 / CHAT'
        title={t('Chat Completions')}
        description={t(
          'Use this endpoint for message-based conversations and broad compatibility with existing clients.'
        )}
        icon={MessageSquareText}
      >
        <DocsCodeBlock
          code={props.samples.chatCurl}
          label='POST /v1/chat/completions'
        />
        <div className='aivanta-panel mt-4 overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Field')}</TableHead>
                <TableHead>{t('Required')}</TableHead>
                <TableHead>{t('Usage')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className='font-mono'>model</TableCell>
                <TableCell>{t('Yes')}</TableCell>
                <TableCell className='text-muted-foreground whitespace-normal'>
                  {t('An exact model ID returned by the model list.')}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className='font-mono'>messages</TableCell>
                <TableCell>{t('Yes')}</TableCell>
                <TableCell className='text-muted-foreground whitespace-normal'>
                  {t(
                    'Conversation messages with system, user, or assistant roles.'
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className='font-mono'>stream</TableCell>
                <TableCell>{t('No')}</TableCell>
                <TableCell className='text-muted-foreground whitespace-normal'>
                  {t('Set to true to receive Server-Sent Events.')}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className='font-mono'>max_tokens</TableCell>
                <TableCell>{t('No')}</TableCell>
                <TableCell className='text-muted-foreground whitespace-normal'>
                  {t(
                    'Limits generated output when the selected model supports it.'
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </DocsSection>

      <DocsSection
        id='responses'
        index='05 / RESPONSES'
        title={t('Responses API')}
        description={t(
          'Use Responses for input-based workflows, tool calls, and clients designed around the newer response format.'
        )}
        icon={Braces}
      >
        <DocsCodeBlock
          code={props.samples.responses}
          label='POST /v1/responses'
        />
        <div className='mt-4 grid gap-4 md:grid-cols-2'>
          <div className='aivanta-panel p-5'>
            <h3 className='font-semibold'>{t('Input')}</h3>
            <p className='text-muted-foreground mt-2 text-sm leading-6'>
              {t(
                'input can be a string or a structured input array. Start with a string unless you need tools or multimodal content.'
              )}
            </p>
          </div>
          <div className='aivanta-panel p-5'>
            <h3 className='font-semibold'>{t('Output')}</h3>
            <p className='text-muted-foreground mt-2 text-sm leading-6'>
              {t(
                'Read the output items in order. Do not assume every response contains only plain text.'
              )}
            </p>
          </div>
        </div>
      </DocsSection>

      <DocsSection
        id='streaming'
        index='06 / STREAM'
        title={t('Streaming')}
        description={t(
          'Streaming returns partial output as Server-Sent Events so the interface can update while generation is still running.'
        )}
        icon={Radio}
      >
        <DocsCodeBlock code={props.samples.streaming} label='SSE / cURL -N' />
        <ol className='mt-4 grid gap-3 md:grid-cols-3'>
          <li className='aivanta-panel p-4 text-sm leading-6'>
            <span className='font-mono text-[10px] text-[var(--aivanta-faint)]'>
              01
            </span>
            <p className='mt-2'>
              {t('Set stream to true in the request body.')}
            </p>
          </li>
          <li className='aivanta-panel p-4 text-sm leading-6'>
            <span className='font-mono text-[10px] text-[var(--aivanta-faint)]'>
              02
            </span>
            <p className='mt-2'>
              {t('Parse each data: line as an independent event.')}
            </p>
          </li>
          <li className='aivanta-panel p-4 text-sm leading-6'>
            <span className='font-mono text-[10px] text-[var(--aivanta-faint)]'>
              03
            </span>
            <p className='mt-2'>
              {t('Close the stream after the terminal event or [DONE].')}
            </p>
          </li>
        </ol>
      </DocsSection>
    </>
  )
}
