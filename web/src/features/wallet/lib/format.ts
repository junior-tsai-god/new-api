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
import { DEFAULT_DISCOUNT_RATE } from '../constants'
import type { TopupStatus } from '../types'

// ============================================================================
// Wallet-specific Formatting Functions
// ============================================================================

/**
 * Format Creem price with currency symbol (USD/EUR)
 */
export function formatCreemPrice(
  price: number,
  currency: 'USD' | 'EUR'
): string {
  const symbol = currency === 'EUR' ? '€' : '$'
  return `${symbol}${price.toFixed(2)}`
}

/**
 * Format large quota numbers with K/M suffix
 */
export function formatQuotaShort(quota: number): string {
  if (quota >= 1000000) {
    return `${(quota / 1000000).toFixed(1)}M`
  }
  if (quota >= 1000) {
    return `${(quota / 1000).toFixed(1)}K`
  }
  return quota.toString()
}

/**
 * Format currency amount that is already in local currency.
 * This is used for payment amounts that have been calculated via priceRatio.
 */
export function formatCurrency(amount: number | string): string {
  const numeric =
    typeof amount === 'number' ? amount : Number.parseFloat(String(amount))
  if (!Number.isFinite(numeric)) return '-'

  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.abs(numeric) >= 1 ? 2 : 4,
  }).format(numeric)
}

function formatFixedAmount(
  amount: number,
  locale?: Intl.LocalesArgument
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/** Format the USD credit added to the account. */
export function formatTopupCredit(
  amountUSD: number,
  locale?: Intl.LocalesArgument
): string {
  if (!Number.isFinite(amountUSD)) return '-'
  return `$${formatFixedAmount(amountUSD, locale)}`
}

/** Format the real amount charged by the selected payment gateway. */
export function formatPaymentAmount(
  amount: number,
  currency?: string,
  locale?: Intl.LocalesArgument
): string {
  if (!Number.isFinite(amount)) return '-'

  const normalizedCurrency = currency?.trim().toUpperCase()
  const formatted = formatFixedAmount(amount, locale)
  if (normalizedCurrency === 'USD') return `$${formatted}`
  if (normalizedCurrency === 'CNY') return `¥${formatted}`
  if (normalizedCurrency === 'EUR') return `€${formatted}`
  if (!normalizedCurrency) return formatted

  return `${formatted} ${normalizedCurrency}`
}

type StoredTopupCreditInput = {
  amount: number
  creditAmount?: number
  money: number
  paymentProvider?: string
  paymentCurrency?: string
  quotaPerUnit?: number
  inferLegacyCreem?: boolean
}

/** Normalize legacy and current topup records to the USD credit users received. */
export function getTopupCreditAmountUSD(
  input: StoredTopupCreditInput
): number | null {
  if (
    input.creditAmount !== undefined &&
    Number.isFinite(input.creditAmount) &&
    input.creditAmount > 0
  ) {
    return input.creditAmount
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) return null

  const paymentProvider = input.paymentProvider?.trim().toLowerCase()
  if (paymentProvider === 'stripe' && !input.paymentCurrency?.trim()) {
    return Number.isFinite(input.money) && input.money > 0 ? input.money : null
  }
  if (paymentProvider !== 'creem') return input.amount
  if (input.inferLegacyCreem === false) return null

  const normalizedQuotaPerUnit = input.quotaPerUnit ?? 0
  if (!Number.isFinite(normalizedQuotaPerUnit) || normalizedQuotaPerUnit <= 0) {
    return null
  }

  return input.amount / normalizedQuotaPerUnit
}

/** Infer only currencies that have always been fixed by their provider. */
export function getHistoricalPaymentCurrency(
  paymentProvider?: string
): string | undefined {
  switch (paymentProvider?.trim().toLowerCase()) {
    case 'paypal':
    case 'waffo_pancake':
      return 'USD'
    case 'epay':
      return 'CNY'
    default:
      return undefined
  }
}

export function getBillingPaymentPresentation(status: TopupStatus): {
  label: 'Actual Amount' | 'Order Amount' | 'Payment Amount'
  showAmount: boolean
} {
  if (status === 'success') {
    return { label: 'Actual Amount', showAmount: true }
  }
  if (status === 'pending') {
    return { label: 'Order Amount', showAmount: true }
  }
  return { label: 'Payment Amount', showAmount: false }
}

type PresetPaymentAmountInput = {
  presetAmount: number
  presetDiscount: number
  quotedTopupAmount: number
  quotedPaymentAmount: number
  quotedDiscount: number
}

/**
 * Derive preset prices from a real quote for the currently selected gateway.
 * The gateway's group multiplier is preserved while each preset's own
 * discount is applied.
 */
export function calculatePresetPaymentAmount(
  input: PresetPaymentAmountInput
): number | null {
  if (
    !Number.isFinite(input.presetAmount) ||
    !Number.isFinite(input.presetDiscount) ||
    !Number.isFinite(input.quotedTopupAmount) ||
    !Number.isFinite(input.quotedPaymentAmount) ||
    !Number.isFinite(input.quotedDiscount) ||
    input.presetAmount <= 0 ||
    input.presetDiscount <= 0 ||
    input.quotedTopupAmount <= 0 ||
    input.quotedPaymentAmount <= 0 ||
    input.quotedDiscount <= 0
  ) {
    return null
  }

  const gatewayUnitPrice =
    input.quotedPaymentAmount / input.quotedTopupAmount / input.quotedDiscount
  return input.presetAmount * gatewayUnitPrice * input.presetDiscount
}

/** Get a compact, language-neutral discount label. */
export function getDiscountLabel(discount: number): string {
  if (discount >= DEFAULT_DISCOUNT_RATE) {
    return ''
  }
  const off = Math.round((1 - discount) * 100)
  return `-${off}%`
}

/**
 * Calculate pricing details for a preset amount
 */
export function calculatePresetPricing(
  presetValue: number,
  priceRatio: number,
  discount: number,
  usdExchangeRate: number = 1
) {
  const originalPrice = presetValue * priceRatio
  const actualPrice = originalPrice * discount
  const savedAmount = originalPrice - actualPrice
  const hasDiscount = discount < 1.0
  const displayValue = presetValue * usdExchangeRate

  return {
    displayValue,
    originalPrice,
    actualPrice,
    savedAmount,
    hasDiscount,
  }
}
