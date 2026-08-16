package model

import (
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func insertUserForPaymentGuardTest(t *testing.T, id int, quota int) {
	t.Helper()
	user := &User{
		Id:       id,
		Username: "payment_guard_user",
		Status:   common.UserStatusEnabled,
		Quota:    quota,
	}
	require.NoError(t, DB.Create(user).Error)
}

func insertSubscriptionPlanForPaymentGuardTest(t *testing.T, id int) *SubscriptionPlan {
	t.Helper()
	plan := &SubscriptionPlan{
		Id:            id,
		Title:         "Guard Plan",
		PriceAmount:   9.99,
		Currency:      "USD",
		DurationUnit:  SubscriptionDurationMonth,
		DurationValue: 1,
		Enabled:       true,
		TotalAmount:   1000,
	}
	require.NoError(t, DB.Create(plan).Error)
	return plan
}

func insertSubscriptionOrderForPaymentGuardTest(t *testing.T, tradeNo string, userID int, planID int, paymentProvider string) {
	t.Helper()
	order := &SubscriptionOrder{
		UserId:          userID,
		PlanId:          planID,
		Money:           9.99,
		TradeNo:         tradeNo,
		PaymentMethod:   paymentProvider,
		PaymentProvider: paymentProvider,
		Status:          common.TopUpStatusPending,
		CreateTime:      time.Now().Unix(),
	}
	require.NoError(t, order.Insert())
}

func insertTopUpForPaymentGuardTest(t *testing.T, tradeNo string, userID int, paymentProvider string) {
	t.Helper()
	topUp := &TopUp{
		UserId:          userID,
		Amount:          2,
		Money:           9.99,
		TradeNo:         tradeNo,
		PaymentMethod:   paymentProvider,
		PaymentProvider: paymentProvider,
		Status:          common.TopUpStatusPending,
		CreateTime:      time.Now().Unix(),
	}
	require.NoError(t, topUp.Insert())
}

func getTopUpStatusForPaymentGuardTest(t *testing.T, tradeNo string) string {
	t.Helper()
	topUp := GetTopUpByTradeNo(tradeNo)
	require.NotNil(t, topUp)
	return topUp.Status
}

func countUserSubscriptionsForPaymentGuardTest(t *testing.T, userID int) int64 {
	t.Helper()
	var count int64
	require.NoError(t, DB.Model(&UserSubscription{}).Where("user_id = ?", userID).Count(&count).Error)
	return count
}

func getUserQuotaForPaymentGuardTest(t *testing.T, userID int) int {
	t.Helper()
	var user User
	require.NoError(t, DB.Select("quota").Where("id = ?", userID).First(&user).Error)
	return user.Quota
}

func TestRechargeWaffoPancake_RejectsMismatchedPaymentMethod(t *testing.T) {
	truncateTables(t)

	insertUserForPaymentGuardTest(t, 101, 0)
	insertTopUpForPaymentGuardTest(t, "waffo-pancake-guard", 101, PaymentProviderStripe)

	err := RechargeWaffoPancake("waffo-pancake-guard")
	require.Error(t, err)

	topUp := GetTopUpByTradeNo("waffo-pancake-guard")
	require.NotNil(t, topUp)
	assert.Equal(t, common.TopUpStatusPending, topUp.Status)
	assert.Equal(t, 0, getUserQuotaForPaymentGuardTest(t, 101))
}

func TestRechargePayPal_CreditsOnceAndRejectsProviderMismatch(t *testing.T) {
	t.Run("credits exactly once", func(t *testing.T) {
		truncateTables(t)
		insertUserForPaymentGuardTest(t, 102, 7)
		insertTopUpForPaymentGuardTest(t, "paypal-idempotent", 102, PaymentProviderPayPal)

		require.NoError(t, RechargePayPal("paypal-idempotent", "127.0.0.1"))
		quotaAfterFirstCapture := getUserQuotaForPaymentGuardTest(t, 102)
		require.NoError(t, RechargePayPal("paypal-idempotent", "127.0.0.1"))

		assert.Equal(t, 7+int(2*common.QuotaPerUnit), quotaAfterFirstCapture)
		assert.Equal(t, quotaAfterFirstCapture, getUserQuotaForPaymentGuardTest(t, 102))
		assert.Equal(t, common.TopUpStatusSuccess, getTopUpStatusForPaymentGuardTest(t, "paypal-idempotent"))
	})

	t.Run("rejects a different provider", func(t *testing.T) {
		truncateTables(t)
		insertUserForPaymentGuardTest(t, 103, 0)
		insertTopUpForPaymentGuardTest(t, "paypal-provider-guard", 103, PaymentProviderStripe)

		require.Error(t, RechargePayPal("paypal-provider-guard", "127.0.0.1"))
		assert.Equal(t, common.TopUpStatusPending, getTopUpStatusForPaymentGuardTest(t, "paypal-provider-guard"))
		assert.Zero(t, getUserQuotaForPaymentGuardTest(t, 103))
	})
}

func TestRechargeEpayCommitsStatusAndQuotaAtomically(t *testing.T) {
	truncateTables(t)
	insertUserForPaymentGuardTest(t, 112, 7)
	topUp := &TopUp{
		UserId:          112,
		Amount:          2,
		Money:           14.60,
		TradeNo:         "epay-atomic",
		PaymentMethod:   "wxpay",
		PaymentProvider: PaymentProviderEpay,
		PaymentCurrency: "CNY",
		Status:          common.TopUpStatusPending,
	}
	require.NoError(t, topUp.Insert())

	require.NoError(t, RechargeEpay(topUp.TradeNo, "alipay", "127.0.0.1"))
	quotaAfterFirstCallback := getUserQuotaForPaymentGuardTest(t, 112)
	require.NoError(t, RechargeEpay(topUp.TradeNo, "alipay", "127.0.0.1"))

	stored := GetTopUpByTradeNo(topUp.TradeNo)
	require.NotNil(t, stored)
	assert.Equal(t, common.TopUpStatusSuccess, stored.Status)
	assert.Equal(t, "alipay", stored.PaymentMethod)
	assert.Equal(t, 7+int(2*common.QuotaPerUnit), quotaAfterFirstCallback)
	assert.Equal(t, quotaAfterFirstCallback, getUserQuotaForPaymentGuardTest(t, 112))
}

func TestRechargeEpayLeavesOversizedOrderPending(t *testing.T) {
	truncateTables(t)
	insertUserForPaymentGuardTest(t, 113, 0)
	originalQuotaPerUnit := common.QuotaPerUnit
	t.Cleanup(func() {
		common.QuotaPerUnit = originalQuotaPerUnit
	})
	common.QuotaPerUnit = 500000

	topUp := &TopUp{
		UserId:          113,
		Amount:          4295,
		Money:           31353.50,
		TradeNo:         "epay-overflow",
		PaymentMethod:   "alipay",
		PaymentProvider: PaymentProviderEpay,
		PaymentCurrency: "CNY",
		Status:          common.TopUpStatusPending,
	}
	require.NoError(t, topUp.Insert())

	require.Error(t, RechargeEpay(topUp.TradeNo, "alipay", "127.0.0.1"))
	assert.Equal(t, common.TopUpStatusPending, getTopUpStatusForPaymentGuardTest(t, topUp.TradeNo))
	assert.Zero(t, getUserQuotaForPaymentGuardTest(t, 113))
}

func TestRechargeUsesCreditAmountAndStoresActualStripePayment(t *testing.T) {
	truncateTables(t)

	insertUserForPaymentGuardTest(t, 104, 7)
	insertTopUpForPaymentGuardTest(t, "stripe-currency", 104, PaymentProviderStripe)

	require.NoError(t, Recharge("stripe-currency", "customer-1", "127.0.0.1", 7.25, " usd "))
	topUp := GetTopUpByTradeNo("stripe-currency")
	require.NotNil(t, topUp)
	assert.Equal(t, "USD", topUp.PaymentCurrency)
	assert.InDelta(t, 7.25, topUp.Money, 0.000001)
	assert.Equal(t, int64(2), topUp.Amount)
	assert.Equal(t, 7+int(2*common.QuotaPerUnit), getUserQuotaForPaymentGuardTest(t, 104))
}

func TestRechargePreservesLegacyStripeCreditSemantics(t *testing.T) {
	truncateTables(t)

	insertUserForPaymentGuardTest(t, 110, 0)
	legacy := &TopUp{
		UserId:        110,
		Amount:        2,
		Money:         3,
		TradeNo:       "stripe-legacy-webhook",
		PaymentMethod: PaymentMethodStripe,
		Status:        common.TopUpStatusPending,
	}
	require.NoError(t, legacy.Insert())
	require.NoError(t, DB.Model(legacy).Update("credit_amount", 0).Error)

	require.NoError(t, Recharge(legacy.TradeNo, "customer-legacy", "127.0.0.1", 2, "USD"))
	assert.Equal(t, int(3*common.QuotaPerUnit), getUserQuotaForPaymentGuardTest(t, 110))
}

func TestRechargeRejectsInvalidActualStripePayment(t *testing.T) {
	truncateTables(t)

	insertUserForPaymentGuardTest(t, 105, 0)
	insertTopUpForPaymentGuardTest(t, "stripe-invalid-payment", 105, PaymentProviderStripe)

	require.Error(t, Recharge("stripe-invalid-payment", "customer-1", "127.0.0.1", -0.01, "USD"))
	assert.Equal(t, common.TopUpStatusPending, getTopUpStatusForPaymentGuardTest(t, "stripe-invalid-payment"))
	assert.Zero(t, getUserQuotaForPaymentGuardTest(t, 105))
}

func TestNormalizePaymentCurrency(t *testing.T) {
	testCases := []struct {
		name     string
		input    string
		expected string
		wantErr  bool
	}{
		{name: "normalizes ISO code", input: " usd ", expected: "USD"},
		{name: "allows empty legacy value", input: "  ", expected: ""},
		{name: "allows provider currency up to column length", input: "testcurrency", expected: "TESTCURRENCY"},
		{name: "rejects too short", input: "US", wantErr: true},
		{name: "rejects too long", input: "ABCDEFGHIJKLM", wantErr: true},
		{name: "rejects punctuation", input: "US-D", wantErr: true},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			actual, err := NormalizePaymentCurrency(testCase.input)
			if testCase.wantErr {
				require.Error(t, err)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, testCase.expected, actual)
		})
	}
}

func TestTopUpInsertNormalizesAndValidatesPaymentCurrency(t *testing.T) {
	truncateTables(t)
	insertUserForPaymentGuardTest(t, 106, 0)

	topUp := &TopUp{
		UserId:          106,
		Amount:          1,
		Money:           1,
		TradeNo:         "normalized-insert-currency",
		PaymentMethod:   PaymentMethodStripe,
		PaymentProvider: PaymentProviderStripe,
		PaymentCurrency: " usd ",
		Status:          common.TopUpStatusPending,
	}
	require.NoError(t, topUp.Insert())
	stored := GetTopUpByTradeNo(topUp.TradeNo)
	require.NotNil(t, stored)
	assert.Equal(t, "USD", stored.PaymentCurrency)
	assert.Equal(t, 1.0, stored.CreditAmount)

	invalid := &TopUp{
		UserId:          106,
		Amount:          1,
		Money:           1,
		TradeNo:         "invalid-insert-currency",
		PaymentMethod:   PaymentMethodStripe,
		PaymentProvider: PaymentProviderStripe,
		PaymentCurrency: "US-D",
		Status:          common.TopUpStatusPending,
	}
	require.Error(t, invalid.Insert())
	assert.Nil(t, GetTopUpByTradeNo(invalid.TradeNo))
}

func TestTopUpInsertSnapshotsCreemCreditAmount(t *testing.T) {
	truncateTables(t)
	insertUserForPaymentGuardTest(t, 109, 0)
	originalQuotaPerUnit := common.QuotaPerUnit
	t.Cleanup(func() {
		common.QuotaPerUnit = originalQuotaPerUnit
	})
	common.QuotaPerUnit = 500_000

	topUp := &TopUp{
		UserId:          109,
		Amount:          1_250_000,
		Money:           20,
		TradeNo:         "creem-credit-snapshot",
		PaymentMethod:   PaymentMethodCreem,
		PaymentProvider: PaymentProviderCreem,
		PaymentCurrency: "USD",
		Status:          common.TopUpStatusPending,
	}
	require.NoError(t, topUp.Insert())

	stored := GetTopUpByTradeNo(topUp.TradeNo)
	require.NotNil(t, stored)
	assert.Equal(t, 2.5, stored.CreditAmount)

	common.QuotaPerUnit = 1_000_000
	stored = GetTopUpByTradeNo(topUp.TradeNo)
	require.NotNil(t, stored)
	assert.Equal(t, 2.5, stored.CreditAmount, "stored credit must not drift with later quota-unit changes")
}

func TestManualCompleteTopUpUsesNewStripeCreditAmountAndLegacyFallback(t *testing.T) {
	t.Run("new Stripe order credits Amount", func(t *testing.T) {
		truncateTables(t)
		insertUserForPaymentGuardTest(t, 107, 0)
		topUp := &TopUp{
			UserId:          107,
			Amount:          2,
			Money:           14.60,
			TradeNo:         "stripe-manual-new",
			PaymentMethod:   PaymentMethodStripe,
			PaymentProvider: PaymentProviderStripe,
			PaymentCurrency: "CNY",
			Status:          common.TopUpStatusPending,
		}
		require.NoError(t, topUp.Insert())
		assert.Equal(t, 2.0, topUp.CreditAmount)

		require.NoError(t, ManualCompleteTopUp(topUp.TradeNo, "127.0.0.1"))
		assert.Equal(t, int(2*common.QuotaPerUnit), getUserQuotaForPaymentGuardTest(t, 107))
	})

	t.Run("legacy Stripe order credits Money", func(t *testing.T) {
		truncateTables(t)
		insertUserForPaymentGuardTest(t, 108, 0)
		topUp := &TopUp{
			UserId:        108,
			Amount:        2,
			Money:         3,
			TradeNo:       "stripe-manual-legacy",
			PaymentMethod: PaymentMethodStripe,
			Status:        common.TopUpStatusPending,
		}
		require.NoError(t, topUp.Insert())
		require.NoError(t, DB.Model(topUp).Update("credit_amount", 0).Error)

		require.NoError(t, ManualCompleteTopUp(topUp.TradeNo, "127.0.0.1"))
		assert.Equal(t, int(3*common.QuotaPerUnit), getUserQuotaForPaymentGuardTest(t, 108))
	})
}

func TestManualCompleteTopUpCreditsCreemStoredQuotaWithoutMultiplyingAgain(t *testing.T) {
	truncateTables(t)
	insertUserForPaymentGuardTest(t, 111, 5)
	topUp := &TopUp{
		UserId:          111,
		Amount:          1_250_000,
		Money:           20,
		TradeNo:         "creem-manual-complete",
		PaymentMethod:   PaymentMethodCreem,
		PaymentProvider: PaymentProviderCreem,
		PaymentCurrency: "USD",
		Status:          common.TopUpStatusPending,
	}
	require.NoError(t, topUp.Insert())

	require.NoError(t, ManualCompleteTopUp(topUp.TradeNo, "127.0.0.1"))
	assert.Equal(t, 1_250_005, getUserQuotaForPaymentGuardTest(t, 111))
}

func TestUpdatePendingTopUpStatus_RejectsMismatchedPaymentProvider(t *testing.T) {
	testCases := []struct {
		name                    string
		tradeNo                 string
		storedPaymentProvider   string
		expectedPaymentProvider string
		targetStatus            string
	}{
		{
			name:                    "stripe expire",
			tradeNo:                 "stripe-expire-guard",
			storedPaymentProvider:   PaymentProviderCreem,
			expectedPaymentProvider: PaymentProviderStripe,
			targetStatus:            common.TopUpStatusExpired,
		},
		{
			name:                    "waffo failed",
			tradeNo:                 "waffo-failed-guard",
			storedPaymentProvider:   PaymentProviderStripe,
			expectedPaymentProvider: PaymentProviderWaffo,
			targetStatus:            common.TopUpStatusFailed,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			truncateTables(t)
			insertUserForPaymentGuardTest(t, 150, 0)
			insertTopUpForPaymentGuardTest(t, tc.tradeNo, 150, tc.storedPaymentProvider)

			err := UpdatePendingTopUpStatus(tc.tradeNo, tc.expectedPaymentProvider, tc.targetStatus)
			require.ErrorIs(t, err, ErrPaymentMethodMismatch)
			assert.Equal(t, common.TopUpStatusPending, getTopUpStatusForPaymentGuardTest(t, tc.tradeNo))
		})
	}
}

func TestCompleteSubscriptionOrder_RejectsMismatchedPaymentProvider(t *testing.T) {
	truncateTables(t)

	insertUserForPaymentGuardTest(t, 202, 0)
	plan := insertSubscriptionPlanForPaymentGuardTest(t, 301)
	insertSubscriptionOrderForPaymentGuardTest(t, "sub-guard-order", 202, plan.Id, PaymentProviderStripe)

	err := CompleteSubscriptionOrder("sub-guard-order", `{"provider":"epay"}`, PaymentProviderEpay, "alipay")
	require.ErrorIs(t, err, ErrPaymentMethodMismatch)

	order := GetSubscriptionOrderByTradeNo("sub-guard-order")
	require.NotNil(t, order)
	assert.Equal(t, common.TopUpStatusPending, order.Status)
	assert.Zero(t, countUserSubscriptionsForPaymentGuardTest(t, 202))

	topUp := GetTopUpByTradeNo("sub-guard-order")
	assert.Nil(t, topUp)
}

func TestCompleteSubscriptionOrder_CopiesPaymentProviderToTopUp(t *testing.T) {
	truncateTables(t)

	insertUserForPaymentGuardTest(t, 203, 0)
	plan := insertSubscriptionPlanForPaymentGuardTest(t, 302)
	insertSubscriptionOrderForPaymentGuardTest(t, "sub-provider-history", 203, plan.Id, PaymentProviderStripe)

	require.NoError(t, CompleteSubscriptionOrder("sub-provider-history", `{}`, PaymentProviderStripe, ""))
	topUp := GetTopUpByTradeNo("sub-provider-history")
	require.NotNil(t, topUp)
	assert.Equal(t, PaymentProviderStripe, topUp.PaymentProvider)
	assert.Equal(t, common.TopUpStatusSuccess, topUp.Status)
}

func TestExpireSubscriptionOrder_RejectsMismatchedPaymentProvider(t *testing.T) {
	truncateTables(t)

	insertUserForPaymentGuardTest(t, 303, 0)
	plan := insertSubscriptionPlanForPaymentGuardTest(t, 401)
	insertSubscriptionOrderForPaymentGuardTest(t, "sub-expire-guard", 303, plan.Id, PaymentProviderStripe)

	err := ExpireSubscriptionOrder("sub-expire-guard", PaymentProviderCreem)
	require.ErrorIs(t, err, ErrPaymentMethodMismatch)

	order := GetSubscriptionOrderByTradeNo("sub-expire-guard")
	require.NotNil(t, order)
	assert.Equal(t, common.TopUpStatusPending, order.Status)
}
