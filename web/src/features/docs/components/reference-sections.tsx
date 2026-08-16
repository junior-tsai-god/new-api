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
import { CircleHelp, ListTree } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { CORE_ENDPOINTS, type EndpointReference } from '../content'
import { DocsSection } from './docs-section'

function methodVariant(method: EndpointReference['method']) {
  return method === 'GET' ? 'secondary' : 'outline'
}

export function ReferenceSections() {
  const { t } = useTranslation()
  const categoryDescriptions: Record<EndpointReference['category'], string> = {
    models: t('Discover models available to the current API key.'),
    text: t('Generate text, structured output, or tool calls.'),
    native: t('Send provider-shaped requests through the same gateway.'),
    vectors: t('Generate vector embeddings for search and retrieval.'),
    media: t('Create or process image, audio, and video content.'),
    ranking: t('Rank candidate documents against a query.'),
  }
  const errors = [
    {
      code: '400',
      meaning: t('Invalid request'),
      action: t('Check the JSON body, required fields, and model parameters.'),
    },
    {
      code: '401',
      meaning: t('Invalid API key'),
      action: t('Check the authentication header and rotate an exposed key.'),
    },
    {
      code: '403',
      meaning: t('Access denied'),
      action: t(
        'Check the key status, group access, IP rules, and model access.'
      ),
    },
    {
      code: '404',
      meaning: t('Route or model not found'),
      action: t('Verify the path and refresh the model list before retrying.'),
    },
    {
      code: '429',
      meaning: t('Rate or quota limit reached'),
      action: t(
        'Reduce concurrency, wait before retrying, or check your balance.'
      ),
    },
    {
      code: '500 / 502',
      meaning: t('Gateway or upstream failure'),
      action: t('Keep the request ID and retry with exponential backoff.'),
    },
    {
      code: '503',
      meaning: t('No channel currently available'),
      action: t('Check model status and retry after service recovery.'),
    },
  ]

  return (
    <>
      <DocsSection
        id='reference'
        index='08 / REFERENCE'
        title={t('Endpoint reference')}
        description={t(
          'These routes are served by this gateway. Actual availability still depends on the selected model and your key permissions.'
        )}
        icon={ListTree}
      >
        <div className='aivanta-panel overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Method')}</TableHead>
                <TableHead>{t('Path')}</TableHead>
                <TableHead>{t('Usage')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CORE_ENDPOINTS.map((endpoint) => (
                <TableRow key={`${endpoint.method}-${endpoint.path}`}>
                  <TableCell>
                    <Badge variant={methodVariant(endpoint.method)}>
                      {endpoint.method}
                    </Badge>
                  </TableCell>
                  <TableCell className='font-mono text-xs sm:text-sm'>
                    {endpoint.path}
                  </TableCell>
                  <TableCell className='text-muted-foreground whitespace-normal'>
                    {categoryDescriptions[endpoint.category]}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DocsSection>

      <DocsSection
        id='troubleshooting'
        index='09 / ERRORS'
        title={t('Errors and troubleshooting')}
        description={t(
          'Use the HTTP status, response message, and request ID together. They are more useful than the status code alone.'
        )}
        icon={CircleHelp}
      >
        <div className='aivanta-panel overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Status Code')}</TableHead>
                <TableHead>{t('Meaning')}</TableHead>
                <TableHead>{t('What to do')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errors.map((error) => (
                <TableRow key={error.code}>
                  <TableCell className='font-mono font-semibold'>
                    {error.code}
                  </TableCell>
                  <TableCell>{error.meaning}</TableCell>
                  <TableCell className='text-muted-foreground whitespace-normal'>
                    {error.action}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className='mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center'>
          <div className='aivanta-panel p-5'>
            <h3 className='font-semibold'>{t('Troubleshooting order')}</h3>
            <ol className='text-muted-foreground mt-3 list-decimal space-y-2 pl-5 text-sm leading-6'>
              <li>{t('Confirm the API key and Base URL.')}</li>
              <li>{t('Refresh GET /v1/models and verify the model ID.')}</li>
              <li>{t('Compare the request body with the examples above.')}</li>
              <li>
                {t(
                  'Record the x-oneapi-request-id response header for support.'
                )}
              </li>
            </ol>
          </div>
          <Button variant='outline' render={<Link to='/usage-logs' />}>
            {t('Open usage records')}
          </Button>
        </div>
      </DocsSection>
    </>
  )
}
