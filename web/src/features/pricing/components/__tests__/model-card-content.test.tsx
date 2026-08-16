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

import type { ModelStatusItem } from '@/features/model-status/types'

import type { PricingModel } from '../../types'
import { ModelCard } from '../model-card'

const model: PricingModel = {
  id: 1,
  model_name: 'gpt-5.6-sol',
  description: 'General-purpose model introduction',
  quota_type: 0,
  model_ratio: 1,
  completion_ratio: 2,
  enable_groups: ['vip-group'],
  tags: 'reasoning,tools',
  supported_endpoint_types: ['openai-response'],
}

const status: ModelStatusItem = {
  model_name: model.model_name,
  supported_endpoint_types: ['openai-response'],
  status: 'healthy',
  latency_ms: 1923,
  healthy_channels: 2,
  total_channels: 2,
  availability_7d: 92.57,
  availability_samples_7d: 14,
  last_checked_at: 100,
  history: [
    {
      batch_id: 'probe-1',
      status: 'healthy',
      latency_ms: 1923,
      healthy_channels: 2,
      total_channels: 2,
      checked_at: 100,
    },
  ],
}

test('model card prioritizes measured latency and omits catalog metadata', async () => {
  const i18n = createInstance()
  await i18n.use(initReactI18next).init({
    lng: 'en',
    resources: { en: { translation: {} } },
  })
  const html = renderToStaticMarkup(
    <I18nextProvider i18n={i18n}>
      <ModelCard model={model} status={status} onClick={() => undefined} />
    </I18nextProvider>
  )

  assert.match(html, /1,923/)
  assert.match(html, /92\.57%/)
  assert.doesNotMatch(html, /General-purpose model introduction/)
  assert.doesNotMatch(html, /vip-group/)
  assert.doesNotMatch(html, /reasoning/)
  assert.doesNotMatch(html, /openai-response/)
  assert.doesNotMatch(html, /Token-based/)
})
