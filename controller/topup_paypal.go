package controller

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/operation_setting"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

const payPalCurrency = "USD"

var payPalHTTPClient = &http.Client{Timeout: 20 * time.Second}

var payPalTokenCache struct {
	sync.Mutex
	key       string
	token     string
	expiresAt time.Time
}

type payPalPayRequest struct {
	Amount        int64  `json:"amount"`
	PaymentMethod string `json:"payment_method"`
	SuccessURL    string `json:"success_url,omitempty"`
	CancelURL     string `json:"cancel_url,omitempty"`
}

type payPalCaptureRequest struct {
	OrderID string `json:"order_id"`
}

type payPalMoney struct {
	CurrencyCode string `json:"currency_code"`
	Value        string `json:"value"`
}

type payPalCapture struct {
	ID     string      `json:"id"`
	Status string      `json:"status"`
	Amount payPalMoney `json:"amount"`
}

type payPalPurchaseUnit struct {
	ReferenceID string      `json:"reference_id"`
	Amount      payPalMoney `json:"amount"`
	Payments    struct {
		Captures []payPalCapture `json:"captures"`
	} `json:"payments"`
}

type payPalLink struct {
	Href string `json:"href"`
	Rel  string `json:"rel"`
}

type payPalOrder struct {
	ID            string               `json:"id"`
	Status        string               `json:"status"`
	PurchaseUnits []payPalPurchaseUnit `json:"purchase_units"`
	Links         []payPalLink         `json:"links"`
}

type payPalWebhookResource struct {
	ID                string               `json:"id"`
	Status            string               `json:"status"`
	Amount            payPalMoney          `json:"amount"`
	PurchaseUnits     []payPalPurchaseUnit `json:"purchase_units"`
	SupplementaryData struct {
		RelatedIDs struct {
			OrderID string `json:"order_id"`
		} `json:"related_ids"`
	} `json:"supplementary_data"`
}

type payPalWebhookEvent struct {
	ID        string                `json:"id"`
	EventType string                `json:"event_type"`
	Resource  payPalWebhookResource `json:"resource"`
}

func payPalAPIBaseURL() string {
	if setting.PayPalSandbox {
		return "https://api-m.sandbox.paypal.com"
	}
	return "https://api-m.paypal.com"
}

func getPayPalAccessToken(ctx context.Context) (string, error) {
	clientID := strings.TrimSpace(setting.PayPalClientID)
	clientSecret := strings.TrimSpace(setting.PayPalClientSecret)
	if clientID == "" || clientSecret == "" {
		return "", errors.New("PayPal API 凭证未配置")
	}

	cacheKey := fmt.Sprintf("%t:%s:%s", setting.PayPalSandbox, clientID, common.Sha1([]byte(clientSecret)))
	payPalTokenCache.Lock()
	defer payPalTokenCache.Unlock()
	if payPalTokenCache.key == cacheKey && payPalTokenCache.token != "" && time.Now().Add(time.Minute).Before(payPalTokenCache.expiresAt) {
		return payPalTokenCache.token, nil
	}

	form := url.Values{"grant_type": {"client_credentials"}}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, payPalAPIBaseURL()+"/v1/oauth2/token", strings.NewReader(form.Encode()))
	if err != nil {
		return "", err
	}
	req.SetBasicAuth(clientID, clientSecret)
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Accept-Language", "en_US")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := payPalHTTPClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		message, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return "", fmt.Errorf("PayPal OAuth 返回 HTTP %d: %s", resp.StatusCode, strings.TrimSpace(string(message)))
	}

	var tokenResponse struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
	}
	if err := common.DecodeJson(resp.Body, &tokenResponse); err != nil {
		return "", err
	}
	if tokenResponse.AccessToken == "" {
		return "", errors.New("PayPal OAuth 响应缺少 access_token")
	}

	payPalTokenCache.key = cacheKey
	payPalTokenCache.token = tokenResponse.AccessToken
	payPalTokenCache.expiresAt = time.Now().Add(time.Duration(tokenResponse.ExpiresIn) * time.Second)
	return tokenResponse.AccessToken, nil
}

func requestPayPalAPI(ctx context.Context, method, path, requestID string, payload any, response any) error {
	var payloadData []byte
	if payload != nil {
		data, err := common.Marshal(payload)
		if err != nil {
			return err
		}
		payloadData = data
	}

	for attempt := 0; attempt < 2; attempt++ {
		accessToken, err := getPayPalAccessToken(ctx)
		if err != nil {
			return err
		}

		var body io.Reader
		if payloadData != nil {
			body = bytes.NewReader(payloadData)
		}
		req, err := http.NewRequestWithContext(ctx, method, payPalAPIBaseURL()+path, body)
		if err != nil {
			return err
		}
		req.Header.Set("Accept", "application/json")
		req.Header.Set("Authorization", "Bearer "+accessToken)
		if payload != nil {
			req.Header.Set("Content-Type", "application/json")
		}
		if requestID != "" {
			req.Header.Set("PayPal-Request-Id", requestID)
		}

		resp, err := payPalHTTPClient.Do(req)
		if err != nil {
			return err
		}
		if resp.StatusCode == http.StatusUnauthorized && attempt == 0 {
			resp.Body.Close()
			payPalTokenCache.Lock()
			payPalTokenCache.token = ""
			payPalTokenCache.expiresAt = time.Time{}
			payPalTokenCache.Unlock()
			continue
		}
		if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
			message, _ := io.ReadAll(io.LimitReader(resp.Body, 8192))
			resp.Body.Close()
			return fmt.Errorf("PayPal API 返回 HTTP %d: %s", resp.StatusCode, strings.TrimSpace(string(message)))
		}
		if response == nil || resp.StatusCode == http.StatusNoContent {
			resp.Body.Close()
			return nil
		}
		decodeErr := common.DecodeJson(resp.Body, response)
		resp.Body.Close()
		return decodeErr
	}
	return errors.New("PayPal API 认证失败")
}

func getPayPalPayMoney(amount int64, group string) decimal.Decimal {
	dAmount := decimal.NewFromInt(amount)
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		dAmount = dAmount.Div(decimal.NewFromFloat(common.QuotaPerUnit))
	}

	topupGroupRatio := common.GetTopupGroupRatio(group)
	if topupGroupRatio == 0 {
		topupGroupRatio = 1
	}
	discount := 1.0
	if configured, ok := operation_setting.GetPaymentSetting().AmountDiscount[int(amount)]; ok && configured > 0 {
		discount = configured
	}

	return dAmount.
		Mul(decimal.NewFromFloat(setting.PayPalUnitPrice)).
		Mul(decimal.NewFromFloat(topupGroupRatio)).
		Mul(decimal.NewFromFloat(discount)).
		Round(2)
}

func getPayPalTopUpBounds(minimum int64, tokenDisplay bool, quotaPerUnit float64) (int64, int64, error) {
	maximum, err := getTopUpRequestAmountLimit(10000, tokenDisplay, quotaPerUnit)
	if err != nil {
		return 0, 0, err
	}
	minimumAmount := decimal.NewFromInt(minimum)
	if tokenDisplay {
		quotaUnit := decimal.NewFromFloat(quotaPerUnit)
		minimumAmount = minimumAmount.Mul(quotaUnit)
	}
	maxInt64 := decimal.NewFromInt(math.MaxInt64)
	if minimumAmount.GreaterThan(maxInt64) {
		return 0, 0, errors.New("topup amount bounds exceed integer range")
	}
	minTopup := minimumAmount.IntPart()
	if minTopup < 0 || minTopup > maximum {
		return 0, 0, errors.New("invalid topup amount bounds")
	}
	return minTopup, maximum, nil
}

func normalizePayPalTopUpAmount(amount int64) int64 {
	if operation_setting.GetQuotaDisplayType() != operation_setting.QuotaDisplayTypeTokens {
		return amount
	}
	normalized := decimal.NewFromInt(amount).Div(decimal.NewFromFloat(common.QuotaPerUnit)).IntPart()
	if normalized < 1 {
		return 1
	}
	return normalized
}

func RequestPayPalAmount(c *gin.Context) {
	var req payPalPayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "参数错误"})
		return
	}
	minTopup, maxTopup, err := getPayPalTopUpBounds(
		int64(setting.PayPalMinTopUp),
		operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens,
		common.QuotaPerUnit,
	)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "充值额度配置错误"})
		return
	}
	if req.Amount < minTopup {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": fmt.Sprintf("充值数量不能小于 %d", minTopup)})
		return
	}
	if req.Amount > maxTopup {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": fmt.Sprintf("充值数量不能大于 %d", maxTopup)})
		return
	}

	group, err := model.GetUserGroup(c.GetInt("id"), true)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "获取用户分组失败"})
		return
	}
	payMoney := getPayPalPayMoney(req.Amount, group)
	if payMoney.LessThan(decimal.NewFromFloat(0.01)) {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "充值金额过低"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message":  "success",
		"data":     payMoney.StringFixed(2),
		"currency": payPalCurrency,
	})
}

func RequestPayPalPay(c *gin.Context) {
	if !isPayPalTopUpEnabled() {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "PayPal 支付未启用"})
		return
	}

	var req payPalPayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "参数错误"})
		return
	}
	if req.PaymentMethod != model.PaymentMethodPayPal {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "不支持的支付渠道"})
		return
	}
	minTopup, maxTopup, err := getPayPalTopUpBounds(
		int64(setting.PayPalMinTopUp),
		operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens,
		common.QuotaPerUnit,
	)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "充值额度配置错误"})
		return
	}
	if req.Amount < minTopup {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": fmt.Sprintf("充值数量不能小于 %d", minTopup)})
		return
	}
	if req.Amount > maxTopup {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": fmt.Sprintf("充值数量不能大于 %d", maxTopup)})
		return
	}
	if req.SuccessURL != "" && common.ValidateRedirectURL(req.SuccessURL) != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "支付成功重定向URL不在可信任域名列表中", "data": ""})
		return
	}
	if req.CancelURL != "" && common.ValidateRedirectURL(req.CancelURL) != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "支付取消重定向URL不在可信任域名列表中", "data": ""})
		return
	}

	userID := c.GetInt("id")
	user, err := model.GetUserById(userID, false)
	if err != nil || user == nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "用户不存在"})
		return
	}
	payMoney := getPayPalPayMoney(req.Amount, user.Group)
	if payMoney.LessThan(decimal.NewFromFloat(0.01)) {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "充值金额过低"})
		return
	}

	if req.SuccessURL == "" {
		req.SuccessURL = paymentReturnPath("/console/topup?paypal=success")
	}
	if req.CancelURL == "" {
		req.CancelURL = paymentReturnPath("/console/topup?paypal=cancelled")
	}
	referenceID := fmt.Sprintf("PAYPAL-%d-%d-%s", userID, time.Now().UnixMilli(), common.GetRandomString(6))
	brandName := strings.TrimSpace(common.SystemName)
	if brandName == "" {
		brandName = "Aivanta"
	}
	brandRunes := []rune(brandName)
	if len(brandRunes) > 127 {
		brandName = string(brandRunes[:127])
	}
	payload := map[string]any{
		"intent": "CAPTURE",
		"purchase_units": []map[string]any{{
			"reference_id": referenceID,
			"invoice_id":   referenceID,
			"description":  "Account balance top-up",
			"amount": map[string]string{
				"currency_code": payPalCurrency,
				"value":         payMoney.StringFixed(2),
			},
		}},
		"application_context": map[string]string{
			"brand_name":          brandName,
			"landing_page":        "LOGIN",
			"shipping_preference": "NO_SHIPPING",
			"user_action":         "PAY_NOW",
			"return_url":          req.SuccessURL,
			"cancel_url":          req.CancelURL,
		},
	}

	var order payPalOrder
	if err := requestPayPalAPI(c.Request.Context(), http.MethodPost, "/v2/checkout/orders", referenceID, payload, &order); err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("PayPal 创建订单失败 user_id=%d amount=%d error=%q", userID, req.Amount, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "拉起支付失败"})
		return
	}
	approveURL := ""
	for _, link := range order.Links {
		if link.Rel == "approve" || link.Rel == "payer-action" {
			approveURL = link.Href
			break
		}
	}
	if order.ID == "" || approveURL == "" {
		logger.LogError(c.Request.Context(), fmt.Sprintf("PayPal 创建订单响应不完整 user_id=%d order_id=%q", userID, order.ID))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "拉起支付失败"})
		return
	}

	topUp := &model.TopUp{
		UserId:          userID,
		Amount:          normalizePayPalTopUpAmount(req.Amount),
		Money:           payMoney.InexactFloat64(),
		TradeNo:         order.ID,
		PaymentMethod:   model.PaymentMethodPayPal,
		PaymentProvider: model.PaymentProviderPayPal,
		PaymentCurrency: payPalCurrency,
		CreateTime:      time.Now().Unix(),
		Status:          common.TopUpStatusPending,
	}
	if err := topUp.Insert(); err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("PayPal 创建本地订单失败 user_id=%d order_id=%s error=%q", userID, order.ID, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "创建订单失败"})
		return
	}
	logger.LogInfo(c.Request.Context(), fmt.Sprintf("PayPal 充值订单创建成功 user_id=%d order_id=%s amount=%d money=%s", userID, order.ID, req.Amount, payMoney.StringFixed(2)))
	c.JSON(http.StatusOK, gin.H{"message": "success", "data": gin.H{"pay_link": approveURL, "order_id": order.ID}})
}

func validatePayPalCapturedOrder(order *payPalOrder, topUp *model.TopUp) error {
	if order == nil || topUp == nil || order.ID == "" || order.ID != topUp.TradeNo {
		return errors.New("PayPal 订单号不匹配")
	}
	if strings.ToUpper(order.Status) != "COMPLETED" {
		return fmt.Errorf("PayPal 订单状态不是 COMPLETED: %s", order.Status)
	}

	total := decimal.Zero
	captureCount := 0
	for _, unit := range order.PurchaseUnits {
		for _, capture := range unit.Payments.Captures {
			if strings.ToUpper(capture.Status) != "COMPLETED" {
				continue
			}
			if strings.ToUpper(capture.Amount.CurrencyCode) != payPalCurrency {
				return fmt.Errorf("PayPal 订单币种不匹配: %s", capture.Amount.CurrencyCode)
			}
			amount, err := decimal.NewFromString(capture.Amount.Value)
			if err != nil {
				return fmt.Errorf("PayPal 收款金额无效: %w", err)
			}
			total = total.Add(amount)
			captureCount++
		}
	}
	if captureCount == 0 {
		return errors.New("PayPal 订单没有已完成的收款")
	}
	expected := decimal.NewFromFloat(topUp.Money).Round(2)
	if !total.Equal(expected) {
		return fmt.Errorf("PayPal 收款金额不匹配: expected=%s actual=%s", expected.StringFixed(2), total.StringFixed(2))
	}
	return nil
}

func capturePayPalOrder(ctx context.Context, orderID string, expectedUserID int, callerIP string) error {
	orderID = strings.TrimSpace(orderID)
	if orderID == "" {
		return errors.New("PayPal 订单号为空")
	}

	LockOrder(orderID)
	defer UnlockOrder(orderID)
	topUp := model.GetTopUpByTradeNo(orderID)
	if topUp == nil {
		return model.ErrTopUpNotFound
	}
	if topUp.PaymentProvider != model.PaymentProviderPayPal {
		return model.ErrPaymentMethodMismatch
	}
	if expectedUserID > 0 && topUp.UserId != expectedUserID {
		return errors.New("无权操作该 PayPal 订单")
	}
	if topUp.Status == common.TopUpStatusSuccess {
		return nil
	}
	if topUp.Status != common.TopUpStatusPending {
		return model.ErrTopUpStatusInvalid
	}

	var order payPalOrder
	capturePath := "/v2/checkout/orders/" + url.PathEscape(orderID) + "/capture"
	err := requestPayPalAPI(ctx, http.MethodPost, capturePath, "capture-"+orderID, map[string]any{}, &order)
	if err != nil {
		orderPath := "/v2/checkout/orders/" + url.PathEscape(orderID)
		if fetchErr := requestPayPalAPI(ctx, http.MethodGet, orderPath, "", nil, &order); fetchErr != nil {
			return fmt.Errorf("PayPal capture failed: %w", err)
		}
	}
	if err := validatePayPalCapturedOrder(&order, topUp); err != nil {
		return err
	}
	return model.RechargePayPal(orderID, callerIP)
}

func CapturePayPalOrder(c *gin.Context) {
	var req payPalCaptureRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "参数错误"})
		return
	}
	if err := capturePayPalOrder(c.Request.Context(), req.OrderID, c.GetInt("id"), c.ClientIP()); err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("PayPal 订单确认失败 user_id=%d order_id=%q error=%q", c.GetInt("id"), req.OrderID, err.Error()))
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "PayPal 付款确认失败，请稍后重试"})
		return
	}
	common.ApiSuccess(c, gin.H{"order_id": strings.TrimSpace(req.OrderID)})
}

func verifyPayPalWebhook(ctx context.Context, headers http.Header, event map[string]any) error {
	payload := map[string]any{
		"auth_algo":         headers.Get("PayPal-Auth-Algo"),
		"cert_url":          headers.Get("PayPal-Cert-Url"),
		"transmission_id":   headers.Get("PayPal-Transmission-Id"),
		"transmission_sig":  headers.Get("PayPal-Transmission-Sig"),
		"transmission_time": headers.Get("PayPal-Transmission-Time"),
		"webhook_id":        strings.TrimSpace(setting.PayPalWebhookID),
		"webhook_event":     event,
	}
	for _, key := range []string{"auth_algo", "cert_url", "transmission_id", "transmission_sig", "transmission_time", "webhook_id"} {
		if strings.TrimSpace(fmt.Sprintf("%v", payload[key])) == "" {
			return fmt.Errorf("PayPal webhook 缺少验签字段: %s", key)
		}
	}

	var verification struct {
		Status string `json:"verification_status"`
	}
	if err := requestPayPalAPI(ctx, http.MethodPost, "/v1/notifications/verify-webhook-signature", "", payload, &verification); err != nil {
		return err
	}
	if strings.ToUpper(verification.Status) != "SUCCESS" {
		return fmt.Errorf("PayPal webhook 验签状态异常: %s", verification.Status)
	}
	return nil
}

func PayPalWebhook(c *gin.Context) {
	ctx := c.Request.Context()
	if !isPayPalWebhookEnabled() {
		logger.LogWarn(ctx, fmt.Sprintf("PayPal webhook 被拒绝 reason=webhook_disabled client_ip=%s", c.ClientIP()))
		c.AbortWithStatus(http.StatusForbidden)
		return
	}
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	var rawEvent map[string]any
	if err := common.Unmarshal(body, &rawEvent); err != nil {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	if err := verifyPayPalWebhook(ctx, c.Request.Header, rawEvent); err != nil {
		logger.LogWarn(ctx, fmt.Sprintf("PayPal webhook 验签失败 client_ip=%s error=%q", c.ClientIP(), err.Error()))
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	var event payPalWebhookEvent
	if err := common.Unmarshal(body, &event); err != nil {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	callerIP := c.ClientIP()
	switch event.EventType {
	case "CHECKOUT.ORDER.APPROVED":
		if err := capturePayPalOrder(ctx, event.Resource.ID, 0, callerIP); err != nil && !errors.Is(err, model.ErrTopUpNotFound) {
			logger.LogError(ctx, fmt.Sprintf("PayPal webhook 自动扣款失败 event_id=%s order_id=%s error=%q", event.ID, event.Resource.ID, err.Error()))
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
	case "PAYMENT.CAPTURE.COMPLETED":
		orderID := event.Resource.SupplementaryData.RelatedIDs.OrderID
		LockOrder(orderID)
		topUp := model.GetTopUpByTradeNo(orderID)
		if topUp != nil && topUp.PaymentProvider == model.PaymentProviderPayPal && topUp.Status == common.TopUpStatusPending {
			expected := decimal.NewFromFloat(topUp.Money).Round(2)
			actual, amountErr := decimal.NewFromString(event.Resource.Amount.Value)
			if strings.ToUpper(event.Resource.Status) != "COMPLETED" || strings.ToUpper(event.Resource.Amount.CurrencyCode) != payPalCurrency || amountErr != nil || !actual.Equal(expected) {
				UnlockOrder(orderID)
				logger.LogWarn(ctx, fmt.Sprintf("PayPal webhook 收款校验失败 event_id=%s order_id=%s status=%s currency=%s value=%s", event.ID, orderID, event.Resource.Status, event.Resource.Amount.CurrencyCode, event.Resource.Amount.Value))
				c.AbortWithStatus(http.StatusBadRequest)
				return
			}
			if err := model.RechargePayPal(orderID, callerIP); err != nil {
				UnlockOrder(orderID)
				logger.LogError(ctx, fmt.Sprintf("PayPal webhook 充值失败 event_id=%s order_id=%s error=%q", event.ID, orderID, err.Error()))
				c.AbortWithStatus(http.StatusInternalServerError)
				return
			}
		}
		UnlockOrder(orderID)
	default:
		logger.LogInfo(ctx, fmt.Sprintf("PayPal webhook 忽略事件 event_id=%s event_type=%s", event.ID, event.EventType))
	}
	c.Status(http.StatusOK)
}
