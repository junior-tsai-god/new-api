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
import { ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

import {
  SettingsSwitchContent,
  SettingsSwitchItem,
} from '../components/settings-form-layout'

export type PayPalSettingsValues = {
  PayPalClientID: string
  PayPalClientSecret: string
  PayPalWebhookID: string
  PayPalSandbox: boolean
  PayPalUnitPrice: number
  PayPalMinTopUp: number
}

type PayPalSettingsSectionProps = {
  values: PayPalSettingsValues
  onValueChange: <K extends keyof PayPalSettingsValues>(
    key: K,
    value: PayPalSettingsValues[K]
  ) => void
}

export function PayPalSettingsSection({
  values,
  onValueChange,
}: PayPalSettingsSectionProps) {
  const { t } = useTranslation()

  return (
    <div className='space-y-5'>
      <div>
        <h3 className='text-lg font-medium'>{t('PayPal Gateway')}</h3>
        <p className='text-muted-foreground text-sm'>
          {t('Configuration for PayPal Orders API integration')}
        </p>
      </div>

      <Alert>
        <ShieldCheck className='h-4 w-4' />
        <AlertTitle>{t('PayPal webhook configuration')}</AlertTitle>
        <AlertDescription>
          <div className='space-y-2'>
            <p>
              {t(
                'Create the webhook under the same PayPal app as these credentials, then paste its Webhook ID below.'
              )}
            </p>
            <ul className='list-inside list-disc space-y-1'>
              <li>
                {t('Webhook URL:')}{' '}
                <code className='bg-muted rounded px-1 py-0.5 text-xs'>
                  {'<ServerAddress>/api/paypal/webhook'}
                </code>
              </li>
              <li>
                {t('Required events:')}{' '}
                <code className='bg-muted rounded px-1 py-0.5 text-xs'>
                  CHECKOUT.ORDER.APPROVED
                </code>{' '}
                {t('and')}{' '}
                <code className='bg-muted rounded px-1 py-0.5 text-xs'>
                  PAYMENT.CAPTURE.COMPLETED
                </code>
              </li>
            </ul>
            <a
              href='https://developer.paypal.com/dashboard/applications/'
              target='_blank'
              rel='noreferrer'
              className='inline-flex underline underline-offset-4 hover:no-underline'
            >
              {t('Open PayPal Developer Dashboard')}
            </a>
          </div>
        </AlertDescription>
      </Alert>

      <SettingsSwitchItem>
        <SettingsSwitchContent>
          <Label htmlFor='paypal-sandbox'>{t('Sandbox mode')}</Label>
          <p className='text-muted-foreground text-sm'>
            {t('Use PayPal Sandbox API endpoints for test payments')}
          </p>
        </SettingsSwitchContent>
        <Switch
          id='paypal-sandbox'
          checked={values.PayPalSandbox}
          onCheckedChange={(checked) => onValueChange('PayPalSandbox', checked)}
        />
      </SettingsSwitchItem>

      <div className='grid gap-6 md:grid-cols-3'>
        <div className='space-y-2'>
          <Label htmlFor='paypal-client-id'>{t('Client ID')}</Label>
          <Input
            id='paypal-client-id'
            value={values.PayPalClientID}
            autoComplete='off'
            placeholder='AXxx...'
            onChange={(event) =>
              onValueChange('PayPalClientID', event.target.value)
            }
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='paypal-client-secret'>{t('Client secret')}</Label>
          <Input
            id='paypal-client-secret'
            type='password'
            value={values.PayPalClientSecret}
            autoComplete='new-password'
            placeholder={t('Enter new secret to update')}
            onChange={(event) =>
              onValueChange('PayPalClientSecret', event.target.value)
            }
          />
          <p className='text-muted-foreground text-sm'>
            {t('Leave blank unless rotating the secret')}
          </p>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='paypal-webhook-id'>{t('Webhook ID')}</Label>
          <Input
            id='paypal-webhook-id'
            value={values.PayPalWebhookID}
            autoComplete='off'
            placeholder='WH-...'
            onChange={(event) =>
              onValueChange('PayPalWebhookID', event.target.value)
            }
          />
        </div>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='paypal-unit-price'>
            {t('Unit price (USD / balance unit)')}
          </Label>
          <Input
            id='paypal-unit-price'
            type='number'
            step='0.01'
            min={0}
            value={values.PayPalUnitPrice}
            onChange={(event) =>
              onValueChange('PayPalUnitPrice', Number(event.target.value))
            }
          />
          <p className='text-muted-foreground text-sm'>
            {t(
              'A value of 1 means a $10 top-up charges $10 before group ratio and discount.'
            )}
          </p>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='paypal-min-topup'>{t('Minimum top-up (USD)')}</Label>
          <Input
            id='paypal-min-topup'
            type='number'
            step='1'
            min={1}
            value={values.PayPalMinTopUp}
            onChange={(event) =>
              onValueChange('PayPalMinTopUp', Number(event.target.value))
            }
          />
        </div>
      </div>

      <p className='text-muted-foreground text-sm'>
        {t(
          'PayPal is enabled only after Client ID, Client secret, Webhook ID, and compliance confirmation are all present.'
        )}
      </p>
    </div>
  )
}
