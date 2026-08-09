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
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import type { ApiKey } from '@/features/keys/types'

import { getApiKeyModels, getUserGroups, getUserModels } from '../api'
import {
  getGroupFallback,
  getModelFallback,
  getOptionLoadErrorMessage,
  shouldClearModelForGroup,
} from '../lib'
import type { PlaygroundAuthMode, PlaygroundConfig } from '../types'

type UsePlaygroundOptionsParams = {
  apiKeySecret?: string
  authMode: PlaygroundAuthMode
  currentGroup: string
  currentModel: string
  selectedApiKey: ApiKey | null
  updateConfig: <K extends keyof PlaygroundConfig>(
    key: K,
    value: PlaygroundConfig[K]
  ) => void
}

export function usePlaygroundOptions({
  apiKeySecret,
  authMode,
  currentGroup,
  currentModel,
  selectedApiKey,
  updateConfig,
}: UsePlaygroundOptionsParams) {
  const { t } = useTranslation()

  const {
    data: modelsData,
    error: modelsError,
    isError: isModelsError,
    isLoading: isLoadingModels,
  } = useQuery({
    queryKey: [
      'playground-models',
      authMode,
      authMode === 'session' ? currentGroup : selectedApiKey?.id,
    ],
    queryFn: () => {
      if (authMode === 'session') {
        return getUserModels(currentGroup)
      }
      if (!apiKeySecret) {
        throw new Error('Failed to load selected API key')
      }
      return getApiKeyModels(apiKeySecret)
    },
    enabled:
      authMode === 'session'
        ? currentGroup !== ''
        : Boolean(selectedApiKey && apiKeySecret),
  })

  const {
    data: groupsData,
    error: groupsError,
    isError: isGroupsError,
  } = useQuery({
    queryKey: ['playground-groups'],
    queryFn: getUserGroups,
    enabled: authMode === 'session',
  })

  const apiKeyGroups = useMemo(() => {
    if (!selectedApiKey) return []

    const group = selectedApiKey.group?.trim() || 'default'
    return [
      {
        desc: t('Fixed by the selected API key'),
        label: group,
        ratio: 1,
        value: group,
      },
    ]
  }, [selectedApiKey, t])

  const groups = authMode === 'session' ? (groupsData ?? []) : apiKeyGroups
  const models = modelsData ?? []

  useEffect(() => {
    if (!isModelsError) return

    toast.error(
      getOptionLoadErrorMessage(
        modelsError,
        t('Failed to load playground models')
      )
    )
  }, [isModelsError, modelsError, t])

  useEffect(() => {
    if (!isGroupsError) return

    toast.error(
      getOptionLoadErrorMessage(
        groupsError,
        t('Failed to load playground groups')
      )
    )
  }, [isGroupsError, groupsError, t])

  useEffect(() => {
    if (!modelsData) return

    const fallback = getModelFallback(modelsData, currentModel)

    if (fallback) {
      updateConfig('model', fallback)
      return
    }

    if (shouldClearModelForGroup(modelsData, currentModel)) {
      updateConfig('model', '')
    }
  }, [modelsData, currentModel, updateConfig])

  useEffect(() => {
    if (authMode !== 'session' || !groupsData) return

    const fallback = getGroupFallback(groupsData, currentGroup)

    if (fallback) {
      updateConfig('group', fallback)
    }
  }, [authMode, groupsData, currentGroup, updateConfig])

  useEffect(() => {
    if (authMode !== 'api-key' || apiKeyGroups.length === 0) return

    const apiKeyGroup = apiKeyGroups[0].value
    if (apiKeyGroup !== currentGroup) {
      updateConfig('group', apiKeyGroup)
    }
  }, [apiKeyGroups, authMode, currentGroup, updateConfig])

  return {
    groups,
    isLoadingModels,
    models,
  }
}
