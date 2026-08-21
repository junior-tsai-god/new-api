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
import { RotateCcw, Send } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { JsonCodeEditor } from '@/components/json-code-editor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'

import {
  sendPlaygroundEndpointRequest,
  type PlaygroundEndpointResult,
} from '../../api'
import {
  createDefaultEndpointBody,
  getPlaygroundEndpoint,
  validateEndpointBody,
  type PlaygroundEndpointBodyErrorCode,
  type PlaygroundEndpointId,
  type PlaygroundJsonObject,
} from '../../lib'
import type { PlaygroundRequestAuth } from '../../types'
import { PlaygroundEndpointResponse } from './playground-endpoint-response'

type PlaygroundEndpointDebuggerProps = {
  disabled?: boolean
  endpointId: PlaygroundEndpointId
  model: string
  onRequestComplete?: (requestId: string) => void
  requestAuth: PlaygroundRequestAuth
}

const BODY_ERROR_MESSAGE_KEYS: Record<PlaygroundEndpointBodyErrorCode, string> =
  {
    body_must_be_object: 'Request body must be a JSON object.',
    body_not_supported: 'This endpoint does not accept a request body.',
    body_required: 'Request body is required.',
    invalid_json: 'JSON is invalid. Please check the syntax.',
  }

function applySelectedModel(
  endpointId: PlaygroundEndpointId,
  body: PlaygroundJsonObject,
  model: string
): PlaygroundJsonObject {
  if (endpointId === 'gemini-generate-content') {
    return body
  }

  return { ...body, model }
}

function createFormFields(body: PlaygroundJsonObject): Record<string, string> {
  return Object.fromEntries(
    Object.entries(body).map(([key, value]) => [
      key,
      typeof value === 'string' ? value : JSON.stringify(value),
    ])
  )
}

export function PlaygroundEndpointDebugger(
  props: PlaygroundEndpointDebuggerProps
) {
  const { t } = useTranslation()
  const editorId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const endpoint = getPlaygroundEndpoint(props.endpointId)
  const defaultBody = createDefaultEndpointBody(props.endpointId, props.model)
  const [requestBody, setRequestBody] = useState(defaultBody)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<PlaygroundEndpointResult | null>(null)
  const [error, setError] = useState('')
  const [isSending, setIsSending] = useState(false)
  const bodyValidation = useMemo(
    () => validateEndpointBody(props.endpointId, requestBody),
    [props.endpointId, requestBody]
  )

  useEffect(
    () => () => {
      abortControllerRef.current?.abort()
      abortControllerRef.current = null
    },
    []
  )

  const handleReset = () => {
    setRequestBody(defaultBody)
    setSelectedFile(null)
    setResult(null)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSend = async () => {
    if (!bodyValidation.valid) return

    const abortController = new AbortController()
    abortControllerRef.current?.abort()
    abortControllerRef.current = abortController
    setIsSending(true)
    setResult(null)
    setError('')

    try {
      const parsedBody = bodyValidation.body
      const normalizedBody =
        parsedBody && endpoint.requiresModel
          ? applySelectedModel(props.endpointId, parsedBody, props.model)
          : parsedBody
      const response = await sendPlaygroundEndpointRequest(
        {
          auth: props.requestAuth,
          body:
            endpoint.bodyMode === 'json' && normalizedBody
              ? JSON.stringify(normalizedBody)
              : undefined,
          file:
            endpoint.bodyMode === 'multipart'
              ? (selectedFile ?? undefined)
              : undefined,
          formFields:
            endpoint.bodyMode === 'multipart' && normalizedBody
              ? createFormFields(normalizedBody)
              : undefined,
          endpointId: props.endpointId,
          model: props.model,
          signal: abortController.signal,
        },
        endpoint.requiresModel ? props.onRequestComplete : undefined
      )
      if (!abortController.signal.aborted) {
        setResult(response)
      }
    } catch (requestError) {
      if (abortController.signal.aborted) return
      const message =
        requestError instanceof Error
          ? requestError.message
          : t('Request failed')
      const localizedMessage = t(message)
      setError(localizedMessage)
      toast.error(localizedMessage)
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null
        setIsSending(false)
      }
    }
  }

  const requiresFile = endpoint.bodyMode === 'multipart'
  const canSend =
    !props.disabled &&
    !isSending &&
    Boolean(props.requestAuth.apiKey) &&
    (!endpoint.requiresModel || Boolean(props.model)) &&
    bodyValidation.valid &&
    (!requiresFile || Boolean(selectedFile))
  const path = endpoint.pathTemplate.includes('{model}')
    ? endpoint.pathTemplate.replace('{model}', props.model || '{model}')
    : endpoint.pathTemplate

  return (
    <div className='min-h-0 flex-1 overflow-y-auto px-1 py-3 md:py-5'>
      <div className='mx-auto grid w-full max-w-4xl gap-4'>
        <section
          aria-label={t('Request')}
          className='border-border/70 bg-background overflow-hidden rounded-xl border'
        >
          <header className='border-border/60 bg-muted/20 flex min-h-11 items-center gap-2 border-b px-4 py-2'>
            <Badge className='font-mono' variant='outline'>
              {endpoint.method}
            </Badge>
            <code className='min-w-0 truncate text-xs font-medium'>{path}</code>
            <Button
              className='ms-auto'
              disabled={isSending}
              onClick={handleReset}
              size='sm'
              type='button'
              variant='ghost'
            >
              <RotateCcw aria-hidden='true' />
              {t('Reset')}
            </Button>
          </header>

          <div className='grid gap-3 p-4'>
            {endpoint.bodyMode !== 'none' ? (
              <>
                <Label htmlFor={editorId}>{t('Request body')}</Label>
                <JsonCodeEditor
                  aria-describedby={
                    bodyValidation.valid ? undefined : `${editorId}-error`
                  }
                  aria-invalid={!bodyValidation.valid}
                  disabled={isSending}
                  heightClassName='h-64 min-h-64 max-h-[40vh]'
                  id={editorId}
                  onChange={setRequestBody}
                  value={requestBody}
                />
                {!bodyValidation.valid ? (
                  <p
                    className='text-destructive text-xs'
                    id={`${editorId}-error`}
                    role='alert'
                  >
                    {t(BODY_ERROR_MESSAGE_KEYS[bodyValidation.code])}
                  </p>
                ) : null}
              </>
            ) : null}

            {requiresFile ? (
              <div className='grid gap-2'>
                <Label htmlFor={`${editorId}-file`}>{t('File')}</Label>
                <Input
                  accept='audio/*'
                  disabled={isSending}
                  id={`${editorId}-file`}
                  onChange={(event) =>
                    setSelectedFile(event.target.files?.[0] ?? null)
                  }
                  ref={fileInputRef}
                  type='file'
                />
              </div>
            ) : null}

            <div className='flex justify-end'>
              <Button disabled={!canSend} onClick={handleSend} type='button'>
                {isSending ? (
                  <Spinner aria-hidden='true' />
                ) : (
                  <Send aria-hidden='true' />
                )}
                {t('Send')}
              </Button>
            </div>
          </div>
        </section>

        <PlaygroundEndpointResponse error={error} result={result} />
      </div>
    </div>
  )
}
