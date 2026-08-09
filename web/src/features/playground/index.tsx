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

import { PlaygroundChat } from './components/chat/playground-chat'
import { PlaygroundAuthControl } from './components/input/playground-auth-control'
import { PlaygroundInput } from './components/input/playground-input'
import { PlaygroundStatusRail } from './components/playground-status-rail'
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
  const {
    config,
    parameterEnabled,
    messages,
    isLoadingMessages,
    updateMessages,
    updateConfig,
    updateParameterEnabled,
    clearMessages,
  } = usePlaygroundState()

  const {
    apiKeys,
    isLoadingApiKeys,
    isLoadingApiKeySecret,
    requestAuth,
    selectedApiKey,
  } = usePlaygroundAuth({
    authMode: config.auth_mode,
    configuredApiKeyId: config.api_key_id,
    updateConfig,
  })

  const { groups, isLoadingModels, models } = usePlaygroundOptions({
    apiKeySecret: requestAuth.apiKey,
    authMode: config.auth_mode,
    currentGroup: config.group,
    currentModel: config.model,
    selectedApiKey,
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
        <PlaygroundStatusRail
          authMode={config.auth_mode}
          isLoading={isLoadingModels || isLoadingApiKeySecret}
          model={config.model}
          modelCount={models.length}
        />
        <PlaygroundAuthControl
          apiKeys={apiKeys}
          authMode={config.auth_mode}
          disabled={isGenerating}
          isLoadingApiKeys={isLoadingApiKeys}
          isLoadingApiKeySecret={isLoadingApiKeySecret}
          onApiKeyChange={(id) => updateConfig('api_key_id', id)}
          onAuthModeChange={(mode) => updateConfig('auth_mode', mode)}
          selectedApiKeyId={selectedApiKey?.id ?? null}
        />
        <PlaygroundInput
          config={config}
          disabled={isGenerating}
          groups={groups}
          groupValue={config.group}
          isGenerating={isGenerating}
          isModelLoading={isLoadingModels || isLoadingApiKeySecret}
          modelValue={config.model}
          models={models}
          onGroupChange={(value) => updateConfig('group', value)}
          onConfigChange={updateConfig}
          onClearMessages={handleClearMessages}
          onModelChange={(value) => updateConfig('model', value)}
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
