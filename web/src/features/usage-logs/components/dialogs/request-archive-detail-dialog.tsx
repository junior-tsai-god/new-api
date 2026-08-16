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
import { Copy01Icon, CopyCheckIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { formatTimestampToDate } from '@/lib/format'

import {
  formatRequestArchiveBytes,
  formatRequestArchiveCredential,
  formatRequestArchiveDuration,
  getRequestArchiveStatusVariant,
} from '../../lib/request-archive'
import type { RequestArchiveDetail } from '../../types'
import { RequestArchiveBody } from './request-archive-body'

type BodySection = 'request' | 'response'

function ArchiveBodyPanel({
  section,
  title,
  body,
  encoding,
  contentType,
  size,
  truncated,
  copied,
  onCopy,
}: {
  section: BodySection
  title: string
  body: string
  encoding: string
  contentType: string
  size: number
  truncated: boolean
  copied: boolean
  onCopy: (section: BodySection, body: string) => void
}) {
  const { t } = useTranslation()

  return (
    <section className='min-w-0 space-y-2' aria-labelledby={`${section}-body`}>
      <div className='flex min-w-0 items-start justify-between gap-3'>
        <div className='min-w-0'>
          <div className='flex items-center gap-2'>
            <h3 id={`${section}-body`} className='font-medium'>
              {title}
            </h3>
            {truncated && (
              <StatusBadge
                label={t('Truncated')}
                variant='warning'
                copyable={false}
              />
            )}
          </div>
          <p className='text-muted-foreground truncate text-xs'>
            {contentType || t('Unknown content type')} · {encoding} ·{' '}
            {formatRequestArchiveBytes(size)}
          </p>
        </div>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={!body}
          onClick={() => onCopy(section, body)}
        >
          <HugeiconsIcon
            icon={copied ? CopyCheckIcon : Copy01Icon}
            data-icon='inline-start'
            strokeWidth={2}
          />
          {copied ? t('Copied') : t('Copy')}
        </Button>
      </div>
      <RequestArchiveBody body={body} emptyLabel={t('No captured body')} />
    </section>
  )
}

export function RequestArchiveDetailDialog({
  detail,
  onOpenChange,
}: {
  detail: RequestArchiveDetail | null
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const { copiedText, copyToClipboard } = useCopyToClipboard()
  const [copiedSection, setCopiedSection] = useState<BodySection | null>(null)

  useEffect(() => {
    if (copiedText === null) setCopiedSection(null)
  }, [copiedText])

  const handleCopy = async (section: BodySection, body: string) => {
    if (await copyToClipboard(body)) setCopiedSection(section)
  }

  const metadata = detail
    ? [
        [t('Time'), formatTimestampToDate(detail.created_at)],
        [t('Username'), detail.username || '-'],
        [t('Token'), formatRequestArchiveCredential(detail, t('Session'))],
        [t('Request ID'), detail.request_id || '-'],
        [t('Method'), detail.method || '-'],
        [t('Path'), detail.path || '-'],
        [t('Model Name'), detail.model_name || '-'],
        [t('Channel'), detail.channel_id ? `#${detail.channel_id}` : '-'],
        [t('Duration'), formatRequestArchiveDuration(detail.duration_ms)],
        [t('Stream'), detail.is_stream ? t('Yes') : t('No')],
      ]
    : []

  return (
    <Dialog open={detail != null} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden sm:max-w-5xl'>
        <DialogHeader className='min-w-0 pr-8'>
          <DialogTitle>{t('Request archive details')}</DialogTitle>
          <DialogDescription className='truncate font-mono'>
            {detail?.request_id || t('Archived request and response content')}
          </DialogDescription>
        </DialogHeader>

        {detail && (
          <div className='min-h-0 space-y-4 overflow-y-auto pr-1'>
            <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-5'>
              {metadata.map(([label, value]) => (
                <div
                  key={label}
                  className='bg-muted/30 min-w-0 rounded-lg p-2.5'
                >
                  <div className='text-muted-foreground text-[11px] font-medium tracking-wide uppercase'>
                    {label}
                  </div>
                  <div
                    className='mt-1 truncate font-mono text-xs'
                    title={value}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div className='flex flex-wrap items-center gap-2'>
              <StatusBadge
                label={String(detail.status_code)}
                variant={getRequestArchiveStatusVariant(detail.status_code)}
                copyable={false}
                showDot
              />
              <span className='text-muted-foreground text-xs'>
                {t('Request size')}:{' '}
                {formatRequestArchiveBytes(detail.request_size)}
                {' · '}
                {t('Response size')}:{' '}
                {formatRequestArchiveBytes(detail.response_size)}
              </span>
            </div>

            {detail.capture_error && (
              <div className='border-destructive/30 bg-destructive/5 text-destructive rounded-lg border px-3 py-2 text-sm'>
                <span className='font-medium'>{t('Capture error')}:</span>{' '}
                <span className='font-mono text-xs'>
                  {detail.capture_error}
                </span>
              </div>
            )}

            <div className='grid gap-4 lg:grid-cols-2'>
              <ArchiveBodyPanel
                section='request'
                title={t('Request body')}
                body={detail.request_body}
                encoding={detail.request_body_encoding}
                contentType={detail.request_content_type}
                size={detail.request_stored_size}
                truncated={detail.request_truncated}
                copied={copiedSection === 'request'}
                onCopy={handleCopy}
              />
              <ArchiveBodyPanel
                section='response'
                title={t('Response body')}
                body={detail.response_body}
                encoding={detail.response_body_encoding}
                contentType={detail.response_content_type}
                size={detail.response_stored_size}
                truncated={detail.response_truncated}
                copied={copiedSection === 'response'}
                onCopy={handleCopy}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
