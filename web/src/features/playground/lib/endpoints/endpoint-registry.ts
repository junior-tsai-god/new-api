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
export const PLAYGROUND_ENDPOINT_IDS = [
  'models',
  'chat-completions',
  'responses',
  'anthropic-messages',
  'gemini-generate-content',
  'embeddings',
  'image-generations',
  'audio-transcriptions',
  'rerank',
  'videos',
] as const

export type PlaygroundEndpointId = (typeof PLAYGROUND_ENDPOINT_IDS)[number]

export type PlaygroundEndpointCapabilityType =
  | 'openai'
  | 'openai-response'
  | 'anthropic'
  | 'gemini'
  | 'embeddings'
  | 'image-generation'
  | 'jina-rerank'
  | 'openai-video'

export type PlaygroundEndpointDefinition = Readonly<{
  id: PlaygroundEndpointId
  labelKey: string
  method: 'GET' | 'POST'
  pathTemplate: string
  category: 'models' | 'text' | 'native' | 'vectors' | 'media' | 'ranking'
  bodyMode: 'none' | 'json' | 'multipart'
  requiresModel: boolean
  capabilityType?: PlaygroundEndpointCapabilityType
}>

export const PLAYGROUND_ENDPOINTS = [
  {
    id: 'models',
    labelKey: 'Models',
    method: 'GET',
    pathTemplate: '/v1/models',
    category: 'models',
    bodyMode: 'none',
    requiresModel: false,
    capabilityType: undefined,
  },
  {
    id: 'chat-completions',
    labelKey: 'Chat Completions',
    method: 'POST',
    pathTemplate: '/v1/chat/completions',
    category: 'text',
    bodyMode: 'json',
    requiresModel: true,
    capabilityType: 'openai',
  },
  {
    id: 'responses',
    labelKey: 'Responses API',
    method: 'POST',
    pathTemplate: '/v1/responses',
    category: 'text',
    bodyMode: 'json',
    requiresModel: true,
    capabilityType: 'openai-response',
  },
  {
    id: 'anthropic-messages',
    labelKey: 'Anthropic Messages',
    method: 'POST',
    pathTemplate: '/v1/messages',
    category: 'native',
    bodyMode: 'json',
    requiresModel: true,
    capabilityType: 'anthropic',
  },
  {
    id: 'gemini-generate-content',
    labelKey: 'Gemini GenerateContent',
    method: 'POST',
    pathTemplate: '/v1beta/models/{model}:generateContent',
    category: 'native',
    bodyMode: 'json',
    requiresModel: true,
    capabilityType: 'gemini',
  },
  {
    id: 'embeddings',
    labelKey: 'Embeddings',
    method: 'POST',
    pathTemplate: '/v1/embeddings',
    category: 'vectors',
    bodyMode: 'json',
    requiresModel: true,
    capabilityType: 'embeddings',
  },
  {
    id: 'image-generations',
    labelKey: 'Image Generation',
    method: 'POST',
    pathTemplate: '/v1/images/generations',
    category: 'media',
    bodyMode: 'json',
    requiresModel: true,
    capabilityType: 'image-generation',
  },
  {
    id: 'audio-transcriptions',
    labelKey: 'Audio Transcription',
    method: 'POST',
    pathTemplate: '/v1/audio/transcriptions',
    category: 'media',
    bodyMode: 'multipart',
    requiresModel: true,
    capabilityType: undefined,
  },
  {
    id: 'rerank',
    labelKey: 'Rerank',
    method: 'POST',
    pathTemplate: '/v1/rerank',
    category: 'ranking',
    bodyMode: 'json',
    requiresModel: true,
    capabilityType: 'jina-rerank',
  },
  {
    id: 'videos',
    labelKey: 'Video',
    method: 'POST',
    pathTemplate: '/v1/videos',
    category: 'media',
    bodyMode: 'json',
    requiresModel: true,
    capabilityType: 'openai-video',
  },
] as const satisfies readonly PlaygroundEndpointDefinition[]

const endpointById = Object.fromEntries(
  PLAYGROUND_ENDPOINTS.map((endpoint) => [endpoint.id, endpoint])
) as Record<PlaygroundEndpointId, PlaygroundEndpointDefinition>

export function isPlaygroundEndpointId(
  value: string
): value is PlaygroundEndpointId {
  return Object.hasOwn(endpointById, value)
}

export function getPlaygroundEndpoint(
  endpointId: PlaygroundEndpointId
): PlaygroundEndpointDefinition {
  return endpointById[endpointId]
}

export class PlaygroundEndpointPathError extends Error {
  readonly code = 'model_required'

  constructor(endpointId: PlaygroundEndpointId) {
    super(`A model is required to build the ${endpointId} endpoint path`)
    this.name = 'PlaygroundEndpointPathError'
  }
}

export function buildEndpointPath(
  endpointId: PlaygroundEndpointId,
  model: string
): string {
  const endpoint = getPlaygroundEndpoint(endpointId)
  if (!endpoint.pathTemplate.includes('{model}')) {
    return endpoint.pathTemplate
  }

  const normalizedModel = model.trim()
  if (normalizedModel === '') {
    throw new PlaygroundEndpointPathError(endpointId)
  }

  return endpoint.pathTemplate.replaceAll(
    '{model}',
    encodeURIComponent(normalizedModel)
  )
}
