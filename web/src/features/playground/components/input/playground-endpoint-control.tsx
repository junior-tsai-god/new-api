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
import { Route } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  getPlaygroundEndpoint,
  PLAYGROUND_ENDPOINTS,
  type PlaygroundEndpointId,
} from '../../lib'

type PlaygroundEndpointControlProps = {
  disabled?: boolean
  endpointId: PlaygroundEndpointId
  onEndpointChange: (endpointId: PlaygroundEndpointId) => void
}

export function PlaygroundEndpointControl(
  props: PlaygroundEndpointControlProps
) {
  const { t } = useTranslation()
  const endpoint = getPlaygroundEndpoint(props.endpointId)
  const items = PLAYGROUND_ENDPOINTS.map((option) => ({
    label: `${option.method} ${option.pathTemplate}`,
    value: option.id,
  }))

  return (
    <div
      aria-label={t('Endpoint')}
      className='border-border/70 bg-muted/25 flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2'
      data-slot='playground-endpoint-control'
      role='group'
    >
      <span className='text-muted-foreground flex shrink-0 items-center gap-1.5 text-xs font-medium'>
        <Route aria-hidden='true' className='size-3.5' />
        {t('Endpoint')}
      </span>

      <Select
        disabled={props.disabled}
        items={items}
        onValueChange={(value) => {
          if (value) {
            props.onEndpointChange(value as PlaygroundEndpointId)
          }
        }}
        value={props.endpointId}
      >
        <SelectTrigger
          aria-label={t('Endpoint')}
          className='ms-auto min-w-0 flex-1 sm:max-w-xl'
          size='sm'
        >
          <SelectValue>
            <span className='flex min-w-0 items-center gap-2'>
              <Badge className='px-1.5 font-mono' variant='outline'>
                {endpoint.method}
              </Badge>
              <span className='truncate font-medium'>
                {t(endpoint.labelKey)}
              </span>
              <code className='text-muted-foreground hidden truncate text-xs sm:block'>
                {endpoint.pathTemplate}
              </code>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent align='end' alignItemWithTrigger={false}>
          <SelectGroup>
            {PLAYGROUND_ENDPOINTS.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                <Badge className='px-1.5 font-mono' variant='outline'>
                  {option.method}
                </Badge>
                <span className='font-medium'>{t(option.labelKey)}</span>
                <code className='text-muted-foreground text-xs'>
                  {option.pathTemplate}
                </code>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
