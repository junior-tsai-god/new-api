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
import { API_ENDPOINTS, ERROR_MESSAGES } from './constants'
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ModelOption,
  PlaygroundRequestAuth,
} from './types'

type RelayErrorPayload = {
  error?: {
    code?: string
    message?: string
  }
  message?: string
}

async function parseRelayResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & RelayErrorPayload
  if (response.ok) {
    return data
  }

  const error = new Error(
    data.error?.message || data.message || `HTTP ${response.status}`
  ) as Error & { response?: { data: RelayErrorPayload } }
  error.response = { data }
  throw error
}

/**
 * Send chat completion request (non-streaming)
 */
export async function sendChatCompletion(
  payload: ChatCompletionRequest,
  auth: PlaygroundRequestAuth,
  signal?: AbortSignal
): Promise<ChatCompletionResponse> {
  if (!auth.apiKey) {
    throw new Error(ERROR_MESSAGES.API_KEY_REQUIRED)
  }

  const response = await fetch(API_ENDPOINTS.API_KEY_CHAT_COMPLETIONS, {
    body: JSON.stringify(payload),
    credentials: 'omit',
    headers: {
      Authorization: `Bearer ${auth.apiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    signal,
  })
  return parseRelayResponse<ChatCompletionResponse>(response)
}

/**
 * Get models available to a selected API key without exposing the key in the UI.
 */
export async function getApiKeyModels(apiKey: string): Promise<ModelOption[]> {
  const response = await fetch(API_ENDPOINTS.API_KEY_MODELS, {
    credentials: 'omit',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })
  const data = await parseRelayResponse<{
    data?: Array<{ id?: string }>
  }>(response)

  if (!Array.isArray(data.data)) {
    return []
  }

  return data.data.flatMap((model) => {
    const name = model.id?.trim()
    return name ? [{ label: name, value: name }] : []
  })
}
