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
import { api, getFreshAuthHeaders } from '@/lib/api'

import { API_ENDPOINTS, ERROR_MESSAGES } from './constants'
import {
  buildEndpointPath,
  getPlaygroundEndpoint,
  type PlaygroundEndpointId,
} from './lib/endpoints'
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ModelOption,
  PlaygroundRequestAuth,
  PlaygroundSessionStats,
} from './types'

type RelayErrorPayload = {
  error?: {
    code?: string
    message?: string
  }
  message?: string
}

const MAX_PLAYGROUND_RESPONSE_BYTES = 2 * 1024 * 1024
const PLAYGROUND_STATS_REQUEST_BATCH_SIZE = 200

export type PlaygroundEndpointResult = {
  body: string
  contentType: string
  durationMs: number
  ok: boolean
  requestId?: string
  status: number
  truncated: boolean
}

export type PlaygroundEndpointRequest = {
  auth: PlaygroundRequestAuth
  body?: string
  endpointId: PlaygroundEndpointId
  file?: File
  formFields?: Record<string, string>
  model: string
  signal?: AbortSignal
}

export type PlaygroundChatCompletionResult = {
  data: ChatCompletionResponse
  requestId?: string
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
  apiKeyId: number | null,
  signal?: AbortSignal,
  onRequestId?: (requestId: string) => void
): Promise<PlaygroundChatCompletionResult> {
  if (!apiKeyId || !Number.isSafeInteger(apiKeyId) || apiKeyId <= 0) {
    throw new Error(ERROR_MESSAGES.API_KEY_REQUIRED)
  }

  const authHeaders = await getFreshAuthHeaders()
  const response = await fetch(API_ENDPOINTS.PLAYGROUND_CHAT_COMPLETIONS, {
    body: JSON.stringify(payload),
    credentials: 'include',
    headers: {
      ...authHeaders,
      'X-Playground-Token-Id': String(apiKeyId),
    },
    method: 'POST',
    signal,
  })
  const requestId = response.headers.get('X-Oneapi-Request-Id')?.trim()
  const data = await parseRelayResponse<ChatCompletionResponse>(response)
  if (requestId) {
    onRequestId?.(requestId)
  }

  return {
    data,
    requestId: requestId || undefined,
  }
}

export async function getPlaygroundSessionStats(
  requestIds: string[]
): Promise<PlaygroundSessionStats> {
  const normalizedRequestIds = [
    ...new Set(requestIds.map((id) => id.trim())),
  ].filter(Boolean)
  const combined: PlaygroundSessionStats = {
    cache_hit_rate: 0,
    cache_read_tokens: 0,
    cache_write_tokens: 0,
    cached_tokens: 0,
    cost_usd: 0,
    input_tokens: 0,
    output_tokens: 0,
    quota: 0,
    requested_request_count: 0,
    settled: true,
    settled_request_count: 0,
    total_tokens: 0,
  }

  for (
    let offset = 0;
    offset < normalizedRequestIds.length;
    offset += PLAYGROUND_STATS_REQUEST_BATCH_SIZE
  ) {
    const response = await api.post(
      API_ENDPOINTS.PLAYGROUND_SESSION_STATS,
      {
        request_ids: normalizedRequestIds.slice(
          offset,
          offset + PLAYGROUND_STATS_REQUEST_BATCH_SIZE
        ),
      },
      {
        skipBusinessError: true,
        skipErrorHandler: true,
      }
    )
    const payload = response.data as {
      data?: PlaygroundSessionStats
      message?: string
      success?: boolean
    }

    if (!payload.success || !payload.data) {
      throw new Error(payload.message || ERROR_MESSAGES.API_REQUEST_ERROR)
    }

    const stats = payload.data
    combined.settled = combined.settled && stats.settled
    combined.requested_request_count += stats.requested_request_count
    combined.settled_request_count += stats.settled_request_count
    combined.input_tokens += stats.input_tokens
    combined.output_tokens += stats.output_tokens
    combined.total_tokens += stats.total_tokens
    combined.cache_read_tokens += stats.cache_read_tokens
    combined.cache_write_tokens += stats.cache_write_tokens
    combined.cached_tokens += stats.cached_tokens
    combined.quota += stats.quota
    combined.cost_usd += stats.cost_usd
  }

  if (combined.input_tokens > 0) {
    combined.cache_hit_rate = Math.min(
      combined.cache_read_tokens / combined.input_tokens,
      1
    )
  }
  return combined
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
    data?: Array<{ id?: string; supported_endpoint_types?: string[] }>
  }>(response)

  if (!Array.isArray(data.data)) {
    return []
  }

  return data.data.flatMap((model) => {
    const name = model.id?.trim()
    return name
      ? [
          {
            label: name,
            value: name,
            supportedEndpointTypes: Array.isArray(
              model.supported_endpoint_types
            )
              ? model.supported_endpoint_types
              : [],
          },
        ]
      : []
  })
}

async function readPlaygroundEndpointBody(response: Response): Promise<{
  body: string
  truncated: boolean
}> {
  if (!response.body) {
    return { body: '', truncated: false }
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let body = ''
  let storedBytes = 0
  let truncated = false

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break

    const remaining = MAX_PLAYGROUND_RESPONSE_BYTES - storedBytes
    if (remaining <= 0) {
      truncated = true
      await reader.cancel()
      break
    }

    const chunk =
      value.byteLength > remaining ? value.subarray(0, remaining) : value
    body += decoder.decode(chunk, { stream: true })
    storedBytes += chunk.byteLength

    if (chunk.byteLength < value.byteLength) {
      truncated = true
      await reader.cancel()
      break
    }
  }

  body += decoder.decode()
  return { body, truncated }
}

function formatPlaygroundEndpointBody(
  body: string,
  contentType: string
): string {
  if (!body.trim() || !contentType.toLowerCase().includes('json')) {
    return body
  }

  try {
    return JSON.stringify(JSON.parse(body), null, 2)
  } catch {
    return body
  }
}

export async function sendPlaygroundEndpointRequest(
  request: PlaygroundEndpointRequest,
  onRequestAccepted?: (requestId: string) => void
): Promise<PlaygroundEndpointResult> {
  if (!request.auth.apiKey) {
    throw new Error(ERROR_MESSAGES.API_KEY_REQUIRED)
  }

  const headers = new Headers({
    Authorization: `Bearer ${request.auth.apiKey}`,
  })
  const endpoint = getPlaygroundEndpoint(request.endpointId)
  let body: BodyInit | undefined

  if (endpoint.bodyMode === 'multipart' && request.file) {
    const formData = new FormData()
    formData.append('file', request.file)
    for (const [key, value] of Object.entries(request.formFields ?? {})) {
      formData.append(key, value)
    }
    body = formData
  } else if (endpoint.bodyMode === 'json' && request.body !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = request.body
  }

  const startedAt = performance.now()
  const response = await fetch(
    buildEndpointPath(request.endpointId, request.model),
    {
      body,
      credentials: 'omit',
      headers,
      method: endpoint.method,
      signal: request.signal,
    }
  )
  const durationMs = Math.max(0, Math.round(performance.now() - startedAt))
  const contentType = response.headers.get('Content-Type') ?? ''
  const requestId = response.headers.get('X-Oneapi-Request-Id')?.trim()
  if (response.ok && requestId) {
    onRequestAccepted?.(requestId)
  }
  const result = await readPlaygroundEndpointBody(response)

  return {
    body: formatPlaygroundEndpointBody(result.body, contentType),
    contentType,
    durationMs,
    ok: response.ok,
    requestId: requestId || undefined,
    status: response.status,
    truncated: result.truncated,
  }
}
