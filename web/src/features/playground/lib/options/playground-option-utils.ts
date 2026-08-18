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
import type { ModelOption } from '../../types'
import type { PlaygroundEndpointCapabilityType } from '../endpoints'

export function getModelsForEndpoint(
  models: ModelOption[],
  capabilityType?: PlaygroundEndpointCapabilityType
): ModelOption[] {
  if (!capabilityType) {
    return models
  }

  const compatibleModels = models.filter((model) =>
    model.supportedEndpointTypes?.includes(capabilityType)
  )

  // Older model-list responses may omit capability metadata. Keep the
  // server-authoritative list available instead of presenting an empty field.
  return compatibleModels.length > 0 ? compatibleModels : models
}

export function getModelFallback(
  models: ModelOption[],
  currentModel: string
): string | null {
  const hasCurrentModel = models.some((model) => model.value === currentModel)

  if (hasCurrentModel || models.length === 0) {
    return null
  }

  return models[0].value
}

export function shouldClearUnavailableModel(
  models: ModelOption[],
  currentModel: string
): boolean {
  if (currentModel === '') {
    return false
  }

  return !models.some((model) => model.value === currentModel)
}

export function getOptionLoadErrorMessage(
  error: unknown,
  fallbackMessage: string
): string {
  return error instanceof Error ? error.message : fallbackMessage
}
