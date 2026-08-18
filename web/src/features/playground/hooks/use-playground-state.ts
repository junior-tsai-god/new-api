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
import { useCallback, useEffect, useRef, useState } from 'react'

import { DEFAULT_CONFIG, DEFAULT_PARAMETER_ENABLED } from '../constants'
import {
  clearLegacyPlaygroundData,
  saveConfig,
  saveParameterEnabled,
  saveMessages,
  applyMessageStateUpdate,
  getInitialParameterEnabled,
  getInitialPlaygroundConfig,
  loadMessages,
  loadSessionRequestIds,
  saveSessionRequestIds,
  appendSessionRequestId,
  type MessageStateUpdater,
} from '../lib'
import type { Message, PlaygroundConfig, ParameterEnabled } from '../types'

const MESSAGE_SAVE_DEBOUNCE_MS = 500

/**
 * Main state management hook for playground
 */
export function usePlaygroundState(userId?: number) {
  // Load initial state from localStorage
  const [config, setConfig] = useState<PlaygroundConfig>(() =>
    getInitialPlaygroundConfig(userId)
  )

  const [parameterEnabled, setParameterEnabled] = useState<ParameterEnabled>(
    () => getInitialParameterEnabled(userId)
  )

  const [messages, setMessages] = useState<Message[]>([])
  const [sessionRequestIds, setSessionRequestIds] = useState<string[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const messagesSaveTimerRef = useRef<number | null>(null)
  const latestMessagesRef = useRef<Message[]>(messages)
  const hasLoadedMessagesRef = useRef(false)

  const persistMessages = useCallback(
    (messagesToSave: Message[]) => {
      latestMessagesRef.current = messagesToSave

      if (!hasLoadedMessagesRef.current) {
        return
      }

      if (messagesSaveTimerRef.current !== null) {
        window.clearTimeout(messagesSaveTimerRef.current)
      }

      messagesSaveTimerRef.current = window.setTimeout(() => {
        messagesSaveTimerRef.current = null
        saveMessages(userId, latestMessagesRef.current)
      }, MESSAGE_SAVE_DEBOUNCE_MS)
    },
    [userId]
  )

  useEffect(() => {
    let cancelled = false

    clearLegacyPlaygroundData()

    window.setTimeout(() => {
      const loadedMessages = loadMessages(userId) ?? []
      const loadedSessionRequestIds = loadSessionRequestIds(userId)
      if (cancelled) {
        return
      }

      latestMessagesRef.current = loadedMessages
      hasLoadedMessagesRef.current = true
      setMessages(loadedMessages)
      setSessionRequestIds(loadedSessionRequestIds)
      setIsLoadingMessages(false)
    }, 0)

    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(
    () => () => {
      if (messagesSaveTimerRef.current !== null) {
        window.clearTimeout(messagesSaveTimerRef.current)
        saveMessages(userId, latestMessagesRef.current)
      }
    },
    [userId]
  )

  // Update config with automatic save
  const updateConfig = useCallback(
    <K extends keyof PlaygroundConfig>(key: K, value: PlaygroundConfig[K]) => {
      setConfig((prev) => {
        const updated = { ...prev, [key]: value }
        saveConfig(userId, updated)
        return updated
      })
    },
    [userId]
  )

  // Update parameter enabled with automatic save
  const updateParameterEnabled = useCallback(
    (key: keyof ParameterEnabled, value: boolean) => {
      setParameterEnabled((prev) => {
        const updated = { ...prev, [key]: value }
        saveParameterEnabled(userId, updated)
        return updated
      })
    },
    [userId]
  )

  // Update messages with automatic save
  const updateMessages = useCallback(
    (updater: MessageStateUpdater) => {
      setMessages((prev) => {
        const newMessages = applyMessageStateUpdate(prev, updater)
        persistMessages(newMessages)
        return newMessages
      })
    },
    [persistMessages]
  )

  const recordCompletedRequestId = useCallback(
    (requestId: string) => {
      setSessionRequestIds((currentRequestIds) => {
        const nextRequestIds = appendSessionRequestId(
          currentRequestIds,
          requestId
        )
        if (nextRequestIds === currentRequestIds) {
          return currentRequestIds
        }

        saveSessionRequestIds(userId, nextRequestIds)
        return nextRequestIds
      })
    },
    [userId]
  )

  const resetConversation = useCallback(() => {
    if (messagesSaveTimerRef.current !== null) {
      window.clearTimeout(messagesSaveTimerRef.current)
      messagesSaveTimerRef.current = null
    }

    latestMessagesRef.current = []
    setMessages([])
    setSessionRequestIds([])
    saveMessages(userId, [])
    saveSessionRequestIds(userId, [])
  }, [userId])

  // Reset config to defaults
  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG)
    setParameterEnabled(DEFAULT_PARAMETER_ENABLED)
    saveConfig(userId, DEFAULT_CONFIG)
    saveParameterEnabled(userId, DEFAULT_PARAMETER_ENABLED)
  }, [userId])

  return {
    // State
    config,
    parameterEnabled,
    messages,
    sessionRequestIds,
    isLoadingMessages,
    // Actions
    updateConfig,
    updateParameterEnabled,
    updateMessages,
    recordCompletedRequestId,
    resetConversation,
    resetConfig,
  }
}
