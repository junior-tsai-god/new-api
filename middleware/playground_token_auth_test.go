package middleware

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupPlaygroundTokenAuthTest(t *testing.T) (*model.User, *model.User, *model.Token) {
	t.Helper()
	gin.SetMode(gin.TestMode)
	previousDB := model.DB
	previousDatabaseType := common.MainDatabaseType()
	previousRedisEnabled := common.RedisEnabled
	previousRelayArchiveSecret := common.RelayArchiveSecret
	previousRelayArchiveMaxBodyBytes := common.RelayArchiveMaxBodyBytes

	dsn := fmt.Sprintf("file:%s?mode=memory&cache=shared", strings.ReplaceAll(t.Name(), "/", "_"))
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(
		&model.User{},
		&model.Token{},
		&model.RelayArchive{},
		&model.RelayArchiveChunk{},
	))
	model.DB = db
	common.SetMainDatabaseType(common.DatabaseTypeSQLite)
	common.RedisEnabled = false
	common.RelayArchiveSecret = "playground-token-auth-test-secret"
	common.RelayArchiveMaxBodyBytes = 64 * 1024

	owner := &model.User{
		Username: "playground-token-owner",
		Password: "password-placeholder",
		Role:     common.RoleCommonUser,
		Status:   common.UserStatusEnabled,
		Group:    "default",
		Quota:    1_000_000,
		AffCode:  "pg-token-owner",
	}
	otherUser := &model.User{
		Username: "playground-other-user",
		Password: "password-placeholder",
		Role:     common.RoleCommonUser,
		Status:   common.UserStatusEnabled,
		Group:    "default",
		Quota:    1_000_000,
		AffCode:  "pg-token-other",
	}
	require.NoError(t, db.Create(owner).Error)
	require.NoError(t, db.Create(otherUser).Error)
	token := &model.Token{
		UserId:             owner.Id,
		Key:                "playground-owned-token-key",
		Status:             common.TokenStatusEnabled,
		Name:               "playground token",
		ExpiredTime:        -1,
		RemainQuota:        500_000,
		ModelLimitsEnabled: true,
		ModelLimits:        "gpt-test",
	}
	require.NoError(t, db.Create(token).Error)

	t.Cleanup(func() {
		model.DB = previousDB
		common.SetMainDatabaseType(previousDatabaseType)
		common.RedisEnabled = previousRedisEnabled
		common.RelayArchiveSecret = previousRelayArchiveSecret
		common.RelayArchiveMaxBodyBytes = previousRelayArchiveMaxBodyBytes
		sqlDB, dbErr := db.DB()
		if dbErr == nil {
			_ = sqlDB.Close()
		}
	})
	return owner, otherUser, token
}

func TestPlaygroundTokenAuthRejectsTokenOwnedByAnotherUser(t *testing.T) {
	_, otherUser, token := setupPlaygroundTokenAuthTest(t)

	router := gin.New()
	router.POST("/pg/chat/completions", func(c *gin.Context) {
		c.Set("id", otherUser.Id)
		c.Next()
	}, PlaygroundTokenAuth(), func(c *gin.Context) {
		c.Status(http.StatusNoContent)
	})
	request := httptest.NewRequest(http.MethodPost, "/pg/chat/completions", nil)
	request.Header.Set(common.PlaygroundTokenIdHeader, strconv.Itoa(token.Id))
	response := httptest.NewRecorder()

	router.ServeHTTP(response, request)

	assert.Equal(t, http.StatusForbidden, response.Code)
	assert.Contains(t, response.Body.String(), string("access_denied"))
}

func TestPlaygroundTokenAuthAppliesOwnedTokenRestrictions(t *testing.T) {
	owner, _, token := setupPlaygroundTokenAuthTest(t)

	router := gin.New()
	router.POST("/pg/chat/completions", func(c *gin.Context) {
		c.Set("id", owner.Id)
		c.Next()
	}, PlaygroundTokenAuth(), func(c *gin.Context) {
		limits, ok := common.GetContextKey(c, constant.ContextKeyTokenModelLimit)
		c.JSON(http.StatusOK, gin.H{
			"token_id":            c.GetInt("token_id"),
			"token_quota":         c.GetInt("token_quota"),
			"model_limit_enabled": common.GetContextKeyBool(c, constant.ContextKeyTokenModelLimitEnabled),
			"model_limits":        limits,
			"has_model_limits":    ok,
		})
	})
	request := httptest.NewRequest(http.MethodPost, "/pg/chat/completions", nil)
	request.Header.Set(common.PlaygroundTokenIdHeader, strconv.Itoa(token.Id))
	response := httptest.NewRecorder()

	router.ServeHTTP(response, request)

	require.Equal(t, http.StatusOK, response.Code)
	var body struct {
		TokenId           int             `json:"token_id"`
		TokenQuota        int             `json:"token_quota"`
		ModelLimitEnabled bool            `json:"model_limit_enabled"`
		ModelLimits       map[string]bool `json:"model_limits"`
		HasModelLimits    bool            `json:"has_model_limits"`
	}
	require.NoError(t, common.Unmarshal(response.Body.Bytes(), &body))
	assert.Equal(t, token.Id, body.TokenId)
	assert.Equal(t, token.RemainQuota, body.TokenQuota)
	assert.True(t, body.ModelLimitEnabled)
	assert.True(t, body.HasModelLimits)
	assert.Equal(t, map[string]bool{"gpt-test": true}, body.ModelLimits)
}

func TestRelayArchiveCapturesPlaygroundTokenAuthenticationFailure(t *testing.T) {
	_, otherUser, token := setupPlaygroundTokenAuthTest(t)

	router := gin.New()
	router.Use(RequestId())
	router.POST("/pg/chat/completions", func(c *gin.Context) {
		c.Set("id", otherUser.Id)
		c.Next()
	}, RelayArchive(), PlaygroundTokenAuth(), func(c *gin.Context) {
		c.Status(http.StatusNoContent)
	})
	request := httptest.NewRequest(
		http.MethodPost,
		"/pg/chat/completions",
		strings.NewReader(`{"model":"gpt-test"}`),
	)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set(common.PlaygroundTokenIdHeader, strconv.Itoa(token.Id))
	response := httptest.NewRecorder()

	router.ServeHTTP(response, request)

	require.Equal(t, http.StatusForbidden, response.Code)
	requestId := response.Header().Get(common.RequestIdKey)
	require.NotEmpty(t, requestId)
	archivedRequestIds, err := model.GetUserCompletedWithoutConsumeRelayArchiveRequestIds(otherUser.Id, []string{requestId})
	require.NoError(t, err)
	assert.Equal(t, []string{requestId}, archivedRequestIds)
}

func TestGetModelRequestPreservesAuthenticatedPlaygroundTokenGroup(t *testing.T) {
	gin.SetMode(gin.TestMode)
	request := httptest.NewRequest(
		http.MethodPost,
		"/pg/chat/completions",
		strings.NewReader(`{"model":"gpt-test","group":"requested-group"}`),
	)
	request.Header.Set("Content-Type", "application/json")
	context, _ := gin.CreateTestContext(httptest.NewRecorder())
	context.Request = request
	common.SetContextKey(context, constant.ContextKeyTokenGroup, "token-group")

	modelRequest, _, err := getModelRequest(context)

	require.NoError(t, err)
	assert.Equal(t, "gpt-test", modelRequest.Model)
	assert.Equal(t, "requested-group", modelRequest.Group)
	assert.Equal(t, "token-group", common.GetContextKeyString(context, constant.ContextKeyTokenGroup))
}

func TestDistributeRejectsPlaygroundGroupOutsideSelectedToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/pg/chat/completions", func(c *gin.Context) {
		common.SetContextKey(c, constant.ContextKeyUsingGroup, "token-group")
		common.SetContextKey(c, constant.ContextKeyTokenGroup, "token-group")
		c.Next()
	}, Distribute(), func(c *gin.Context) {
		c.Status(http.StatusNoContent)
	})
	request := httptest.NewRequest(
		http.MethodPost,
		"/pg/chat/completions",
		strings.NewReader(`{"model":"gpt-test","group":"requested-group"}`),
	)
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()

	router.ServeHTTP(response, request)

	assert.Equal(t, http.StatusForbidden, response.Code)
}
