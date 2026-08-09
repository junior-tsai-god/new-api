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
import { Key01Icon, LoginMethodIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldTitle } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { ApiKey } from '@/features/keys/types'

import type { PlaygroundAuthMode } from '../../types'

type PlaygroundAuthControlProps = {
  apiKeys: ApiKey[]
  authMode: PlaygroundAuthMode
  disabled?: boolean
  isLoadingApiKeys: boolean
  isLoadingApiKeySecret: boolean
  onApiKeyChange: (id: number) => void
  onAuthModeChange: (mode: PlaygroundAuthMode) => void
  selectedApiKeyId: number | null
}

export function PlaygroundAuthControl(props: PlaygroundAuthControlProps) {
  const { t } = useTranslation()
  const selectedApiKey = props.apiKeys.find(
    (apiKey) => apiKey.id === props.selectedApiKeyId
  )
  const apiKeyItems = props.apiKeys.map((apiKey) => ({
    label: apiKey.name,
    value: String(apiKey.id),
  }))
  const description =
    props.authMode === 'session'
      ? t('Use your login session to test without an API key.')
      : t('Requests use the selected API key and its access rules.')

  return (
    <Field
      aria-labelledby='playground-auth-title'
      className='border-border/70 bg-muted/25 flex-col items-stretch gap-2 rounded-lg border px-3 py-2 sm:flex-row sm:items-center'
      data-disabled={props.disabled || undefined}
      orientation='horizontal'
    >
      <div className='flex min-w-0 items-center gap-3'>
        <div className='hidden min-w-0 sm:block'>
          <FieldTitle id='playground-auth-title'>
            {t('Authentication')}
          </FieldTitle>
          <FieldDescription className='truncate text-xs'>
            {description}
          </FieldDescription>
        </div>

        <ToggleGroup
          aria-label={t('Authentication')}
          className='shrink-0'
          disabled={props.disabled}
          onValueChange={(values) => {
            const nextMode = values.find((value) => value !== props.authMode)
            if (nextMode === 'session' || nextMode === 'api-key') {
              props.onAuthModeChange(nextMode)
            }
          }}
          size='sm'
          spacing={1}
          value={[props.authMode]}
          variant='outline'
        >
          <ToggleGroupItem value='session'>
            <HugeiconsIcon
              aria-hidden='true'
              data-icon='inline-start'
              icon={LoginMethodIcon}
              strokeWidth={2}
            />
            {t('Session')}
          </ToggleGroupItem>
          <ToggleGroupItem value='api-key'>
            <HugeiconsIcon
              aria-hidden='true'
              data-icon='inline-start'
              icon={Key01Icon}
              strokeWidth={2}
            />
            {t('API Key')}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {props.authMode === 'api-key' ? (
        <div className='flex min-w-0 items-center gap-2 sm:ms-auto'>
          {props.isLoadingApiKeys ? (
            <span
              aria-live='polite'
              className='text-muted-foreground flex items-center gap-2 text-xs'
            >
              <Spinner aria-hidden='true' />
              {t('Loading API keys...')}
            </span>
          ) : null}
          {!props.isLoadingApiKeys && props.apiKeys.length > 0 ? (
            <>
              <Select
                disabled={props.disabled}
                items={apiKeyItems}
                onValueChange={(value) => {
                  if (value !== null) {
                    props.onApiKeyChange(Number(value))
                  }
                }}
                value={String(props.selectedApiKeyId ?? '')}
              >
                <SelectTrigger
                  aria-label={t('Select API Key')}
                  className='min-w-0 flex-1 sm:w-52'
                  size='sm'
                >
                  <SelectValue>
                    {selectedApiKey?.name || t('Select API Key')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectGroup>
                    {props.apiKeys.map((apiKey) => (
                      <SelectItem key={apiKey.id} value={String(apiKey.id)}>
                        <span className='max-w-48 truncate'>{apiKey.name}</span>
                        <span className='text-muted-foreground text-xs'>
                          {apiKey.group?.trim() || 'default'}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {props.isLoadingApiKeySecret ? (
                <Spinner aria-label={t('Preparing API key...')} />
              ) : null}
            </>
          ) : null}
          {!props.isLoadingApiKeys && props.apiKeys.length === 0 ? (
            <div className='flex min-w-0 items-center gap-2 text-xs'>
              <span className='text-muted-foreground truncate'>
                {t('No enabled API keys')}
              </span>
              <Button
                nativeButton={false}
                render={<Link to='/keys' />}
                size='sm'
                variant='outline'
              >
                {t('Create API Key')}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </Field>
  )
}
