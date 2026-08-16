package controller

import (
	"errors"
	"math"

	"github.com/QuantumNous/new-api/common"
	"github.com/shopspring/decimal"
)

func getTopUpRequestAmountLimit(configuredMaxCredits int64, tokenDisplay bool, quotaPerUnit float64) (int64, error) {
	if configuredMaxCredits <= 0 || quotaPerUnit <= 0 || math.IsNaN(quotaPerUnit) || math.IsInf(quotaPerUnit, 0) {
		return 0, errors.New("invalid topup limit configuration")
	}

	quotaUnit := decimal.NewFromFloat(quotaPerUnit)
	maxCredits := decimal.NewFromInt(int64(common.MaxQuota - 1)).
		Div(quotaUnit).
		Floor()
	configuredLimit := decimal.NewFromInt(configuredMaxCredits)
	if maxCredits.GreaterThan(configuredLimit) {
		maxCredits = configuredLimit
	}
	if maxCredits.LessThan(decimal.NewFromInt(1)) {
		return 0, errors.New("quota per unit leaves no billable topup range")
	}

	requestLimit := maxCredits
	if tokenDisplay {
		requestLimit = requestLimit.Mul(quotaUnit).Floor()
	}
	if requestLimit.GreaterThan(decimal.NewFromInt(math.MaxInt64)) {
		return 0, errors.New("topup request limit exceeds integer range")
	}
	normalized := requestLimit.IntPart()
	if normalized <= 0 {
		return 0, errors.New("invalid topup request limit")
	}
	return normalized, nil
}
