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
import { useEffect, useMemo, useRef, useState } from 'react'

import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

import { PlaygroundChat } from './components/chat/playground-chat'
import { PlaygroundEndpointDebugger } from './components/endpoint/playground-endpoint-debugger'
import { PlaygroundAuthControl } from './components/input/playground-auth-control'
import { PlaygroundEndpointControl } from './components/input/playground-endpoint-control'
import { PlaygroundInput } from './components/input/playground-input'
import { PlaygroundModelControl } from './components/input/playground-model-control'
import { PlaygroundSessionStats } from './components/input/playground-session-stats'
import {
  useChatHandler,
  usePlaygroundAuth,
  usePlaygroundConversation,
  usePlaygroundOptions,
  usePlaygroundSessionStats,
  usePlaygroundState,
} from './hooks'
import {
  getModelFallback,
  getModelsForEndpoint,
  getPlaygroundEndpoint,
} from './lib'

type PlaygroundProps = {
  initialModel?: string
}

export function Playground(props: PlaygroundProps) {
  const userId = useAuthStore((state) => state.auth.user?.id)

  return (
    <UserPlayground
      key={userId ?? 'signed-out'}
      initialModel={props.initialModel}
      userId={userId}
    />
  )
}

type UserPlaygroundProps = PlaygroundProps & {
  userId: number | undefined
}

function UserPlayground(props: UserPlaygroundProps) {
  const appliedInitialModelRef = useRef<string | undefined>(undefined)
  const [conversationResetNonce, setConversationResetNonce] = useState(0)
  const {
    config,
    parameterEnabled,
    messages,
    sessionRequestIds,
    isLoadingMessages,
    updateMessages,
    updateConfig,
    updateParameterEnabled,
    recordCompletedRequestId,
    resetConversation,
  } = usePlaygroundState(props.userId)

  const {
    apiKeys,
    isLoadingApiKeys,
    isLoadingApiKeySecret,
    requestAuth,
    selectedApiKey,
  } = usePlaygroundAuth({
    configuredApiKeyId: config.api_key_id,
    updateConfig,
  })

  const { isLoadingModels, models } = usePlaygroundOptions({
    apiKeyId: selectedApiKey?.id,
    apiKeySecret: requestAuth.apiKey,
    currentModel: config.model,
    updateConfig,
  })

  const { discardGeneration, sendChat, stopGeneration, isGenerating } =
    useChatHandler({
      config,
      parameterEnabled,
      onMessageUpdate: updateMessages,
      onRequestComplete: recordCompletedRequestId,
    })

  const { hasStatsError, isLoadingStats, isSettlingStats, retryStats, stats } =
    usePlaygroundSessionStats(props.userId, sessionRequestIds)

  const {
    editingMessageKey,
    handleSendMessage,
    handleRegenerateMessage,
    handleEditMessage,
    handleEditOpenChange,
    applyEdit,
    handleDeleteMessage,
  } = usePlaygroundConversation({
    messages,
    updateMessages,
    sendChat,
  })

  const handleResetConversation = () => {
    discardGeneration()
    handleEditOpenChange(false)
    resetConversation()
    setConversationResetNonce((nonce) => nonce + 1)
  }

  useEffect(() => {
    if (
      !props.initialModel ||
      appliedInitialModelRef.current === props.initialModel
    ) {
      return
    }

    appliedInitialModelRef.current = props.initialModel
    if (props.initialModel !== config.model) {
      updateConfig('model', props.initialModel)
    }
  }, [config.model, props.initialModel, updateConfig])

  const endpoint = getPlaygroundEndpoint(config.endpoint_id)
  const isChatEndpoint = config.endpoint_id === 'chat-completions'
  const endpointModels = useMemo(
    () => getModelsForEndpoint(models, endpoint.capabilityType),
    [endpoint.capabilityType, models]
  )
  const isRequestConfigLoading =
    isLoadingApiKeySecret || (endpoint.requiresModel && isLoadingModels)

  useEffect(() => {
    if (!endpoint.requiresModel) return

    const fallbackModel = getModelFallback(endpointModels, config.model)
    if (fallbackModel) {
      updateConfig('model', fallbackModel)
    }
  }, [config.model, endpoint.requiresModel, endpointModels, updateConfig])

  return (
    <div className='relative flex size-full min-h-0 flex-col overflow-hidden'>
      {/* Full-width scroll container: scrolling works even over side whitespace */}
      <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
        {isChatEndpoint ? (
          <PlaygroundChat
            key={`chat:${conversationResetNonce}`}
            messages={messages}
            isLoadingMessages={isLoadingMessages}
            onRegenerateMessage={handleRegenerateMessage}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onSelectPrompt={handleSendMessage}
            isGenerating={isGenerating}
            editingKey={editingMessageKey}
            onCancelEdit={handleEditOpenChange}
            onSaveEdit={(newContent) => applyEdit(newContent, false)}
            onSaveEditAndSubmit={(newContent) => applyEdit(newContent, true)}
          />
        ) : (
          <PlaygroundEndpointDebugger
            key={`${config.endpoint_id}:${config.model}:${selectedApiKey?.id ?? 'none'}`}
            disabled={isRequestConfigLoading}
            endpointId={config.endpoint_id}
            model={config.model}
            requestAuth={requestAuth}
          />
        )}
      </div>

      {/* Input area: center content and constrain to the same container width */}
      <div className='mx-auto grid w-full max-w-4xl shrink-0 gap-2 px-1 md:pb-4'>
        <PlaygroundEndpointControl
          disabled={isGenerating}
          endpointId={config.endpoint_id}
          onEndpointChange={(value) => updateConfig('endpoint_id', value)}
        />
        <div
          className={cn(
            'grid min-w-0 gap-2',
            endpoint.requiresModel && 'md:grid-cols-2'
          )}
        >
          {endpoint.requiresModel ? (
            <PlaygroundModelControl
              disabled={isGenerating}
              isLoading={isLoadingModels || isLoadingApiKeySecret}
              models={endpointModels}
              onModelChange={(value) => updateConfig('model', value)}
              selectedModel={config.model}
            />
          ) : null}
          <PlaygroundAuthControl
            apiKeys={apiKeys}
            disabled={isGenerating}
            isLoadingApiKeys={isLoadingApiKeys}
            isLoadingApiKeySecret={isLoadingApiKeySecret}
            onApiKeyChange={(id) => updateConfig('api_key_id', id)}
            selectedApiKeyId={selectedApiKey?.id ?? null}
          />
        </div>
        {isChatEndpoint ? (
          <PlaygroundSessionStats
            hasError={hasStatsError}
            isLoading={isLoadingStats}
            isSettling={isSettlingStats}
            onRetry={() => void retryStats()}
            stats={stats}
          />
        ) : null}
        {isChatEndpoint ? (
          <PlaygroundInput
            key={`input:${conversationResetNonce}`}
            config={config}
            disabled={isGenerating}
            isGenerating={isGenerating}
            isRequestConfigLoading={isRequestConfigLoading}
            models={endpointModels}
            onConfigChange={updateConfig}
            onResetConversation={handleResetConversation}
            onParameterEnabledChange={updateParameterEnabled}
            onStop={stopGeneration}
            onSubmit={handleSendMessage}
            parameterEnabled={parameterEnabled}
            hasConversation={
              messages.length > 0 || sessionRequestIds.length > 0
            }
          />
        ) : null}
      </div>
    </div>
  )
}
