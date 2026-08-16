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
import { useEffect } from 'react'

import { useAuthStore } from '@/stores/auth-store'

import { PlaygroundChat } from './components/chat/playground-chat'
import { PlaygroundAuthControl } from './components/input/playground-auth-control'
import { PlaygroundInput } from './components/input/playground-input'
import { PlaygroundModelControl } from './components/input/playground-model-control'
import {
  useChatHandler,
  usePlaygroundAuth,
  usePlaygroundConversation,
  usePlaygroundOptions,
  usePlaygroundState,
} from './hooks'

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
  const {
    config,
    parameterEnabled,
    messages,
    isLoadingMessages,
    updateMessages,
    updateConfig,
    updateParameterEnabled,
    clearMessages,
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

  const { sendChat, stopGeneration, isGenerating } = useChatHandler({
    config,
    parameterEnabled,
    requestAuth,
    onMessageUpdate: updateMessages,
  })

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

  const handleClearMessages = () => {
    handleEditOpenChange(false)
    clearMessages()
  }

  useEffect(() => {
    if (props.initialModel && props.initialModel !== config.model) {
      updateConfig('model', props.initialModel)
    }
  }, [config.model, props.initialModel, updateConfig])

  return (
    <div className='relative flex size-full min-h-0 flex-col overflow-hidden'>
      {/* Full-width scroll container: scrolling works even over side whitespace */}
      <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
        <PlaygroundChat
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
      </div>

      {/* Input area: center content and constrain to the same container width */}
      <div className='mx-auto grid w-full max-w-4xl gap-2 px-1 md:pb-4'>
        <div className='grid min-w-0 gap-2 md:grid-cols-2'>
          <PlaygroundModelControl
            disabled={isGenerating}
            isLoading={isLoadingModels || isLoadingApiKeySecret}
            models={models}
            onModelChange={(value) => updateConfig('model', value)}
            selectedModel={config.model}
          />
          <PlaygroundAuthControl
            apiKeys={apiKeys}
            disabled={isGenerating}
            isLoadingApiKeys={isLoadingApiKeys}
            isLoadingApiKeySecret={isLoadingApiKeySecret}
            onApiKeyChange={(id) => updateConfig('api_key_id', id)}
            selectedApiKeyId={selectedApiKey?.id ?? null}
          />
        </div>
        <PlaygroundInput
          config={config}
          disabled={isGenerating}
          isGenerating={isGenerating}
          isRequestConfigLoading={isLoadingModels || isLoadingApiKeySecret}
          models={models}
          onConfigChange={updateConfig}
          onClearMessages={handleClearMessages}
          onParameterEnabledChange={updateParameterEnabled}
          onStop={stopGeneration}
          onSubmit={handleSendMessage}
          parameterEnabled={parameterEnabled}
          hasMessages={messages.length > 0}
        />
      </div>
    </div>
  )
}
