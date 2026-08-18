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
import {
  getPlaygroundEndpoint,
  type PlaygroundEndpointId,
} from './endpoint-registry'

export type PlaygroundJsonPrimitive = string | number | boolean | null
export type PlaygroundJsonValue =
  | PlaygroundJsonPrimitive
  | PlaygroundJsonValue[]
  | PlaygroundJsonObject
export type PlaygroundJsonObject = { [key: string]: PlaygroundJsonValue }

export type PlaygroundEndpointBodyErrorCode =
  | 'body_not_supported'
  | 'body_required'
  | 'invalid_json'
  | 'body_must_be_object'

export class PlaygroundEndpointBodyError extends Error {
  constructor(
    readonly code: PlaygroundEndpointBodyErrorCode,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options)
    this.name = 'PlaygroundEndpointBodyError'
  }
}

export type PlaygroundEndpointBodyValidation =
  | { valid: true; body: PlaygroundJsonObject | null }
  | { valid: false; code: PlaygroundEndpointBodyErrorCode; message: string }

function createDefaultBody(
  endpointId: PlaygroundEndpointId,
  model: string
): PlaygroundJsonObject | null {
  const normalizedModel = model.trim()

  switch (endpointId) {
    case 'models':
      return null
    case 'chat-completions':
      return {
        model: normalizedModel,
        messages: [
          {
            role: 'user',
            content: 'Explain what this model can do in one sentence.',
          },
        ],
        stream: false,
      }
    case 'responses':
      return {
        model: normalizedModel,
        input: 'Return a three-item checklist for testing an API integration.',
      }
    case 'anthropic-messages':
      return {
        model: normalizedModel,
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: 'Give me one practical API integration tip.',
          },
        ],
      }
    case 'gemini-generate-content':
      return {
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Give me one practical API integration tip.' }],
          },
        ],
      }
    case 'embeddings':
      return {
        model: normalizedModel,
        input: 'A unified API makes model integrations easier to maintain.',
      }
    case 'image-generations':
      return {
        model: normalizedModel,
        prompt: 'A clean isometric illustration of an AI API gateway.',
        size: '1024x1024',
      }
    case 'audio-transcriptions':
      return { model: normalizedModel }
    case 'rerank':
      return {
        model: normalizedModel,
        query: 'Which document best explains an API gateway?',
        documents: [
          'An API gateway routes, secures, and observes API traffic.',
          'A database stores structured application data.',
        ],
        top_n: 2,
      }
    case 'videos':
      return {
        model: normalizedModel,
        prompt: 'A paper airplane flying through soft clouds.',
        seconds: '4',
        size: '1280x720',
      }
  }
}

export function createDefaultEndpointBody(
  endpointId: PlaygroundEndpointId,
  model: string
): string {
  const body = createDefaultBody(endpointId, model)
  return body === null ? '' : JSON.stringify(body, null, 2)
}

export function parseEndpointBody(
  endpointId: PlaygroundEndpointId,
  source: string
): PlaygroundJsonObject | null {
  const endpoint = getPlaygroundEndpoint(endpointId)
  const normalizedSource = source.trim()

  if (endpoint.bodyMode === 'none') {
    if (normalizedSource === '') return null

    throw new PlaygroundEndpointBodyError(
      'body_not_supported',
      `${endpoint.method} ${endpoint.pathTemplate} does not accept a request body`
    )
  }

  if (normalizedSource === '') {
    throw new PlaygroundEndpointBodyError(
      'body_required',
      `${endpoint.method} ${endpoint.pathTemplate} requires a request body`
    )
  }

  let value: unknown
  try {
    value = JSON.parse(normalizedSource) as unknown
  } catch (error) {
    throw new PlaygroundEndpointBodyError(
      'invalid_json',
      'Request body is not valid JSON',
      { cause: error }
    )
  }

  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new PlaygroundEndpointBodyError(
      'body_must_be_object',
      'Request body must be a JSON object'
    )
  }

  return value as PlaygroundJsonObject
}

export function validateEndpointBody(
  endpointId: PlaygroundEndpointId,
  source: string
): PlaygroundEndpointBodyValidation {
  try {
    return { valid: true, body: parseEndpointBody(endpointId, source) }
  } catch (error) {
    if (error instanceof PlaygroundEndpointBodyError) {
      return { valid: false, code: error.code, message: error.message }
    }

    throw error
  }
}
