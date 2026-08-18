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
import { describe, test } from 'node:test'

import type { ChatCompletionRequest } from '../types'
import { createStreamRequestController } from './use-stream-request'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve
  })
  return { promise, resolve }
}

class FakeStreamSource {
  readyState = 0
  closed = false
  streamed = false
  private listeners = new Map<
    string,
    Array<
      (
        event: Event & {
          data?: string
          headers?: Record<string, string[]>
          readyState?: number
          responseCode?: number
        }
      ) => void
    >
  >()

  addEventListener(
    type: string,
    listener: (
      event: Event & {
        data?: string
        headers?: Record<string, string[]>
        readyState?: number
        responseCode?: number
      }
    ) => void
  ) {
    const listeners = this.listeners.get(type) ?? []
    listeners.push(listener)
    this.listeners.set(type, listeners)
  }

  close() {
    this.closed = true
  }

  stream() {
    this.streamed = true
  }

  emit(
    type: string,
    data?: string,
    headers?: Record<string, string[]>,
    responseCode?: number
  ) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener({
        data,
        headers,
        readyState: this.readyState,
        responseCode,
      } as Event & {
        data?: string
        headers?: Record<string, string[]>
        readyState?: number
        responseCode?: number
      })
    }
  }
}

const payload: ChatCompletionRequest = {
  model: 'test-model',
  messages: [{ role: 'user', content: 'hello' }],
  stream: true,
}

const selectedTokenId = 42

const noopCallbacks = {
  onUpdate: () => undefined,
  onComplete: () => undefined,
  onError: () => undefined,
}

describe('latest-wins stream request coordination', () => {
  test('only creates a stream for the latest header request', async () => {
    const firstHeaders = deferred<Record<string, string>>()
    const secondHeaders = deferred<Record<string, string>>()
    let headerRequest = 0
    const sources: FakeStreamSource[] = []
    const controller = createStreamRequestController({
      getHeaders: () => {
        headerRequest += 1
        return headerRequest === 1
          ? firstHeaders.promise
          : secondHeaders.promise
      },
      createSource: () => {
        const source = new FakeStreamSource()
        sources.push(source)
        return source
      },
      setStreaming: () => undefined,
    })

    const first = controller.send(payload, selectedTokenId, noopCallbacks)
    const second = controller.send(payload, selectedTokenId, noopCallbacks)
    firstHeaders.resolve({ Authorization: 'Bearer stale' })
    await first
    assert.equal(sources.length, 0)

    secondHeaders.resolve({ Authorization: 'Bearer current' })
    await second
    assert.equal(sources.length, 1)
    assert.equal(sources[0]?.streamed, true)
  })

  test('stop cancels a request that is still waiting for headers', async () => {
    const headers = deferred<Record<string, string>>()
    let sourceCount = 0
    const controller = createStreamRequestController({
      getHeaders: () => headers.promise,
      createSource: () => {
        sourceCount += 1
        return new FakeStreamSource()
      },
      setStreaming: () => undefined,
    })

    const request = controller.send(payload, selectedTokenId, noopCallbacks)
    controller.stop()
    headers.resolve({ Authorization: 'Bearer ignored' })
    await request

    assert.equal(sourceCount, 0)
  })

  test('dispose cancels a pending header request without a state update', async () => {
    const headers = deferred<Record<string, string>>()
    const streamingStates: boolean[] = []
    let sourceCount = 0
    const controller = createStreamRequestController({
      getHeaders: () => headers.promise,
      createSource: () => {
        sourceCount += 1
        return new FakeStreamSource()
      },
      setStreaming: (streaming) => streamingStates.push(streaming),
    })

    const request = controller.send(payload, selectedTokenId, noopCallbacks)
    controller.dispose()
    headers.resolve({ Authorization: 'Bearer ignored' })
    await request

    assert.equal(sourceCount, 0)
    assert.deepEqual(streamingStates, [false])
  })

  test('closes the previous source and ignores all of its later events', async () => {
    const nextHeaders = deferred<Record<string, string>>()
    let headerRequest = 0
    const sources: FakeStreamSource[] = []
    const updates: string[] = []
    const controller = createStreamRequestController({
      getHeaders: () => {
        headerRequest += 1
        if (headerRequest === 1) {
          return Promise.resolve({ Authorization: 'Bearer first' })
        }
        return nextHeaders.promise
      },
      createSource: () => {
        const source = new FakeStreamSource()
        sources.push(source)
        return source
      },
      setStreaming: () => undefined,
    })
    const callbacks = {
      onUpdate: (_type: 'reasoning' | 'content', chunk: string) =>
        updates.push(chunk),
      onComplete: () => undefined,
      onError: () => undefined,
    }

    await controller.send(payload, selectedTokenId, callbacks)
    const second = controller.send(payload, selectedTokenId, callbacks)
    assert.equal(sources[0]?.closed, true)
    sources[0]?.emit(
      'message',
      JSON.stringify({ choices: [{ delta: { content: 'stale' } }] })
    )

    nextHeaders.resolve({ Authorization: 'Bearer second' })
    await second
    sources[1]?.emit(
      'message',
      JSON.stringify({ choices: [{ delta: { content: 'current' } }] })
    )

    assert.deepEqual(updates, ['current'])
  })

  test('captures the request ID as soon as response headers open', async () => {
    const source = new FakeStreamSource()
    let capturedRequestId: string | undefined
    let completed = false
    const controller = createStreamRequestController({
      getHeaders: () => Promise.resolve({ Authorization: 'Bearer session' }),
      createSource: () => source,
      setStreaming: () => undefined,
    })

    await controller.send(payload, selectedTokenId, {
      onRequestId: (requestId) => {
        capturedRequestId = requestId
      },
      onUpdate: () => undefined,
      onComplete: () => {
        completed = true
      },
      onError: () => undefined,
    })
    source.emit(
      'open',
      undefined,
      {
        'x-oneapi-request-id': ['req-stream-123'],
      },
      200
    )

    assert.equal(capturedRequestId, 'req-stream-123')
    assert.equal(completed, false)
    source.emit('message', '[DONE]')
    assert.equal(completed, true)
    assert.equal(source.closed, false)
  })

  test('does not record a request ID from a rejected stream response', async () => {
    const source = new FakeStreamSource()
    let capturedRequestId: string | undefined
    const controller = createStreamRequestController({
      getHeaders: () => Promise.resolve({ Authorization: 'Bearer session' }),
      createSource: () => source,
      setStreaming: () => undefined,
    })

    await controller.send(payload, selectedTokenId, {
      ...noopCallbacks,
      onRequestId: (requestId) => {
        capturedRequestId = requestId
      },
    })
    source.emit(
      'open',
      undefined,
      { 'x-oneapi-request-id': ['rejected-request'] },
      503
    )

    assert.equal(capturedRequestId, undefined)
  })

  test('explicit stop aborts an active stream', async () => {
    const source = new FakeStreamSource()
    const controller = createStreamRequestController({
      getHeaders: () => Promise.resolve({ Authorization: 'Bearer session' }),
      createSource: () => source,
      setStreaming: () => undefined,
    })

    await controller.send(payload, selectedTokenId, noopCallbacks)
    controller.stop()

    assert.equal(source.closed, true)
  })
})
