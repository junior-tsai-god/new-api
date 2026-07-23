package controller

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func TestGetTopUpInfoHidesEpayMethodsWhenEpayIsNotConfigured(t *testing.T) {
	confirmPaymentComplianceForTest(t)
	originalPayAddress := operation_setting.PayAddress
	originalEpayID := operation_setting.EpayId
	originalEpayKey := operation_setting.EpayKey
	originalPayMethods := operation_setting.PayMethods
	originalStripeAPISecret := setting.StripeApiSecret
	originalPayPalClientID := setting.PayPalClientID
	originalPayPalClientSecret := setting.PayPalClientSecret
	originalPayPalWebhookID := setting.PayPalWebhookID
	originalPayPalMinTopUp := setting.PayPalMinTopUp
	originalWaffoEnabled := setting.WaffoEnabled
	originalWaffoPancakeMerchantID := setting.WaffoPancakeMerchantID
	t.Cleanup(func() {
		operation_setting.PayAddress = originalPayAddress
		operation_setting.EpayId = originalEpayID
		operation_setting.EpayKey = originalEpayKey
		operation_setting.PayMethods = originalPayMethods
		setting.StripeApiSecret = originalStripeAPISecret
		setting.PayPalClientID = originalPayPalClientID
		setting.PayPalClientSecret = originalPayPalClientSecret
		setting.PayPalWebhookID = originalPayPalWebhookID
		setting.PayPalMinTopUp = originalPayPalMinTopUp
		setting.WaffoEnabled = originalWaffoEnabled
		setting.WaffoPancakeMerchantID = originalWaffoPancakeMerchantID
	})

	operation_setting.PayAddress = ""
	operation_setting.EpayId = ""
	operation_setting.EpayKey = ""
	operation_setting.PayMethods = []map[string]string{
		{"name": "支付宝", "type": "alipay"},
		{"name": "微信", "type": "wxpay"},
		{"name": "自定义1", "type": "custom1"},
	}
	setting.StripeApiSecret = ""
	setting.PayPalClientID = "client_id"
	setting.PayPalClientSecret = "client_secret"
	setting.PayPalWebhookID = "webhook_id"
	setting.PayPalMinTopUp = 1
	setting.WaffoEnabled = false
	setting.WaffoPancakeMerchantID = ""

	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	context.Request = httptest.NewRequest(http.MethodGet, "/api/user/topup/info", nil)
	GetTopUpInfo(context)

	require.Equal(t, http.StatusOK, recorder.Code)
	var response struct {
		Data struct {
			EnableOnlineTopUp bool                `json:"enable_online_topup"`
			EnablePayPalTopUp bool                `json:"enable_paypal_topup"`
			PayMethods        []map[string]string `json:"pay_methods"`
		} `json:"data"`
	}
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &response))
	require.False(t, response.Data.EnableOnlineTopUp)
	require.True(t, response.Data.EnablePayPalTopUp)
	require.Equal(t, []map[string]string{
		{
			"name":      "PayPal",
			"type":      model.PaymentMethodPayPal,
			"min_topup": "1",
		},
	}, response.Data.PayMethods)
}

func completedPayPalOrderForTest(orderID, currency, amount string) *payPalOrder {
	order := &payPalOrder{
		ID:     orderID,
		Status: "COMPLETED",
		PurchaseUnits: []payPalPurchaseUnit{
			{},
		},
	}
	order.PurchaseUnits[0].Payments.Captures = []payPalCapture{
		{
			ID:     "CAPTURE-1",
			Status: "COMPLETED",
			Amount: payPalMoney{CurrencyCode: currency, Value: amount},
		},
	}
	return order
}

func TestValidatePayPalCapturedOrder(t *testing.T) {
	topUp := &model.TopUp{TradeNo: "ORDER-1", Money: 9.99}

	require.NoError(t, validatePayPalCapturedOrder(completedPayPalOrderForTest("ORDER-1", "USD", "9.99"), topUp))

	testCases := []struct {
		name  string
		order *payPalOrder
	}{
		{name: "wrong order", order: completedPayPalOrderForTest("ORDER-2", "USD", "9.99")},
		{name: "wrong currency", order: completedPayPalOrderForTest("ORDER-1", "EUR", "9.99")},
		{name: "wrong amount", order: completedPayPalOrderForTest("ORDER-1", "USD", "9.98")},
		{name: "not completed", order: completedPayPalOrderForTest("ORDER-1", "USD", "9.99")},
	}
	testCases[3].order.Status = "APPROVED"

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			require.Error(t, validatePayPalCapturedOrder(testCase.order, topUp))
		})
	}
}
