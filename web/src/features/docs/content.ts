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
import type { TFunction } from 'i18next'

export const DOCS_SECTION_IDS = [
  'quick-start',
  'authentication',
  'models',
  'chat-completions',
  'responses',
  'streaming',
  'native-protocols',
  'reference',
  'troubleshooting',
] as const

export const DOCS_INTERNAL_LINKS = [
  '/keys',
  '/model-catalog',
  '/playground',
  '/usage-logs',
] as const

export type DocsSectionId = (typeof DOCS_SECTION_IDS)[number]

export type EndpointReference = {
  method: 'GET' | 'POST'
  path: string
  category: 'models' | 'text' | 'native' | 'vectors' | 'media' | 'ranking'
}

export const CORE_ENDPOINTS: EndpointReference[] = [
  { method: 'GET', path: '/v1/models', category: 'models' },
  { method: 'POST', path: '/v1/chat/completions', category: 'text' },
  { method: 'POST', path: '/v1/responses', category: 'text' },
  { method: 'POST', path: '/v1/messages', category: 'native' },
  {
    method: 'POST',
    path: '/v1beta/models/{model}:generateContent',
    category: 'native',
  },
  { method: 'POST', path: '/v1/embeddings', category: 'vectors' },
  { method: 'POST', path: '/v1/images/generations', category: 'media' },
  { method: 'POST', path: '/v1/audio/transcriptions', category: 'media' },
  { method: 'POST', path: '/v1/rerank', category: 'ranking' },
  { method: 'POST', path: '/v1/videos', category: 'media' },
]

export function getDocsSectionLinks(
  t: TFunction
): Array<{ id: DocsSectionId; label: string }> {
  return [
    { id: 'quick-start', label: t('Quick start') },
    { id: 'authentication', label: t('Authentication') },
    { id: 'models', label: t('Model discovery') },
    { id: 'chat-completions', label: t('Chat Completions') },
    { id: 'responses', label: t('Responses API') },
    { id: 'streaming', label: t('Streaming') },
    { id: 'native-protocols', label: t('Native protocols') },
    { id: 'reference', label: t('Endpoint reference') },
    { id: 'troubleshooting', label: t('Errors and troubleshooting') },
  ]
}

export type DocsCodeSamples = {
  models: string
  chatCurl: string
  chatPython: string
  chatJavaScript: string
  responses: string
  streaming: string
  anthropic: string
  gemini: string
}

export function createDocsCodeSamples(origin: string): DocsCodeSamples {
  const normalizedOrigin = origin.replace(/\/+$/, '')

  return {
    models: `curl -sS ${normalizedOrigin}/v1/models \\
  -H "Authorization: Bearer $AIVANTA_API_KEY"`,
    chatCurl: `curl -sS ${normalizedOrigin}/v1/chat/completions \\
  -H "Authorization: Bearer $AIVANTA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "<MODEL_ID>",
    "messages": [
      { "role": "user", "content": "Explain what this API can do in one sentence." }
    ]
  }'`,
    chatPython: `# pip install openai
import os
from openai import OpenAI

client = OpenAI(
    base_url="${normalizedOrigin}/v1",
    api_key=os.environ["AIVANTA_API_KEY"],
)

response = client.chat.completions.create(
    model="<MODEL_ID>",
    messages=[
        {"role": "user", "content": "Explain what this API can do in one sentence."}
    ],
)
print(response.choices[0].message.content)`,
    chatJavaScript: `// npm install openai
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${normalizedOrigin}/v1",
  apiKey: process.env.AIVANTA_API_KEY,
});

const response = await client.chat.completions.create({
  model: "<MODEL_ID>",
  messages: [
    { role: "user", content: "Explain what this API can do in one sentence." },
  ],
});

console.log(response.choices[0].message.content);`,
    responses: `curl -sS ${normalizedOrigin}/v1/responses \\
  -H "Authorization: Bearer $AIVANTA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "<MODEL_ID>",
    "input": "Return a three-item checklist for testing an API integration."
  }'`,
    streaming: `curl -N ${normalizedOrigin}/v1/chat/completions \\
  -H "Authorization: Bearer $AIVANTA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "<MODEL_ID>",
    "stream": true,
    "messages": [
      { "role": "user", "content": "Count from one to five." }
    ]
  }'`,
    anthropic: `curl -sS ${normalizedOrigin}/v1/messages \\
  -H "x-api-key: $AIVANTA_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "<MODEL_ID>",
    "max_tokens": 512,
    "messages": [
      { "role": "user", "content": "Give me one integration tip." }
    ]
  }'`,
    gemini: `curl -sS ${normalizedOrigin}/v1beta/models/<MODEL_ID>:generateContent \\
  -H "x-goog-api-key: $AIVANTA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "contents": [
      { "role": "user", "parts": [{ "text": "Give me one integration tip." }] }
    ]
  }'`,
  }
}
