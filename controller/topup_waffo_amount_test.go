package controller

import (
	"math"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNormalizeWaffoPaymentAmountMatchesGatewayPrecision(t *testing.T) {
	testCases := []struct {
		name           string
		amount         float64
		currency       string
		expectedAmount float64
		expectedText   string
	}{
		{
			name:           "zero decimal currency",
			amount:         73.6,
			currency:       "jpy",
			expectedAmount: 74,
			expectedText:   "74",
		},
		{
			name:           "two decimal currency",
			amount:         73.678,
			currency:       "usd",
			expectedAmount: 73.68,
			expectedText:   "73.68",
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			amount, text, err := normalizeWaffoPaymentAmount(testCase.amount, testCase.currency)
			require.NoError(t, err)
			assert.Equal(t, testCase.expectedAmount, amount)
			assert.Equal(t, testCase.expectedText, text)
		})
	}
}

func TestNormalizeWaffoPaymentAmountRejectsNonFiniteAndNonPositiveValues(t *testing.T) {
	for _, amount := range []float64{math.NaN(), math.Inf(1), math.Inf(-1), 0, -1} {
		paymentAmount, paymentText, err := normalizeWaffoPaymentAmount(amount, "USD")
		require.Error(t, err)
		assert.Zero(t, paymentAmount)
		assert.Empty(t, paymentText)
	}
}

func TestGetWaffoMaxTopUpAmountBoundsCreditAndTokenModes(t *testing.T) {
	creditLimit, err := getWaffoMaxTopUpAmount(false, 1)
	require.NoError(t, err)
	assert.Equal(t, int64(10000), creditLimit)

	tokenLimit, err := getWaffoMaxTopUpAmount(true, 500000)
	require.NoError(t, err)
	assert.Equal(t, int64(2_147_000_000), tokenLimit)

	_, err = getWaffoMaxTopUpAmount(true, math.NaN())
	require.Error(t, err)
	_, err = getWaffoMaxTopUpAmount(true, math.Inf(1))
	require.Error(t, err)
}
