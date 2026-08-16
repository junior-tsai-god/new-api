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

import { PlaygroundModelControl } from '../playground-model-control'

const models = [
  {
    category: 'OpenAI',
    label: 'gpt-5.6-sol',
    value: 'gpt-5.6-sol',
  },
]

async function renderModelControl(
  isLoading = false,
  availableModels = models
): Promise<string> {
  const i18n = createInstance()
  await i18n.use(initReactI18next).init({
    lng: 'en',
    resources: {
      en: {
        translation: {
          Model: 'Model',
          'No models available': 'No models available',
          'Select Model': 'Select Model',
        },
      },
    },
  })

  return renderToStaticMarkup(
    <I18nextProvider i18n={i18n}>
      <PlaygroundModelControl
        isLoading={isLoading}
        models={availableModels}
        onModelChange={() => undefined}
        selectedModel='gpt-5.6-sol'
      />
    </I18nextProvider>
  )
}

test('playground exposes the current model as a full field control', async () => {
  const html = await renderModelControl()

  assert.match(html, /data-slot="playground-model-control"/)
  assert.match(html, /data-layout="field"/)
  assert.match(html, /aria-label="Select Model: gpt-5\.6-sol"/)
  assert.match(html, /data-slot="model-selector-current">gpt-5\.6-sol<\/span>/)
})

test('playground disables model switching while models are loading', async () => {
  const html = await renderModelControl(true, [])

  assert.match(html, /data-loading="true"/)
  assert.match(html, /disabled=""/)
  assert.doesNotMatch(html, /No models available/)
})

test('playground explains when the selected API key has no models', async () => {
  const html = await renderModelControl(false, [])

  assert.match(html, /disabled=""/)
  assert.match(
    html,
    /data-slot="model-selector-current">No models available<\/span>/
  )
})
