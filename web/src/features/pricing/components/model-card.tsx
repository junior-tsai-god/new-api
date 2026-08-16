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
import { ChevronRight } from 'lucide-react'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import type { ModelStatusItem } from '@/features/model-status/types'
import { getLobeIcon } from '@/lib/lobe-icon'

import { DEFAULT_TOKEN_UNIT } from '../constants'
import {
  getDynamicDisplayGroupRatio,
  getDynamicPricingSummary,
} from '../lib/dynamic-price'
import { isTokenBasedModel } from '../lib/model-helpers'
import { formatPrice, formatRequestPrice } from '../lib/price'
import type { PricingModel, TokenUnit } from '../types'
import { ModelStatusSummary } from './model-status-summary'

export interface ModelCardProps {
  model: PricingModel
  onClick: () => void
  onTry?: () => void
  priceRate?: number
  usdExchangeRate?: number
  tokenUnit?: TokenUnit
  showRechargePrice?: boolean
  selectedGroup?: string
  status?: ModelStatusItem
  statusLoading?: boolean
}

export const ModelCard = memo(function ModelCard(props: ModelCardProps) {
  const { t } = useTranslation()
  const tokenUnit = props.tokenUnit ?? DEFAULT_TOKEN_UNIT
  const priceRate = props.priceRate ?? 1
  const usdExchangeRate = props.usdExchangeRate ?? 1
  const showRechargePrice = props.showRechargePrice ?? false
  const isTokenBased = isTokenBasedModel(props.model)
  const tokenUnitLabel = tokenUnit === 'K' ? '1K' : '1M'
  const modelIconKey = props.model.icon || props.model.vendor_icon
  const modelIcon = modelIconKey ? getLobeIcon(modelIconKey, 28) : null
  const initial = props.model.model_name?.charAt(0).toUpperCase() || '?'
  const isDynamicPricing =
    props.model.billing_mode === 'tiered_expr' &&
    Boolean(props.model.billing_expr)
  const dynamicSummary = isDynamicPricing
    ? getDynamicPricingSummary(props.model, {
        tokenUnit,
        showRechargePrice,
        priceRate,
        usdExchangeRate,
        groupRatioMultiplier: getDynamicDisplayGroupRatio(
          props.model,
          props.selectedGroup
        ),
      })
    : null

  let pricingContent: React.ReactNode
  if (dynamicSummary) {
    if (dynamicSummary.isSpecialExpression) {
      pricingContent = (
        <span className='text-muted-foreground'>{t('Dynamic Pricing')}</span>
      )
    } else if (dynamicSummary.primaryEntries.length > 0) {
      pricingContent = (
        <>
          {dynamicSummary.primaryEntries.slice(0, 2).map((entry) => (
            <span
              key={entry.key}
              className='text-muted-foreground whitespace-nowrap'
            >
              {t(entry.shortLabel)}{' '}
              <span className='text-foreground font-mono font-semibold'>
                {entry.formatted}
              </span>
              /{tokenUnitLabel}
            </span>
          ))}
        </>
      )
    } else {
      pricingContent = (
        <span className='text-muted-foreground text-xs'>
          {t('Dynamic Pricing')}
        </span>
      )
    }
  } else if (isTokenBased) {
    pricingContent = (
      <>
        <span className='text-muted-foreground whitespace-nowrap'>
          {t('Input')}{' '}
          <span className='text-foreground font-mono font-semibold'>
            {formatPrice(
              props.model,
              'input',
              tokenUnit,
              showRechargePrice,
              priceRate,
              usdExchangeRate,
              props.selectedGroup
            )}
          </span>
          /{tokenUnitLabel}
        </span>
        <span className='text-muted-foreground whitespace-nowrap'>
          {t('Output')}{' '}
          <span className='text-foreground font-mono font-semibold'>
            {formatPrice(
              props.model,
              'output',
              tokenUnit,
              showRechargePrice,
              priceRate,
              usdExchangeRate,
              props.selectedGroup
            )}
          </span>
          /{tokenUnitLabel}
        </span>
      </>
    )
  } else {
    pricingContent = (
      <span className='text-muted-foreground whitespace-nowrap'>
        <span className='text-foreground font-mono font-semibold'>
          {formatRequestPrice(
            props.model,
            showRechargePrice,
            priceRate,
            usdExchangeRate,
            props.selectedGroup
          )}
        </span>{' '}
        / {t('request')}
      </span>
    )
  }

  return (
    <article className='aivanta-panel group hover:bg-muted/20 flex min-w-0 flex-col overflow-hidden p-4 transition-colors sm:p-5'>
      <header className='flex min-w-0 items-start gap-3'>
        <div className='bg-muted/40 flex size-10 shrink-0 items-center justify-center rounded-xl'>
          {modelIcon || (
            <span className='text-muted-foreground text-sm font-bold'>
              {initial}
            </span>
          )}
        </div>
        <div className='min-w-0 flex-1'>
          <h3 className='text-foreground truncate font-mono text-[15px] leading-tight font-bold'>
            {props.model.model_name}
          </h3>
          <div className='mt-1 flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1 text-xs'>
            {pricingContent}
          </div>
        </div>
      </header>

      <ModelStatusSummary status={props.status} loading={props.statusLoading} />

      <footer className='mt-3 flex items-center justify-end gap-1'>
        {props.onTry ? (
          <Button
            type='button'
            variant='outline'
            size='xs'
            onClick={props.onTry}
          >
            {t('Try in Playground')}
          </Button>
        ) : null}
        <Button type='button' variant='ghost' size='xs' onClick={props.onClick}>
          {t('Details')}
          <ChevronRight data-icon='inline-end' />
        </Button>
      </footer>
    </article>
  )
})
