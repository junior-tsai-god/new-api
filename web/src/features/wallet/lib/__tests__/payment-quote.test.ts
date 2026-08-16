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
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  calculatePresetPaymentAmount,
  formatPaymentAmount,
  formatTopupCredit,
  getBillingPaymentPresentation,
  getDiscountLabel,
  getHistoricalPaymentCurrency,
  getTopupCreditAmountUSD,
} from '../format'

describe('payment quote formatting', () => {
  test('shows credited USD and charged CNY with exactly two decimals', () => {
    assert.equal(formatTopupCredit(10), '$10.00')
    assert.equal(formatPaymentAmount(73, 'CNY'), '¥73.00')
  })

  test('keeps PayPal charges in USD instead of applying the site exchange rate', () => {
    assert.equal(formatPaymentAmount(10, 'USD'), '$10.00')
  })

  test('does not guess a symbol for an unknown payment currency', () => {
    assert.equal(formatPaymentAmount(10, undefined), '10.00')
  })

  test('converts Creem quota units to the credited USD amount', () => {
    assert.equal(
      getTopupCreditAmountUSD({
        amount: 5_000_000,
        money: 10,
        paymentProvider: 'creem',
        quotaPerUnit: 500_000,
      }),
      10
    )
    assert.equal(
      getTopupCreditAmountUSD({
        amount: 10,
        money: 10,
        paymentProvider: 'paypal',
        quotaPerUnit: 500_000,
      }),
      10
    )
  })

  test('uses the stored credit snapshot and does not reprice legacy Creem history', () => {
    assert.equal(
      getTopupCreditAmountUSD({
        amount: 5_000_000,
        creditAmount: 10,
        money: 9,
        paymentProvider: 'creem',
        quotaPerUnit: 1_000_000,
        inferLegacyCreem: false,
      }),
      10
    )
    assert.equal(
      getTopupCreditAmountUSD({
        amount: 5_000_000,
        money: 9,
        paymentProvider: 'creem',
        quotaPerUnit: 1_000_000,
        inferLegacyCreem: false,
      }),
      null
    )
  })

  test('keeps legacy Stripe credit semantics without inventing paid currency', () => {
    assert.equal(
      getTopupCreditAmountUSD({
        amount: 10,
        money: 12,
        paymentProvider: 'stripe',
        quotaPerUnit: 500_000,
      }),
      12
    )
    assert.equal(
      getTopupCreditAmountUSD({
        amount: 10,
        money: 80,
        paymentProvider: 'stripe',
        paymentCurrency: 'CNY',
        quotaPerUnit: 500_000,
      }),
      10
    )
    assert.equal(
      getTopupCreditAmountUSD({
        amount: 0,
        money: 9.99,
        paymentProvider: 'paypal',
        quotaPerUnit: 500_000,
      }),
      null
    )
  })

  test('only infers currencies that are fixed by the payment provider', () => {
    assert.equal(getHistoricalPaymentCurrency('paypal'), 'USD')
    assert.equal(getHistoricalPaymentCurrency('epay'), 'CNY')
    assert.equal(getHistoricalPaymentCurrency('waffo_pancake'), 'USD')
    assert.equal(getHistoricalPaymentCurrency('stripe'), undefined)
  })

  test('does not describe unpaid or expired orders as money actually paid', () => {
    assert.deepEqual(getBillingPaymentPresentation('success'), {
      label: 'Actual Amount',
      showAmount: true,
    })
    assert.deepEqual(getBillingPaymentPresentation('pending'), {
      label: 'Order Amount',
      showAmount: true,
    })
    assert.deepEqual(getBillingPaymentPresentation('failed'), {
      label: 'Payment Amount',
      showAmount: false,
    })
    assert.deepEqual(getBillingPaymentPresentation('expired'), {
      label: 'Payment Amount',
      showAmount: false,
    })
  })

  test('uses a language-neutral discount badge', () => {
    assert.equal(getDiscountLabel(0.8), '-20%')
  })
})

describe('preset payment quotes', () => {
  test('derives each preset from the selected gateway quote and discount', () => {
    assert.equal(
      calculatePresetPaymentAmount({
        presetAmount: 20,
        presetDiscount: 0.9,
        quotedTopupAmount: 10,
        quotedPaymentAmount: 73,
        quotedDiscount: 1,
      }),
      131.4
    )
  })

  test('returns null until a valid gateway quote is available', () => {
    assert.equal(
      calculatePresetPaymentAmount({
        presetAmount: 10,
        presetDiscount: 1,
        quotedTopupAmount: 0,
        quotedPaymentAmount: 0,
        quotedDiscount: 1,
      }),
      null
    )
  })
})
