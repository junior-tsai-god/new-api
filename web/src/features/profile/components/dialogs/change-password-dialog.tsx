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
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Dialog } from '@/components/dialog'
import { PasswordInput } from '@/components/password-input'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import { updateUserProfile } from '../../api'
import {
  CHANGE_PASSWORD_FORM_DEFAULT_VALUES,
  changePasswordFormSchema,
  type ChangePasswordFormValues,
} from '../../lib/change-password-form'

// ============================================================================
// Change Password Dialog Component
// ============================================================================

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  username: string
}

export function ChangePasswordDialog(props: ChangePasswordDialogProps) {
  const { t } = useTranslation()
  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: CHANGE_PASSWORD_FORM_DEFAULT_VALUES,
  })
  const loading = form.formState.isSubmitting

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && loading) return
    if (!nextOpen) form.reset()
    props.onOpenChange(nextOpen)
  }

  const handleSubmit = async (values: ChangePasswordFormValues) => {
    try {
      const response = await updateUserProfile({
        original_password: values.originalPassword,
        password: values.newPassword,
      })

      if (response.success) {
        toast.success(t('Password changed successfully'))
        form.reset()
        props.onOpenChange(false)
      } else {
        form.setError('root', {
          type: 'server',
          message: response.message || 'Failed to change password',
        })
      }
    } catch {
      // Transport errors are displayed by the shared API error handler.
    }
  }

  const formId = 'change-password-form'
  const rootErrorMessage = form.formState.errors.root?.message

  return (
    <Dialog
      open={props.open}
      onOpenChange={handleOpenChange}
      title={t('Change Password')}
      description={
        <>
          {t('Update your password for account:')}{' '}
          <strong>{props.username}</strong>
        </>
      }
      contentClassName='sm:max-w-md'
      contentHeight='auto'
      bodyClassName='space-y-4'
      footer={
        <>
          <Button
            type='button'
            variant='outline'
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            {t('Cancel')}
          </Button>
          <Button type='submit' form={formId} disabled={loading}>
            {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {loading ? t('Changing...') : t('Change Password')}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id={formId}
          onSubmit={form.handleSubmit(handleSubmit)}
          className='space-y-4'
        >
          <FormField
            control={form.control}
            name='originalPassword'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Current Password')}</FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete='current-password'
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='newPassword'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('New Password')}</FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete='new-password'
                    disabled={loading}
                    maxLength={20}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t('Password must be between 8 and 20 characters')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='confirmPassword'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Confirm New Password')}</FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete='new-password'
                    disabled={loading}
                    maxLength={20}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {rootErrorMessage ? (
            <FieldError>{t(rootErrorMessage)}</FieldError>
          ) : null}
        </form>
      </Form>
    </Dialog>
  )
}
