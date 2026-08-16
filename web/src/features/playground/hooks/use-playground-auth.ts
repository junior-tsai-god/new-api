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
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { fetchTokenKey, getApiKeys } from '@/features/keys/api'
import { API_KEY_STATUS } from '@/features/keys/constants'
import type { ApiKey } from '@/features/keys/types'
import { useAuthStore } from '@/stores/auth-store'

import type { PlaygroundConfig, PlaygroundRequestAuth } from '../types'

export function normalizeApiKeySecret(key: string): string {
  return key.startsWith('sk-') ? key : `sk-${key}`
}

export function selectPlaygroundApiKey<T extends { id: number }>(
  apiKeys: T[],
  configuredApiKeyId: number | null
): T | null {
  return (
    apiKeys.find((item) => item.id === configuredApiKeyId) ?? apiKeys[0] ?? null
  )
}

async function getEnabledApiKeys(): Promise<ApiKey[]> {
  const result = await getApiKeys({ p: 1, size: 100 })
  if (!result.success) {
    throw new Error(result.message || 'Failed to load API keys')
  }

  return (result.data?.items ?? []).filter(
    (item) => item.status === API_KEY_STATUS.ENABLED
  )
}

async function getApiKeySecret(id: number): Promise<string> {
  const result = await fetchTokenKey(id)
  const key = result.data?.key?.trim()
  if (!result.success || !key) {
    throw new Error(result.message || 'Failed to load selected API key')
  }

  return normalizeApiKeySecret(key)
}

type UsePlaygroundAuthParams = {
  configuredApiKeyId: number | null
  updateConfig: <K extends keyof PlaygroundConfig>(
    key: K,
    value: PlaygroundConfig[K]
  ) => void
}

export function usePlaygroundAuth(params: UsePlaygroundAuthParams) {
  const { t } = useTranslation()
  const userId = useAuthStore((state) => state.auth.user?.id)
  const { configuredApiKeyId, updateConfig } = params

  const apiKeysQuery = useQuery({
    queryKey: ['playground-api-keys', userId],
    queryFn: getEnabledApiKeys,
    enabled: Boolean(userId),
    refetchOnMount: 'always',
    staleTime: 30 * 1000,
  })

  const apiKeys = useMemo(() => apiKeysQuery.data ?? [], [apiKeysQuery.data])
  const selectedApiKey = useMemo(
    () => selectPlaygroundApiKey(apiKeys, configuredApiKeyId),
    [apiKeys, configuredApiKeyId]
  )
  const selectedApiKeyId = selectedApiKey?.id

  useEffect(() => {
    if (!apiKeysQuery.data) return

    const nextId = selectedApiKeyId ?? null
    if (nextId !== configuredApiKeyId) {
      updateConfig('api_key_id', nextId)
    }
  }, [apiKeysQuery.data, configuredApiKeyId, selectedApiKeyId, updateConfig])

  const apiKeySecretQuery = useQuery({
    queryKey: ['playground-api-key-secret', userId, selectedApiKeyId],
    queryFn: () => {
      if (selectedApiKeyId === undefined) {
        throw new Error('Failed to load selected API key')
      }
      return getApiKeySecret(selectedApiKeyId)
    },
    enabled: Boolean(userId) && selectedApiKeyId !== undefined,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
  })

  useEffect(() => {
    if (!apiKeysQuery.isError) return

    toast.error(
      apiKeysQuery.error instanceof Error
        ? apiKeysQuery.error.message
        : t('Failed to load API keys')
    )
  }, [apiKeysQuery.error, apiKeysQuery.isError, t])

  useEffect(() => {
    if (!apiKeySecretQuery.isError) return

    toast.error(
      apiKeySecretQuery.error instanceof Error
        ? apiKeySecretQuery.error.message
        : t('Failed to load selected API key')
    )
  }, [apiKeySecretQuery.error, apiKeySecretQuery.isError, t])

  const requestAuth = useMemo<PlaygroundRequestAuth>(
    () => ({
      apiKey: apiKeySecretQuery.data,
    }),
    [apiKeySecretQuery.data]
  )

  return {
    apiKeys,
    isLoadingApiKeys: apiKeysQuery.isLoading,
    isLoadingApiKeySecret: apiKeySecretQuery.isLoading,
    requestAuth,
    selectedApiKey,
  }
}
