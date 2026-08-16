package controller

import (
	"math"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetTopUpRequestAmountLimitRespectsQuotaStorageBoundary(t *testing.T) {
	creditLimit, err := getTopUpRequestAmountLimit(10000, false, 500000)
	require.NoError(t, err)
	assert.Equal(t, int64(4294), creditLimit)

	tokenLimit, err := getTopUpRequestAmountLimit(10000, true, 500000)
	require.NoError(t, err)
	assert.Equal(t, int64(2_147_000_000), tokenLimit)

	configuredLimit, err := getTopUpRequestAmountLimit(10000, false, 1)
	require.NoError(t, err)
	assert.Equal(t, int64(10000), configuredLimit)
}

func TestGetTopUpRequestAmountLimitRejectsInvalidConfiguration(t *testing.T) {
	for _, quotaPerUnit := range []float64{0, -1, math.NaN(), math.Inf(1)} {
		_, err := getTopUpRequestAmountLimit(10000, false, quotaPerUnit)
		require.Error(t, err)
	}
}
