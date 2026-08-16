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

import { PAYMENT_TYPES } from '../constants'
import { requestPaymentAmount } from './use-payment'

describe('payment amount routing', () => {
  test('uses the dedicated Waffo amount calculator', async () => {
    const calls: string[] = []
    const quote = await requestPaymentAmount(120, PAYMENT_TYPES.WAFFO, {
      regular: async () => {
        calls.push('regular')
        return { success: true, data: '1' }
      },
      stripe: async () => {
        calls.push('stripe')
        return { success: true, data: '2' }
      },
      paypal: async () => {
        calls.push('paypal')
        return { success: true, data: '3' }
      },
      waffo: async (request) => {
        calls.push(`waffo:${request.amount}`)
        return { success: true, data: '18.75', currency: 'cny' }
      },
      waffoPancake: async () => {
        calls.push('pancake')
        return { success: true, data: '4' }
      },
    })

    assert.deepEqual(quote, {
      topupAmount: 120,
      amount: 18.75,
      currency: 'CNY',
    })
    assert.deepEqual(calls, ['waffo:120'])
  })

  test('keeps the dedicated PayPal amount calculator', async () => {
    const calls: string[] = []
    const quote = await requestPaymentAmount(80, PAYMENT_TYPES.PAYPAL, {
      regular: async () => ({ success: true, data: '1' }),
      stripe: async () => ({ success: true, data: '2' }),
      paypal: async (request) => {
        calls.push(`paypal:${request.amount}`)
        return { success: true, data: '12.5', currency: 'USD' }
      },
      waffo: async () => ({ success: true, data: '3' }),
      waffoPancake: async () => ({ success: true, data: '4' }),
    })

    assert.deepEqual(quote, {
      topupAmount: 80,
      amount: 12.5,
      currency: 'USD',
    })
    assert.deepEqual(calls, ['paypal:80'])
  })

  test('rejects an invalid amount without guessing a currency', async () => {
    const quote = await requestPaymentAmount(10, PAYMENT_TYPES.PAYPAL, {
      regular: async () => ({ success: true, data: '1' }),
      stripe: async () => ({ success: true, data: '2' }),
      paypal: async () => ({
        success: true,
        data: 'not-a-number',
        currency: 'USD',
      }),
      waffo: async () => ({ success: true, data: '3' }),
      waffoPancake: async () => ({ success: true, data: '4' }),
    })

    assert.equal(quote, null)
  })
})
