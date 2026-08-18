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
import { z } from 'zod'

export const changePasswordFormSchema = z
  .object({
    originalPassword: z.string().min(1, 'Please enter your current password'),
    newPassword: z
      .string()
      .min(1, 'Please enter a new password')
      .min(8, 'Password must be at least 8 characters')
      .max(20, 'Password must be at most 20 characters long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .superRefine((values, context) => {
    if (values.originalPassword === values.newPassword) {
      context.addIssue({
        code: 'custom',
        path: ['newPassword'],
        message: 'New password must be different from current password',
      })
    }

    if (values.newPassword !== values.confirmPassword) {
      context.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Passwords do not match',
      })
    }
  })

export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>

export const CHANGE_PASSWORD_FORM_DEFAULT_VALUES: ChangePasswordFormValues = {
  originalPassword: '',
  newPassword: '',
  confirmPassword: '',
}
