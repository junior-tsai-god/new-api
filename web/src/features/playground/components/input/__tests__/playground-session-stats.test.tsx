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

import { createInstance } from 'i18next'
import { renderToStaticMarkup } from 'react-dom/server'
import { I18nextProvider, initReactI18next } from 'react-i18next'

import { PlaygroundSessionStats } from '../playground-session-stats'

test('renders authoritative playground usage in a compact scrolling row', async () => {
  const i18n = createInstance()
  await i18n.use(initReactI18next).init({
    lng: 'en',
    resources: {
      en: {
        translation: {
          'Actual Cost': 'Actual Cost',
          'Cache Hit Rate': 'Cache Hit Rate',
          'Cached Tokens': 'Cached Tokens',
          'Total Tokens': 'Total Tokens',
        },
      },
    },
  })

  const html = renderToStaticMarkup(
    <I18nextProvider i18n={i18n}>
      <PlaygroundSessionStats
        stats={{
          cache_hit_rate: 0.25,
          cached_tokens: 128,
          cost_usd: 0.0042,
          total_tokens: 512,
        }}
      />
    </I18nextProvider>
  )

  assert.match(html, /data-slot="playground-session-stats"/)
  assert.match(html, /data-layout="single-line-scroll"/)
  assert.match(html, />Total Tokens</)
  assert.match(html, />512</)
  assert.match(html, />Cached Tokens</)
  assert.match(html, />128</)
  assert.match(html, />Cache Hit Rate</)
  assert.match(html, />25%?</)
  assert.match(html, />Actual Cost</)
  assert.match(html, />\$0\.0042</)
})

test('does not present a failed stats request as zero usage', async () => {
  const i18n = createInstance()
  await i18n.use(initReactI18next).init({
    lng: 'en',
    resources: {
      en: {
        translation: {
          'Actual Cost': 'Actual Cost',
          'Cache Hit Rate': 'Cache Hit Rate',
          'Cached Tokens': 'Cached Tokens',
          'Failed to fetch usage': 'Failed to fetch usage',
          Retry: 'Retry',
          'Total Tokens': 'Total Tokens',
        },
      },
    },
  })

  const html = renderToStaticMarkup(
    <I18nextProvider i18n={i18n}>
      <PlaygroundSessionStats hasError onRetry={() => undefined} />
    </I18nextProvider>
  )

  assert.match(html, /role="alert"/)
  assert.match(html, />Failed to fetch usage</)
  assert.match(html, />Retry</)
  assert.match(html, />—</)
  assert.doesNotMatch(html, /\$0\.0000/)
})
