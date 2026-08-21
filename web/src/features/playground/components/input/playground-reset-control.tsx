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
import { MessageAdd01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'

type PlaygroundResetControlProps = {
  disabled?: boolean
  onReset: () => void
}

export function PlaygroundResetControl(props: PlaygroundResetControlProps) {
  const { t } = useTranslation()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleConfirm = () => {
    props.onReset()
    setConfirmOpen(false)
    toast.success(t('New conversation started'))
  }

  return (
    <>
      <Button
        aria-label={t('New conversation')}
        className='w-full shrink-0 sm:w-auto'
        data-slot='playground-reset-control'
        disabled={props.disabled}
        onClick={() => setConfirmOpen(true)}
        size='sm'
        type='button'
        variant='outline'
      >
        <HugeiconsIcon data-icon='inline-start' icon={MessageAdd01Icon} />
        {t('New conversation')}
      </Button>

      <ConfirmDialog
        desc={t(
          'Messages and the usage totals shown here will be cleared. Charges already applied to your account will not be reversed.'
        )}
        confirmText={t('Start new conversation')}
        handleConfirm={handleConfirm}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('Start a new conversation?')}
      />
    </>
  )
}
