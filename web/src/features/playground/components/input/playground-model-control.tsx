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
import { AiChipIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useTranslation } from 'react-i18next'

import { ModelSelector } from '@/components/model-group-selector'
import { Spinner } from '@/components/ui/spinner'

import type { ModelOption } from '../../types'

type PlaygroundModelControlProps = {
  disabled?: boolean
  isLoading?: boolean
  models: ModelOption[]
  onModelChange: (value: string) => void
  selectedModel: string
}

export function PlaygroundModelControl(props: PlaygroundModelControlProps) {
  const { t } = useTranslation()
  const isDisabled =
    props.disabled || props.isLoading || props.models.length === 0

  return (
    <div
      aria-label={t('Model')}
      className='border-border/70 bg-muted/25 flex min-w-0 items-center gap-2 rounded-lg border p-2'
      data-loading={props.isLoading || undefined}
      data-slot='playground-model-control'
      role='group'
    >
      <span className='flex shrink-0 items-center gap-2'>
        <span className='flex size-8 items-center justify-center rounded-md bg-[var(--deck-signal)] text-[var(--deck-ink)]'>
          <HugeiconsIcon
            aria-hidden='true'
            className='size-4'
            icon={AiChipIcon}
            strokeWidth={2}
          />
        </span>
        <span className='text-foreground text-xs font-semibold'>
          {t('Model')}
        </span>
      </span>

      <div className='ms-auto flex min-w-0 flex-1 items-center gap-2'>
        {props.isLoading ? (
          <>
            <Spinner aria-hidden='true' />
            <span className='sr-only' role='status'>
              {t('Loading...')}
            </span>
          </>
        ) : null}
        <ModelSelector
          className='min-w-0 flex-1'
          disabled={isDisabled}
          emptyLabel={props.isLoading ? undefined : t('No models available')}
          models={props.models}
          onModelChange={props.onModelChange}
          selectedModel={props.selectedModel}
          triggerVariant='field'
        />
      </div>
    </div>
  )
}
