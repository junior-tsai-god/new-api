package controller

import (
	"math"
	"testing"

	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/shopspring/decimal"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetStripeTopUpDiscountUsesOriginalTokenAmount(t *testing.T) {
	originalDiscounts := operation_setting.GetPaymentSetting().AmountDiscount
	t.Cleanup(func() {
		operation_setting.GetPaymentSetting().AmountDiscount = originalDiscounts
	})
	operation_setting.GetPaymentSetting().AmountDiscount = map[int]float64{
		10:        0.9,
		5_000_000: 0.8,
	}

	discount, err := getStripeTopUpDiscount(5_000_000)
	require.NoError(t, err)
	assert.True(t, decimal.NewFromFloat(0.8).Equal(discount))
}

func TestNormalizeStripeTopUpCredit(t *testing.T) {
	testCases := []struct {
		name          string
		requestAmount int64
		tokenDisplay  bool
		quotaPerUnit  decimal.Decimal
		expected      int64
		wantErr       bool
	}{
		{
			name:          "currency display already uses USD credit",
			requestAmount: 10,
			quotaPerUnit:  decimal.NewFromInt(1),
			expected:      10,
		},
		{
			name:          "token display converts to USD credit",
			requestAmount: 5_000_000,
			tokenDisplay:  true,
			quotaPerUnit:  decimal.NewFromInt(500_000),
			expected:      10,
		},
		{
			name:          "token display rejects partial USD credit",
			requestAmount: 750_000,
			tokenDisplay:  true,
			quotaPerUnit:  decimal.NewFromInt(500_000),
			wantErr:       true,
		},
		{
			name:          "token display rejects invalid quota unit",
			requestAmount: 500_000,
			tokenDisplay:  true,
			quotaPerUnit:  decimal.Zero,
			wantErr:       true,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			actual, err := normalizeStripeTopUpCredit(
				testCase.requestAmount,
				testCase.tokenDisplay,
				testCase.quotaPerUnit,
			)
			if testCase.wantErr {
				require.Error(t, err)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, testCase.expected, actual)
		})
	}
}

func TestCalculateStripeTopUpQuote(t *testing.T) {
	testCases := []struct {
		name             string
		input            stripeTopUpPricingInput
		expectedMinor    int64
		expectedMajor    string
		expectedExponent int32
	}{
		{
			name: "uses Stripe two-decimal unit price",
			input: stripeTopUpPricingInput{
				CreditAmount:    10,
				Currency:        "cny",
				ProductID:       "prod_credit",
				UnitAmountMinor: decimal.NewFromInt(730),
				GroupRatio:      decimal.NewFromInt(1),
				Discount:        decimal.NewFromInt(1),
			},
			expectedMinor:    7300,
			expectedMajor:    "73.00",
			expectedExponent: 2,
		},
		{
			name: "applies group ratio and preset discount exactly once",
			input: stripeTopUpPricingInput{
				CreditAmount:    10,
				Currency:        "USD",
				ProductID:       "prod_credit",
				UnitAmountMinor: decimal.NewFromInt(730),
				GroupRatio:      decimal.NewFromFloat(1.2),
				Discount:        decimal.NewFromFloat(0.8),
			},
			expectedMinor:    7008,
			expectedMajor:    "70.08",
			expectedExponent: 2,
		},
		{
			name: "rounds only the final minor amount",
			input: stripeTopUpPricingInput{
				CreditAmount:    1,
				Currency:        "USD",
				ProductID:       "prod_credit",
				UnitAmountMinor: decimal.NewFromInt(101),
				GroupRatio:      decimal.NewFromFloat(0.5),
				Discount:        decimal.NewFromInt(1),
			},
			expectedMinor:    51,
			expectedMajor:    "0.51",
			expectedExponent: 2,
		},
		{
			name: "supports zero-decimal currency",
			input: stripeTopUpPricingInput{
				CreditAmount:    10,
				Currency:        "JPY",
				ProductID:       "prod_credit",
				UnitAmountMinor: decimal.NewFromInt(7),
				GroupRatio:      decimal.NewFromInt(1),
				Discount:        decimal.NewFromInt(1),
			},
			expectedMinor:    70,
			expectedMajor:    "70",
			expectedExponent: 0,
		},
		{
			name: "supports three-decimal currency",
			input: stripeTopUpPricingInput{
				CreditAmount:    10,
				Currency:        "KWD",
				ProductID:       "prod_credit",
				UnitAmountMinor: decimal.NewFromInt(7300),
				GroupRatio:      decimal.NewFromInt(1),
				Discount:        decimal.NewFromInt(1),
			},
			expectedMinor:    73_000,
			expectedMajor:    "73.000",
			expectedExponent: 3,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			quote, err := calculateStripeTopUpQuote(testCase.input)
			require.NoError(t, err)
			assert.Equal(t, testCase.expectedMinor, quote.MinorAmount)
			assert.Equal(t, testCase.expectedMajor, quote.MajorAmount.StringFixed(quote.CurrencyExponent))
			assert.Equal(t, testCase.expectedExponent, quote.CurrencyExponent)
		})
	}
}

func TestCalculateStripeTopUpQuoteRejectsUnsafeAmounts(t *testing.T) {
	baseInput := stripeTopUpPricingInput{
		CreditAmount:    1,
		Currency:        "USD",
		ProductID:       "prod_credit",
		UnitAmountMinor: decimal.NewFromInt(100),
		GroupRatio:      decimal.NewFromInt(1),
		Discount:        decimal.NewFromInt(1),
	}

	testCases := []struct {
		name   string
		mutate func(*stripeTopUpPricingInput)
	}{
		{
			name: "credit limit",
			mutate: func(input *stripeTopUpPricingInput) {
				input.CreditAmount = maxStripeTopUpCredits + 1
			},
		},
		{
			name: "minor amount overflow",
			mutate: func(input *stripeTopUpPricingInput) {
				input.CreditAmount = 2
				input.UnitAmountMinor = decimal.NewFromInt(math.MaxInt64)
			},
		},
		{
			name: "non-positive ratio",
			mutate: func(input *stripeTopUpPricingInput) {
				input.GroupRatio = decimal.Zero
			},
		},
		{
			name: "invalid currency",
			mutate: func(input *stripeTopUpPricingInput) {
				input.Currency = "US-D"
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			input := baseInput
			testCase.mutate(&input)
			_, err := calculateStripeTopUpQuote(input)
			require.Error(t, err)
		})
	}
}
