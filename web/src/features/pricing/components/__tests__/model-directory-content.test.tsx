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
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createInstance } from 'i18next'
import { renderToStaticMarkup } from 'react-dom/server'
import { I18nextProvider, initReactI18next } from 'react-i18next'

import { ModelDirectoryContent } from '../model-directory-content'

test('shared model directory applies initial filters and exposes the full filter surface', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  queryClient.setQueryData(['pricing'], {
    success: true,
    data: [
      {
        id: 1,
        model_name: 'alpha-chat',
        quota_type: 0,
        model_ratio: 1,
        completion_ratio: 1,
        enable_groups: ['default'],
        supported_endpoint_types: ['openai'],
        vendor_id: 1,
      },
      {
        id: 2,
        model_name: 'beta-embed',
        quota_type: 0,
        model_ratio: 1,
        completion_ratio: 1,
        enable_groups: ['default'],
        supported_endpoint_types: ['embeddings'],
        vendor_id: 2,
      },
    ],
    vendors: [
      { id: 1, name: 'Alpha' },
      { id: 2, name: 'Beta' },
    ],
    group_ratio: { default: 1 },
    usable_group: { default: { desc: '', ratio: 1 } },
    supported_endpoint: {},
    auto_groups: [],
  })
  queryClient.setQueryData(['status'], { price: 1, usd_exchange_rate: 1 })

  const i18n = createInstance()
  await i18n.use(initReactI18next).init({
    lng: 'en',
    resources: { en: { translation: {} } },
  })

  const html = renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ModelDirectoryContent initialFilters={{ search: 'beta-embed' }} />
      </I18nextProvider>
    </QueryClientProvider>
  )

  assert.match(html, /beta-embed/)
  assert.doesNotMatch(html, /alpha-chat/)
  assert.match(html, /Search model name, provider, endpoint, or tag/)
  assert.match(html, /All Vendors/)
  assert.match(html, /Embeddings/)
})
