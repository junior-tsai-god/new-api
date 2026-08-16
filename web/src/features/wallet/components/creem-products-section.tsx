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
import { useTranslation } from 'react-i18next'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DEFAULT_CURRENCY_CONFIG,
  useSystemConfigStore,
} from '@/stores/system-config-store'

import {
  formatCreemPrice,
  formatTopupCredit,
  getTopupCreditAmountUSD,
} from '../lib/format'
import type { CreemProduct } from '../types'

interface CreemProductsSectionProps {
  products: CreemProduct[]
  onProductSelect: (product: CreemProduct) => void
  loading?: boolean
}

export function CreemProductsSection({
  products,
  onProductSelect,
  loading,
}: CreemProductsSectionProps) {
  const { t } = useTranslation()
  const configuredQuotaPerUnit = useSystemConfigStore(
    (state) => state.config.currency.quotaPerUnit
  )
  const quotaPerUnit =
    Number.isFinite(configuredQuotaPerUnit) && configuredQuotaPerUnit > 0
      ? configuredQuotaPerUnit
      : DEFAULT_CURRENCY_CONFIG.quotaPerUnit

  if (loading) {
    return (
      <div className='grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 md:grid-cols-3'>
        {['creem-product-1', 'creem-product-2', 'creem-product-3'].map(
          (key) => (
            <Skeleton key={key} className='h-24 rounded-lg' />
          )
        )}
      </div>
    )
  }

  if (!Array.isArray(products) || products.length === 0) {
    return null
  }

  return (
    <div className='grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 md:grid-cols-3'>
      {products.map((product) => {
        const creditAmountUSD = getTopupCreditAmountUSD({
          amount: product.quota,
          money: product.price,
          paymentProvider: 'creem',
          paymentCurrency: product.currency,
          quotaPerUnit,
        })

        return (
          <Card
            key={product.productId}
            data-card-hover='false'
            className='cursor-pointer'
            onClick={() => onProductSelect(product)}
          >
            <CardContent className='p-3 text-center sm:p-4'>
              <div className='mb-2 text-lg font-medium'>{product.name}</div>
              <div className='text-muted-foreground mb-2 text-sm'>
                {t('Credit received')}:{' '}
                {creditAmountUSD === null
                  ? '—'
                  : formatTopupCredit(creditAmountUSD)}
              </div>
              <div className='text-primary text-lg font-semibold'>
                {formatCreemPrice(product.price, product.currency)}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
