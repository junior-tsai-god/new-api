package controller

import (
	"context"
	"errors"
	"fmt"
	"io"
	"math"
	"net/http"
	"strconv"
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
	"github.com/stripe/stripe-go/v81"
	"github.com/stripe/stripe-go/v81/checkout/session"
	stripeprice "github.com/stripe/stripe-go/v81/price"
	"github.com/stripe/stripe-go/v81/webhook"
	"github.com/thanhpk/randstr"
)

var stripeAdaptor = &StripeAdaptor{}

const (
	maxStripeTopUpCredits = int64(10000)
	stripePriceCacheTTL   = 5 * time.Minute
)

type stripeTopUpPriceMetadata struct {
	Currency        string
	ProductID       string
	UnitAmountMinor decimal.Decimal
}

type stripeTopUpPricingInput struct {
	CreditAmount    int64
	Currency        string
	ProductID       string
	UnitAmountMinor decimal.Decimal
	GroupRatio      decimal.Decimal
	Discount        decimal.Decimal
}

type stripeTopUpQuote struct {
	CreditAmount     int64
	Currency         string
	CurrencyExponent int32
	ProductID        string
	MinorAmount      int64
	MajorAmount      decimal.Decimal
}

var stripeTopUpPriceCache struct {
	sync.RWMutex
	key       string
	value     stripeTopUpPriceMetadata
	expiresAt time.Time
}

// StripePayRequest represents a payment request for Stripe checkout.
type StripePayRequest struct {
	// Amount is the quantity of units to purchase.
	Amount int64 `json:"amount"`
	// PaymentMethod specifies the payment method (e.g., "stripe").
	PaymentMethod string `json:"payment_method"`
	// SuccessURL is the optional custom URL to redirect after successful payment.
	// If empty, defaults to the server's console log page.
	SuccessURL string `json:"success_url,omitempty"`
	// CancelURL is the optional custom URL to redirect when payment is canceled.
	// If empty, defaults to the server's console topup page.
	CancelURL string `json:"cancel_url,omitempty"`
}

type StripeAdaptor struct {
}

func normalizeStripeTopUpCredit(requestAmount int64, tokenDisplay bool, quotaPerUnit decimal.Decimal) (int64, error) {
	if requestAmount <= 0 {
		return 0, errors.New("充值额度必须大于 0")
	}

	creditAmount := decimal.NewFromInt(requestAmount)
	if tokenDisplay {
		if quotaPerUnit.LessThanOrEqual(decimal.Zero) {
			return 0, errors.New("额度单位配置错误")
		}
		creditAmount = creditAmount.Div(quotaPerUnit)
	}
	if !creditAmount.Equal(creditAmount.Truncate(0)) {
		return 0, errors.New("充值额度必须是完整的美元额度单位")
	}
	if creditAmount.GreaterThan(decimal.NewFromInt(math.MaxInt64)) {
		return 0, errors.New("充值额度超出范围")
	}

	normalized := creditAmount.IntPart()
	if normalized <= 0 {
		return 0, errors.New("充值额度必须大于 0")
	}
	return normalized, nil
}

func stripeCurrencyExponent(currency string) (int32, error) {
	normalized := strings.ToUpper(strings.TrimSpace(currency))
	if len(normalized) != 3 {
		return 0, errors.New("Stripe 币种配置无效")
	}
	for _, char := range normalized {
		if char < 'A' || char > 'Z' {
			return 0, errors.New("Stripe 币种配置无效")
		}
	}

	switch normalized {
	case "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF":
		return 0, nil
	case "BHD", "JOD", "KWD", "OMR", "TND":
		return 3, nil
	default:
		return 2, nil
	}
}

func stripeMoneyFromMinorUnits(minorAmount int64, currency string) (decimal.Decimal, int32, error) {
	if minorAmount < 0 {
		return decimal.Zero, 0, errors.New("Stripe 支付金额不能为负数")
	}
	exponent, err := stripeCurrencyExponent(currency)
	if err != nil {
		return decimal.Zero, 0, err
	}
	return decimal.NewFromInt(minorAmount).Shift(-exponent), exponent, nil
}

func calculateStripeTopUpQuote(input stripeTopUpPricingInput) (stripeTopUpQuote, error) {
	if input.CreditAmount <= 0 {
		return stripeTopUpQuote{}, errors.New("充值额度必须大于 0")
	}
	if input.CreditAmount > maxStripeTopUpCredits {
		return stripeTopUpQuote{}, fmt.Errorf("充值额度不能大于 %d", maxStripeTopUpCredits)
	}
	if input.UnitAmountMinor.LessThanOrEqual(decimal.Zero) {
		return stripeTopUpQuote{}, errors.New("Stripe Price 单价必须大于 0")
	}
	if input.GroupRatio.LessThanOrEqual(decimal.Zero) {
		return stripeTopUpQuote{}, errors.New("用户分组充值倍率必须大于 0")
	}
	if input.Discount.LessThanOrEqual(decimal.Zero) {
		return stripeTopUpQuote{}, errors.New("充值折扣必须大于 0")
	}
	if strings.TrimSpace(input.ProductID) == "" {
		return stripeTopUpQuote{}, errors.New("Stripe Price 未关联有效产品")
	}

	currency := strings.ToUpper(strings.TrimSpace(input.Currency))
	minorDecimal := input.UnitAmountMinor.
		Mul(decimal.NewFromInt(input.CreditAmount)).
		Mul(input.GroupRatio).
		Mul(input.Discount).
		Round(0)
	if minorDecimal.LessThanOrEqual(decimal.Zero) {
		return stripeTopUpQuote{}, errors.New("Stripe 支付金额过低")
	}
	if minorDecimal.GreaterThan(decimal.NewFromInt(math.MaxInt64)) {
		return stripeTopUpQuote{}, errors.New("Stripe 支付金额超出范围")
	}

	minorAmount := minorDecimal.IntPart()
	majorAmount, exponent, err := stripeMoneyFromMinorUnits(minorAmount, currency)
	if err != nil {
		return stripeTopUpQuote{}, err
	}
	return stripeTopUpQuote{
		CreditAmount:     input.CreditAmount,
		Currency:         currency,
		CurrencyExponent: exponent,
		ProductID:        strings.TrimSpace(input.ProductID),
		MinorAmount:      minorAmount,
		MajorAmount:      majorAmount,
	}, nil
}

func getStripeTopUpPriceMetadata(ctx context.Context) (stripeTopUpPriceMetadata, error) {
	apiSecret := strings.TrimSpace(setting.StripeApiSecret)
	priceID := strings.TrimSpace(setting.StripePriceId)
	if (!strings.HasPrefix(apiSecret, "sk_") && !strings.HasPrefix(apiSecret, "rk_")) || priceID == "" {
		return stripeTopUpPriceMetadata{}, errors.New("Stripe 配置不完整")
	}

	cacheKey := common.Sha1([]byte(apiSecret + "\x00" + priceID))
	now := time.Now()
	stripeTopUpPriceCache.RLock()
	if stripeTopUpPriceCache.key == cacheKey && now.Before(stripeTopUpPriceCache.expiresAt) {
		value := stripeTopUpPriceCache.value
		stripeTopUpPriceCache.RUnlock()
		return value, nil
	}
	stripeTopUpPriceCache.RUnlock()

	params := &stripe.PriceParams{}
	params.Context = ctx
	priceClient := stripeprice.Client{B: stripe.GetBackend(stripe.APIBackend), Key: apiSecret}
	stripePrice, err := priceClient.Get(priceID, params)
	if err != nil {
		return stripeTopUpPriceMetadata{}, fmt.Errorf("获取 Stripe Price 失败: %w", err)
	}
	if stripePrice == nil || stripePrice.Deleted || !stripePrice.Active {
		return stripeTopUpPriceMetadata{}, errors.New("Stripe Price 不可用")
	}
	if stripePrice.BillingScheme != stripe.PriceBillingSchemePerUnit || stripePrice.Type != stripe.PriceTypeOneTime {
		return stripeTopUpPriceMetadata{}, errors.New("Stripe Price 必须是一次性固定单价")
	}
	if stripePrice.Product == nil || strings.TrimSpace(stripePrice.Product.ID) == "" {
		return stripeTopUpPriceMetadata{}, errors.New("Stripe Price 未关联有效产品")
	}

	unitAmountMinor := decimal.NewFromInt(stripePrice.UnitAmount)
	if stripePrice.UnitAmountDecimal > 0 {
		if math.IsNaN(stripePrice.UnitAmountDecimal) || math.IsInf(stripePrice.UnitAmountDecimal, 0) {
			return stripeTopUpPriceMetadata{}, errors.New("Stripe Price 单价无效")
		}
		unitAmountMinor = decimal.NewFromFloat(stripePrice.UnitAmountDecimal)
	}
	if unitAmountMinor.LessThanOrEqual(decimal.Zero) {
		return stripeTopUpPriceMetadata{}, errors.New("Stripe Price 单价必须大于 0")
	}

	currency := strings.ToUpper(strings.TrimSpace(string(stripePrice.Currency)))
	if _, err := stripeCurrencyExponent(currency); err != nil {
		return stripeTopUpPriceMetadata{}, err
	}
	metadata := stripeTopUpPriceMetadata{
		Currency:        currency,
		ProductID:       strings.TrimSpace(stripePrice.Product.ID),
		UnitAmountMinor: unitAmountMinor,
	}

	stripeTopUpPriceCache.Lock()
	stripeTopUpPriceCache.key = cacheKey
	stripeTopUpPriceCache.value = metadata
	stripeTopUpPriceCache.expiresAt = now.Add(stripePriceCacheTTL)
	stripeTopUpPriceCache.Unlock()
	return metadata, nil
}

func getStripeTopUpDiscount(requestAmount int64) (decimal.Decimal, error) {
	discount := 1.0
	if configured, ok := operation_setting.GetPaymentSetting().AmountDiscount[int(requestAmount)]; ok && configured > 0 {
		discount = configured
	}
	if math.IsNaN(discount) || math.IsInf(discount, 0) {
		return decimal.Zero, errors.New("充值折扣配置错误")
	}
	return decimal.NewFromFloat(discount), nil
}

func getStripeTopUpQuote(ctx context.Context, requestAmount int64, group string) (stripeTopUpQuote, error) {
	tokenDisplay := operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens
	requestLimit, err := getTopUpRequestAmountLimit(maxStripeTopUpCredits, tokenDisplay, common.QuotaPerUnit)
	if err != nil {
		return stripeTopUpQuote{}, errors.New("额度单位配置错误")
	}
	if requestAmount > requestLimit {
		return stripeTopUpQuote{}, fmt.Errorf("充值数量不能大于 %d", requestLimit)
	}
	quotaPerUnit := decimal.NewFromInt(1)
	if tokenDisplay {
		if common.QuotaPerUnit <= 0 || math.IsNaN(common.QuotaPerUnit) || math.IsInf(common.QuotaPerUnit, 0) {
			return stripeTopUpQuote{}, errors.New("额度单位配置错误")
		}
		quotaPerUnit = decimal.NewFromFloat(common.QuotaPerUnit)
	}
	creditAmount, err := normalizeStripeTopUpCredit(requestAmount, tokenDisplay, quotaPerUnit)
	if err != nil {
		return stripeTopUpQuote{}, err
	}

	groupRatio := common.GetTopupGroupRatio(group)
	if groupRatio == 0 {
		groupRatio = 1
	}
	if groupRatio <= 0 || math.IsNaN(groupRatio) || math.IsInf(groupRatio, 0) {
		return stripeTopUpQuote{}, errors.New("用户分组充值倍率配置错误")
	}
	discount, err := getStripeTopUpDiscount(requestAmount)
	if err != nil {
		return stripeTopUpQuote{}, err
	}

	metadata, err := getStripeTopUpPriceMetadata(ctx)
	if err != nil {
		return stripeTopUpQuote{}, err
	}
	return calculateStripeTopUpQuote(stripeTopUpPricingInput{
		CreditAmount:    creditAmount,
		Currency:        metadata.Currency,
		ProductID:       metadata.ProductID,
		UnitAmountMinor: metadata.UnitAmountMinor,
		GroupRatio:      decimal.NewFromFloat(groupRatio),
		Discount:        discount,
	})
}

func (*StripeAdaptor) RequestAmount(c *gin.Context, req *StripePayRequest) {
	if req.Amount < getStripeMinTopup() {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": fmt.Sprintf("充值数量不能小于 %d", getStripeMinTopup())})
		return
	}
	id := c.GetInt("id")
	group, err := model.GetUserGroup(id, true)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "获取用户分组失败"})
		return
	}
	quote, err := getStripeTopUpQuote(c.Request.Context(), req.Amount, group)
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("Stripe 获取充值报价失败 user_id=%d amount=%d error=%q", id, req.Amount, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "获取支付报价失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message":  "success",
		"data":     quote.MajorAmount.StringFixed(quote.CurrencyExponent),
		"currency": quote.Currency,
	})
}

func (*StripeAdaptor) RequestPay(c *gin.Context, req *StripePayRequest) {
	if req.PaymentMethod != model.PaymentMethodStripe {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "不支持的支付渠道"})
		return
	}
	if req.Amount < getStripeMinTopup() {
		c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("充值数量不能小于 %d", getStripeMinTopup()), "data": 10})
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

	id := c.GetInt("id")
	user, err := model.GetUserById(id, false)
	if err != nil || user == nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "获取用户信息失败"})
		return
	}
	quote, err := getStripeTopUpQuote(c.Request.Context(), req.Amount, user.Group)
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("Stripe 获取充值报价失败 user_id=%d amount=%d error=%q", id, req.Amount, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "获取支付报价失败"})
		return
	}

	reference := fmt.Sprintf("new-api-ref-%d-%d-%s", user.Id, time.Now().UnixMilli(), randstr.String(4))
	referenceId := "ref_" + common.Sha1([]byte(reference))

	payLink, err := genStripeLink(c.Request.Context(), referenceId, user.StripeCustomer, user.Email, quote, req.SuccessURL, req.CancelURL)
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("Stripe 创建 Checkout Session 失败 user_id=%d trade_no=%s credit_amount=%d amount_minor=%d currency=%s error=%q", id, referenceId, quote.CreditAmount, quote.MinorAmount, quote.Currency, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "拉起支付失败"})
		return
	}

	topUp := &model.TopUp{
		UserId:          id,
		Amount:          quote.CreditAmount,
		CreditAmount:    decimal.NewFromInt(quote.CreditAmount).InexactFloat64(),
		Money:           quote.MajorAmount.InexactFloat64(),
		TradeNo:         referenceId,
		PaymentMethod:   model.PaymentMethodStripe,
		PaymentProvider: model.PaymentProviderStripe,
		PaymentCurrency: quote.Currency,
		CreateTime:      time.Now().Unix(),
		Status:          common.TopUpStatusPending,
	}
	err = topUp.Insert()
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("Stripe 创建充值订单失败 user_id=%d trade_no=%s credit_amount=%d amount_minor=%d currency=%s error=%q", id, referenceId, quote.CreditAmount, quote.MinorAmount, quote.Currency, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "创建订单失败"})
		return
	}
	logger.LogInfo(c.Request.Context(), fmt.Sprintf("Stripe 充值订单创建成功 user_id=%d trade_no=%s credit_amount=%d amount_minor=%d currency=%s", id, referenceId, quote.CreditAmount, quote.MinorAmount, quote.Currency))
	c.JSON(http.StatusOK, gin.H{
		"message": "success",
		"data": gin.H{
			"pay_link": payLink,
		},
	})
}

func RequestStripeAmount(c *gin.Context) {
	var req StripePayRequest
	err := c.ShouldBindJSON(&req)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "参数错误"})
		return
	}
	stripeAdaptor.RequestAmount(c, &req)
}

func RequestStripePay(c *gin.Context) {
	var req StripePayRequest
	err := c.ShouldBindJSON(&req)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "参数错误"})
		return
	}
	stripeAdaptor.RequestPay(c, &req)
}

func StripeWebhook(c *gin.Context) {
	ctx := c.Request.Context()
	if !isStripeWebhookEnabled() {
		logger.LogWarn(ctx, fmt.Sprintf("Stripe webhook 被拒绝 reason=webhook_disabled path=%q client_ip=%s", c.Request.RequestURI, c.ClientIP()))
		c.AbortWithStatus(http.StatusForbidden)
		return
	}

	payload, err := io.ReadAll(c.Request.Body)
	if err != nil {
		logger.LogError(ctx, fmt.Sprintf("Stripe webhook 读取请求体失败 path=%q client_ip=%s error=%q", c.Request.RequestURI, c.ClientIP(), err.Error()))
		c.AbortWithStatus(http.StatusServiceUnavailable)
		return
	}

	signature := c.GetHeader("Stripe-Signature")
	logger.LogInfo(ctx, fmt.Sprintf("Stripe webhook 收到请求 path=%q client_ip=%s signature=%q body=%q", c.Request.RequestURI, c.ClientIP(), signature, string(payload)))
	event, err := webhook.ConstructEventWithOptions(payload, signature, setting.StripeWebhookSecret, webhook.ConstructEventOptions{
		IgnoreAPIVersionMismatch: true,
	})

	if err != nil {
		logger.LogWarn(ctx, fmt.Sprintf("Stripe webhook 验签失败 path=%q client_ip=%s error=%q", c.Request.RequestURI, c.ClientIP(), err.Error()))
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	callerIp := c.ClientIP()
	logger.LogInfo(ctx, fmt.Sprintf("Stripe webhook 验签成功 event_type=%s client_ip=%s path=%q", string(event.Type), callerIp, c.Request.RequestURI))
	switch event.Type {
	case stripe.EventTypeCheckoutSessionCompleted:
		sessionCompleted(ctx, event, callerIp)
	case stripe.EventTypeCheckoutSessionExpired:
		sessionExpired(ctx, event)
	case stripe.EventTypeCheckoutSessionAsyncPaymentSucceeded:
		sessionAsyncPaymentSucceeded(ctx, event, callerIp)
	case stripe.EventTypeCheckoutSessionAsyncPaymentFailed:
		sessionAsyncPaymentFailed(ctx, event, callerIp)
	default:
		logger.LogInfo(ctx, fmt.Sprintf("Stripe webhook 忽略事件 event_type=%s client_ip=%s", string(event.Type), callerIp))
	}

	c.Status(http.StatusOK)
}

func sessionCompleted(ctx context.Context, event stripe.Event, callerIp string) {
	customerId := event.GetObjectValue("customer")
	referenceId := event.GetObjectValue("client_reference_id")
	status := event.GetObjectValue("status")
	if "complete" != status {
		logger.LogWarn(ctx, fmt.Sprintf("Stripe checkout.completed 状态异常，忽略处理 trade_no=%s status=%s client_ip=%s", referenceId, status, callerIp))
		return
	}

	paymentStatus := event.GetObjectValue("payment_status")
	if paymentStatus != "paid" && paymentStatus != "no_payment_required" {
		logger.LogInfo(ctx, fmt.Sprintf("Stripe Checkout 支付未完成，等待异步结果 trade_no=%s payment_status=%s client_ip=%s", referenceId, paymentStatus, callerIp))
		return
	}

	fulfillOrder(ctx, event, referenceId, customerId, callerIp)
}

// sessionAsyncPaymentSucceeded handles delayed payment methods (bank transfer, SEPA, etc.)
// that confirm payment after the checkout session completes.
func sessionAsyncPaymentSucceeded(ctx context.Context, event stripe.Event, callerIp string) {
	customerId := event.GetObjectValue("customer")
	referenceId := event.GetObjectValue("client_reference_id")
	logger.LogInfo(ctx, fmt.Sprintf("Stripe 异步支付成功 trade_no=%s client_ip=%s", referenceId, callerIp))

	fulfillOrder(ctx, event, referenceId, customerId, callerIp)
}

// sessionAsyncPaymentFailed marks orders as failed when delayed payment methods
// ultimately fail (e.g. bank transfer not received, SEPA rejected).
func sessionAsyncPaymentFailed(ctx context.Context, event stripe.Event, callerIp string) {
	referenceId := event.GetObjectValue("client_reference_id")
	logger.LogWarn(ctx, fmt.Sprintf("Stripe 异步支付失败 trade_no=%s client_ip=%s", referenceId, callerIp))

	if len(referenceId) == 0 {
		logger.LogWarn(ctx, fmt.Sprintf("Stripe 异步支付失败事件缺少订单号 client_ip=%s", callerIp))
		return
	}

	LockOrder(referenceId)
	defer UnlockOrder(referenceId)

	topUp := model.GetTopUpByTradeNo(referenceId)
	if topUp == nil {
		logger.LogWarn(ctx, fmt.Sprintf("Stripe 异步支付失败但本地订单不存在 trade_no=%s client_ip=%s", referenceId, callerIp))
		return
	}

	if !topUp.MatchesPaymentProvider(model.PaymentProviderStripe) {
		logger.LogWarn(ctx, fmt.Sprintf("Stripe 异步支付失败但订单支付网关不匹配 trade_no=%s payment_provider=%s client_ip=%s", referenceId, topUp.PaymentProvider, callerIp))
		return
	}

	if topUp.Status != common.TopUpStatusPending {
		logger.LogInfo(ctx, fmt.Sprintf("Stripe 异步支付失败但订单状态非 pending，忽略处理 trade_no=%s status=%s client_ip=%s", referenceId, topUp.Status, callerIp))
		return
	}

	topUp.Status = common.TopUpStatusFailed
	if err := topUp.Update(); err != nil {
		logger.LogError(ctx, fmt.Sprintf("Stripe 标记充值订单失败状态失败 trade_no=%s client_ip=%s error=%q", referenceId, callerIp, err.Error()))
		return
	}
	logger.LogInfo(ctx, fmt.Sprintf("Stripe 充值订单已标记为失败 trade_no=%s client_ip=%s", referenceId, callerIp))
}

// fulfillOrder is the shared logic for crediting quota after payment is confirmed.
func fulfillOrder(ctx context.Context, event stripe.Event, referenceId string, customerId string, callerIp string) {
	if len(referenceId) == 0 {
		logger.LogWarn(ctx, fmt.Sprintf("Stripe 完成订单时缺少订单号 client_ip=%s", callerIp))
		return
	}

	LockOrder(referenceId)
	defer UnlockOrder(referenceId)
	payload := map[string]any{
		"customer":     customerId,
		"amount_total": event.GetObjectValue("amount_total"),
		"currency":     strings.ToUpper(event.GetObjectValue("currency")),
		"event_type":   string(event.Type),
	}
	if err := model.CompleteSubscriptionOrder(referenceId, common.GetJsonString(payload), model.PaymentProviderStripe, ""); err == nil {
		logger.LogInfo(ctx, fmt.Sprintf("Stripe 订阅订单处理成功 trade_no=%s event_type=%s client_ip=%s", referenceId, string(event.Type), callerIp))
		return
	} else if err != nil && !errors.Is(err, model.ErrSubscriptionOrderNotFound) {
		logger.LogError(ctx, fmt.Sprintf("Stripe 订阅订单处理失败 trade_no=%s event_type=%s client_ip=%s error=%q", referenceId, string(event.Type), callerIp, err.Error()))
		return
	}

	currency, err := model.NormalizePaymentCurrency(event.GetObjectValue("currency"))
	if err != nil || currency == "" {
		logger.LogError(ctx, fmt.Sprintf("Stripe 充值事件币种无效 trade_no=%s event_type=%s client_ip=%s currency=%q error=%q", referenceId, string(event.Type), callerIp, event.GetObjectValue("currency"), err))
		return
	}
	amountTotal, err := strconv.ParseInt(event.GetObjectValue("amount_total"), 10, 64)
	if err != nil || amountTotal < 0 {
		logger.LogError(ctx, fmt.Sprintf("Stripe 充值事件金额无效 trade_no=%s event_type=%s client_ip=%s amount_total=%q error=%q", referenceId, string(event.Type), callerIp, event.GetObjectValue("amount_total"), err))
		return
	}
	paidMoney, exponent, err := stripeMoneyFromMinorUnits(amountTotal, currency)
	if err != nil {
		logger.LogError(ctx, fmt.Sprintf("Stripe 充值事件金额换算失败 trade_no=%s event_type=%s client_ip=%s amount_total=%d currency=%s error=%q", referenceId, string(event.Type), callerIp, amountTotal, currency, err.Error()))
		return
	}
	err = model.Recharge(referenceId, customerId, callerIp, paidMoney.InexactFloat64(), currency)
	if err != nil {
		logger.LogError(ctx, fmt.Sprintf("Stripe 充值处理失败 trade_no=%s event_type=%s client_ip=%s error=%q", referenceId, string(event.Type), callerIp, err.Error()))
		return
	}

	logger.LogInfo(ctx, fmt.Sprintf("Stripe 充值成功 trade_no=%s amount_total=%s currency=%s event_type=%s client_ip=%s", referenceId, paidMoney.StringFixed(exponent), currency, string(event.Type), callerIp))
}

func sessionExpired(ctx context.Context, event stripe.Event) {
	referenceId := event.GetObjectValue("client_reference_id")
	status := event.GetObjectValue("status")
	if "expired" != status {
		logger.LogWarn(ctx, fmt.Sprintf("Stripe checkout.expired 状态异常，忽略处理 trade_no=%s status=%s", referenceId, status))
		return
	}

	if len(referenceId) == 0 {
		logger.LogWarn(ctx, "Stripe checkout.expired 缺少订单号")
		return
	}

	// Subscription order expiration
	LockOrder(referenceId)
	defer UnlockOrder(referenceId)
	if err := model.ExpireSubscriptionOrder(referenceId, model.PaymentProviderStripe); err == nil {
		logger.LogInfo(ctx, fmt.Sprintf("Stripe 订阅订单已过期 trade_no=%s", referenceId))
		return
	} else if err != nil && !errors.Is(err, model.ErrSubscriptionOrderNotFound) {
		logger.LogError(ctx, fmt.Sprintf("Stripe 订阅订单过期处理失败 trade_no=%s error=%q", referenceId, err.Error()))
		return
	}

	err := model.UpdatePendingTopUpStatus(referenceId, model.PaymentProviderStripe, common.TopUpStatusExpired)
	if errors.Is(err, model.ErrTopUpNotFound) {
		logger.LogWarn(ctx, fmt.Sprintf("Stripe 充值订单不存在，无法标记过期 trade_no=%s", referenceId))
		return
	}
	if err != nil {
		logger.LogError(ctx, fmt.Sprintf("Stripe 充值订单过期处理失败 trade_no=%s error=%q", referenceId, err.Error()))
		return
	}

	logger.LogInfo(ctx, fmt.Sprintf("Stripe 充值订单已过期 trade_no=%s", referenceId))
}

// genStripeLink generates a Stripe Checkout session URL for payment.
// It creates a new checkout session with the specified parameters and returns the payment URL.
//
// Parameters:
//   - referenceId: unique reference identifier for the transaction
//   - customerId: existing Stripe customer ID (empty string if new customer)
//   - email: customer email address for new customer creation
//   - quote: final amount and currency shown to the user and sent to Stripe
//   - successURL: custom URL to redirect after successful payment (empty for default)
//   - cancelURL: custom URL to redirect when payment is canceled (empty for default)
//
// Returns the checkout session URL or an error if the session creation fails.
func genStripeLink(ctx context.Context, referenceId string, customerId string, email string, quote stripeTopUpQuote, successURL string, cancelURL string) (string, error) {
	apiSecret := strings.TrimSpace(setting.StripeApiSecret)
	if !strings.HasPrefix(apiSecret, "sk_") && !strings.HasPrefix(apiSecret, "rk_") {
		return "", fmt.Errorf("无效的Stripe API密钥")
	}
	if quote.MinorAmount <= 0 || quote.Currency == "" || quote.ProductID == "" {
		return "", errors.New("Stripe 支付报价无效")
	}

	// Use custom URLs if provided, otherwise use defaults
	if successURL == "" {
		successURL = paymentReturnPath("/usage-logs")
	}
	if cancelURL == "" {
		cancelURL = paymentReturnPath("/wallet")
	}

	params := &stripe.CheckoutSessionParams{
		ClientReferenceID: stripe.String(referenceId),
		SuccessURL:        stripe.String(successURL),
		CancelURL:         stripe.String(cancelURL),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
					Currency:   stripe.String(strings.ToLower(quote.Currency)),
					Product:    stripe.String(quote.ProductID),
					UnitAmount: stripe.Int64(quote.MinorAmount),
				},
				Quantity: stripe.Int64(1),
			},
		},
		Mode:                stripe.String(string(stripe.CheckoutSessionModePayment)),
		AllowPromotionCodes: stripe.Bool(setting.StripePromotionCodesEnabled),
	}
	params.Context = ctx
	params.AddMetadata("credit_amount_usd", strconv.FormatInt(quote.CreditAmount, 10))

	if "" == customerId {
		if "" != email {
			params.CustomerEmail = stripe.String(email)
		}

		params.CustomerCreation = stripe.String(string(stripe.CheckoutSessionCustomerCreationAlways))
	} else {
		params.Customer = stripe.String(customerId)
	}

	sessionClient := session.Client{B: stripe.GetBackend(stripe.APIBackend), Key: apiSecret}
	result, err := sessionClient.New(params)
	if err != nil {
		return "", err
	}

	return result.URL, nil
}

func getStripeMinTopup() int64 {
	minTopup := decimal.NewFromInt(int64(setting.StripeMinTopUp))
	if operation_setting.GetQuotaDisplayType() != operation_setting.QuotaDisplayTypeTokens {
		return minTopup.IntPart()
	}
	if common.QuotaPerUnit <= 0 || math.IsNaN(common.QuotaPerUnit) || math.IsInf(common.QuotaPerUnit, 0) {
		return math.MaxInt64
	}
	minTopup = minTopup.Mul(decimal.NewFromFloat(common.QuotaPerUnit))
	if minTopup.GreaterThan(decimal.NewFromInt(math.MaxInt64)) {
		return math.MaxInt64
	}
	return minTopup.IntPart()
}
