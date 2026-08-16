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
import i18next from 'i18next'
import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'

import {
  calculateAmount,
  calculatePayPalAmount,
  calculateStripeAmount,
  calculateWaffoAmount,
  calculateWaffoPancakeAmount,
  requestPayment,
  requestPayPalPayment,
  requestStripePayment,
  capturePayPalOrder,
  isApiSuccess,
} from '../api'
import {
  isStripePayment,
  isPayPalPayment,
  isWaffoPayment,
  isWaffoPancakePayment,
  submitPaymentForm,
} from '../lib'
import type {
  AmountRequest,
  AmountResponse,
  PaymentQuote,
  PaymentResponse,
  PayPalPaymentResponse,
  StripePaymentResponse,
} from '../types'

// ============================================================================
// Payment Hook
// ============================================================================

type AmountCalculator = (request: AmountRequest) => Promise<AmountResponse>

export interface PaymentAmountCalculators {
  regular: AmountCalculator
  stripe: AmountCalculator
  paypal: AmountCalculator
  waffo: AmountCalculator
  waffoPancake: AmountCalculator
}

const defaultPaymentAmountCalculators: PaymentAmountCalculators = {
  regular: calculateAmount,
  stripe: calculateStripeAmount,
  paypal: calculatePayPalAmount,
  waffo: calculateWaffoAmount,
  waffoPancake: calculateWaffoPancakeAmount,
}

export async function requestPaymentAmount(
  topupAmount: number,
  paymentType: string,
  calculators: PaymentAmountCalculators = defaultPaymentAmountCalculators
): Promise<PaymentQuote | null> {
  let calculator = calculators.regular
  if (isStripePayment(paymentType)) {
    calculator = calculators.stripe
  } else if (isPayPalPayment(paymentType)) {
    calculator = calculators.paypal
  } else if (isWaffoPayment(paymentType)) {
    calculator = calculators.waffo
  } else if (isWaffoPancakePayment(paymentType)) {
    calculator = calculators.waffoPancake
  }

  const response = await calculator({ amount: topupAmount })
  if (!isApiSuccess(response) || !response.data) {
    return null
  }

  const amount = Number.parseFloat(response.data)
  if (!Number.isFinite(amount) || amount <= 0) {
    return null
  }

  const currency = response.currency?.trim().toUpperCase() || undefined
  return { topupAmount, amount, currency }
}

export function usePayment() {
  const [quote, setQuote] = useState<PaymentQuote | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [processing, setProcessing] = useState(false)
  const latestQuoteRequest = useRef(0)

  // Calculate payment amount
  const calculatePaymentAmount = useCallback(
    async (topupAmount: number, paymentType: string) => {
      const requestId = latestQuoteRequest.current + 1
      latestQuoteRequest.current = requestId

      try {
        setCalculating(true)

        const nextQuote = await requestPaymentAmount(topupAmount, paymentType)
        if (latestQuoteRequest.current !== requestId) return null
        setQuote(nextQuote)
        return nextQuote
      } catch {
        if (latestQuoteRequest.current === requestId) {
          setQuote(null)
        }
        return null
      } finally {
        if (latestQuoteRequest.current === requestId) {
          setCalculating(false)
        }
      }
    },
    []
  )

  // Process payment
  const processPayment = useCallback(
    async (topupAmount: number, paymentType: string) => {
      try {
        setProcessing(true)

        const isStripe = isStripePayment(paymentType)
        const isPayPal = isPayPalPayment(paymentType)
        const amount = Math.floor(topupAmount)

        let response:
          | PaymentResponse
          | PayPalPaymentResponse
          | StripePaymentResponse
        if (isStripe) {
          response = await requestStripePayment({
            amount,
            payment_method: 'stripe',
          })
        } else if (isPayPal) {
          response = await requestPayPalPayment({
            amount,
            payment_method: 'paypal',
          })
        } else {
          response = await requestPayment({
            amount,
            payment_method: paymentType,
          })
        }

        if (!isApiSuccess(response)) {
          toast.error(response.message || i18next.t('Payment request failed'))
          return false
        }

        // Handle Stripe payment
        if (isStripe && response.data?.pay_link) {
          window.open(response.data.pay_link as string, '_blank')
          toast.success(i18next.t('Redirecting to payment page...'))
          return true
        }

        if (isPayPal && response.data?.pay_link) {
          window.location.assign(response.data.pay_link as string)
          return true
        }

        // Handle non-Stripe payment
        if (!isStripe && !isPayPal && response.data) {
          const url = (response as unknown as { url?: string }).url
          if (url) {
            submitPaymentForm(url, response.data)
            toast.success(i18next.t('Redirecting to payment page...'))
            return true
          }
        }

        return false
      } catch {
        toast.error(i18next.t('Payment request failed'))
        return false
      } finally {
        setProcessing(false)
      }
    },
    []
  )

  const capturePayPalPayment = useCallback(async (orderId: string) => {
    try {
      setProcessing(true)
      const response = await capturePayPalOrder(orderId)
      if (!isApiSuccess(response)) {
        toast.error(
          response.message || i18next.t('PayPal payment confirmation failed')
        )
        return false
      }
      toast.success(i18next.t('PayPal payment completed'))
      return true
    } catch {
      toast.error(i18next.t('PayPal payment confirmation failed'))
      return false
    } finally {
      setProcessing(false)
    }
  }, [])

  return {
    quote,
    amount: quote?.amount ?? 0,
    currency: quote?.currency,
    calculating,
    processing,
    calculatePaymentAmount,
    processPayment,
    capturePayPalPayment,
  }
}
