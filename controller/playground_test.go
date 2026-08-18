package controller

import (
	"bytes"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupPlaygroundStatsTest(t *testing.T) *gorm.DB {
	t.Helper()
	gin.SetMode(gin.TestMode)
	previousDB := model.DB
	previousLogDB := model.LOG_DB
	previousMainDatabaseType := common.MainDatabaseType()
	previousLogDatabaseType := common.LogDatabaseType()
	previousQuotaPerUnit := common.QuotaPerUnit
	previousLogConsumeEnabled := common.LogConsumeEnabled

	dsn := fmt.Sprintf("file:%s?mode=memory&cache=shared", strings.ReplaceAll(t.Name(), "/", "_"))
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&model.Log{}, &model.RelayArchive{}))
	model.DB = db
	model.LOG_DB = db
	common.SetDatabaseTypes(common.DatabaseTypeSQLite, common.DatabaseTypeSQLite)
	common.QuotaPerUnit = 500_000
	common.LogConsumeEnabled = true

	t.Cleanup(func() {
		model.DB = previousDB
		model.LOG_DB = previousLogDB
		common.SetDatabaseTypes(previousMainDatabaseType, previousLogDatabaseType)
		common.QuotaPerUnit = previousQuotaPerUnit
		common.LogConsumeEnabled = previousLogConsumeEnabled
		sqlDB, dbErr := db.DB()
		if dbErr == nil {
			_ = sqlDB.Close()
		}
	})
	return db
}

func callPlaygroundStats(t *testing.T, userId int, requestIds []string) (*httptest.ResponseRecorder, dto.PlaygroundSessionStats) {
	t.Helper()
	payload, err := common.Marshal(dto.PlaygroundSessionStatsRequest{RequestIds: requestIds})
	require.NoError(t, err)
	response := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(response)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/playground/session/stats", bytes.NewReader(payload))
	ctx.Request.Header.Set("Content-Type", "application/json")
	ctx.Set("id", userId)

	GetPlaygroundSessionStats(ctx)

	var envelope struct {
		Success bool                       `json:"success"`
		Data    dto.PlaygroundSessionStats `json:"data"`
	}
	require.NoError(t, common.Unmarshal(response.Body.Bytes(), &envelope))
	require.True(t, envelope.Success)
	return response, envelope.Data
}

func TestGetPlaygroundSessionStatsDeduplicatesAndNormalizesCacheUsage(t *testing.T) {
	db := setupPlaygroundStatsTest(t)
	require.NoError(t, db.Create(&model.Log{
		UserId:           1,
		CreatedAt:        2,
		Type:             model.LogTypeConsume,
		RequestId:        "request-openai",
		PromptTokens:     9_000,
		CompletionTokens: 9_000,
		Quota:            9_000,
		Other:            common.MapToJsonStr(map[string]interface{}{"cache_tokens": 9_000}),
	}).Error)
	logs := []*model.Log{
		{
			UserId:           1,
			CreatedAt:        2,
			Type:             model.LogTypeConsume,
			RequestId:        "request-openai",
			PromptTokens:     100,
			CompletionTokens: 20,
			Quota:            500,
			Other: common.MapToJsonStr(map[string]interface{}{
				"input_tokens_total": 120,
				"cache_tokens":       40,
				"cache_write_tokens": 10,
			}),
		},
		{
			UserId:           1,
			CreatedAt:        2,
			Type:             model.LogTypeConsume,
			RequestId:        "request-claude",
			PromptTokens:     30,
			CompletionTokens: 10,
			Quota:            1_000,
			Other: common.MapToJsonStr(map[string]interface{}{
				"claude":                   true,
				"cache_tokens":             20,
				"cache_creation_tokens_5m": 3,
				"cache_creation_tokens_1h": 2,
			}),
		},
	}
	require.NoError(t, db.Create(logs).Error)

	response, stats := callPlaygroundStats(t, 1, []string{"request-openai", "request-openai", "request-claude"})

	assert.Equal(t, http.StatusOK, response.Code)
	assert.True(t, stats.Settled)
	assert.Equal(t, 2, stats.RequestedRequestCount)
	assert.Equal(t, 2, stats.SettledRequestCount)
	assert.EqualValues(t, 175, stats.InputTokens)
	assert.EqualValues(t, 30, stats.OutputTokens)
	assert.EqualValues(t, 205, stats.TotalTokens)
	assert.EqualValues(t, 60, stats.CacheReadTokens)
	assert.EqualValues(t, 15, stats.CacheWriteTokens)
	assert.EqualValues(t, 60, stats.CachedTokens)
	assert.InDelta(t, float64(60)/175, stats.CacheHitRate, 0.000001)
	assert.EqualValues(t, 1_500, stats.Quota)
	assert.InDelta(t, 0.003, stats.CostUSD, 0.0000001)
}

func TestGetPlaygroundSessionStatsRejectsMoreThanTwoHundredRequestIds(t *testing.T) {
	setupPlaygroundStatsTest(t)
	requestIds := make([]string, 201)
	for index := range requestIds {
		requestIds[index] = fmt.Sprintf("request-%d", index)
	}
	payload, err := common.Marshal(dto.PlaygroundSessionStatsRequest{RequestIds: requestIds})
	require.NoError(t, err)
	response := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(response)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/playground/session/stats", bytes.NewReader(payload))
	ctx.Set("id", 1)

	GetPlaygroundSessionStats(ctx)

	assert.Equal(t, http.StatusBadRequest, response.Code)
	assert.Contains(t, response.Body.String(), "200")
}

func TestGetPlaygroundSessionStatsScopesLogsToAuthenticatedUser(t *testing.T) {
	db := setupPlaygroundStatsTest(t)
	require.NoError(t, db.Create(&model.Log{
		UserId:           2,
		Type:             model.LogTypeConsume,
		RequestId:        "other-users-request",
		PromptTokens:     900,
		CompletionTokens: 100,
		Quota:            50_000,
		Other:            common.MapToJsonStr(map[string]interface{}{"cache_tokens": 500}),
	}).Error)
	require.NoError(t, db.Create(&model.RelayArchive{
		UserId:     2,
		RequestId:  "other-users-request",
		StatusCode: http.StatusBadRequest,
	}).Error)

	_, stats := callPlaygroundStats(t, 1, []string{"other-users-request"})

	assert.False(t, stats.Settled)
	assert.Equal(t, 1, stats.RequestedRequestCount)
	assert.Zero(t, stats.SettledRequestCount)
	assert.Zero(t, stats.InputTokens)
	assert.Zero(t, stats.OutputTokens)
	assert.Zero(t, stats.TotalTokens)
	assert.Zero(t, stats.CacheReadTokens)
	assert.Zero(t, stats.Quota)
	assert.Zero(t, stats.CostUSD)
}

func TestGetPlaygroundSessionStatsTreatsArchivedFailureAsSettledWithoutCharge(t *testing.T) {
	db := setupPlaygroundStatsTest(t)
	require.NoError(t, db.Create(&model.RelayArchive{
		UserId:     1,
		RequestId:  "failed-request",
		StatusCode: http.StatusBadRequest,
	}).Error)

	_, stats := callPlaygroundStats(t, 1, []string{"failed-request"})

	assert.True(t, stats.Settled)
	assert.Equal(t, 1, stats.RequestedRequestCount)
	assert.Equal(t, 1, stats.SettledRequestCount)
	assert.Zero(t, stats.TotalTokens)
	assert.Zero(t, stats.CachedTokens)
	assert.Zero(t, stats.Quota)
	assert.Zero(t, stats.CostUSD)
}

func TestGetPlaygroundSessionStatsWaitsForConsumeLogAfterSuccessfulArchive(t *testing.T) {
	db := setupPlaygroundStatsTest(t)
	require.NoError(t, db.Create(&model.RelayArchive{
		UserId:     1,
		RequestId:  "successful-request-without-consume-log",
		StatusCode: http.StatusOK,
	}).Error)

	_, stats := callPlaygroundStats(t, 1, []string{"successful-request-without-consume-log"})

	assert.False(t, stats.Settled)
	assert.Zero(t, stats.SettledRequestCount)
	assert.Zero(t, stats.CostUSD)
}

func TestGetPlaygroundSessionStatsTreatsDisconnectedStreamAsSettled(t *testing.T) {
	db := setupPlaygroundStatsTest(t)
	require.NoError(t, db.Create(&model.RelayArchive{
		UserId:       1,
		RequestId:    "disconnected-stream",
		StatusCode:   http.StatusOK,
		CaptureError: "client_disconnected,response_write_failed",
	}).Error)

	_, stats := callPlaygroundStats(t, 1, []string{"disconnected-stream"})

	assert.True(t, stats.Settled)
	assert.Equal(t, 1, stats.SettledRequestCount)
	assert.Zero(t, stats.CostUSD)
}

func TestGetPlaygroundSessionStatsReportsUnavailableWhenConsumeLoggingIsDisabled(t *testing.T) {
	setupPlaygroundStatsTest(t)
	common.LogConsumeEnabled = false
	payload, err := common.Marshal(dto.PlaygroundSessionStatsRequest{RequestIds: []string{"request-id"}})
	require.NoError(t, err)
	response := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(response)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/playground/session/stats", bytes.NewReader(payload))
	ctx.Set("id", 1)

	GetPlaygroundSessionStats(ctx)

	var envelope struct {
		Success bool   `json:"success"`
		Message string `json:"message"`
	}
	require.NoError(t, common.Unmarshal(response.Body.Bytes(), &envelope))
	assert.False(t, envelope.Success)
	assert.Contains(t, envelope.Message, "disabled")
}
