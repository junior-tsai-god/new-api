package controller

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/middleware"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestModelStatusEndpointAllowsAnonymousView(t *testing.T) {
	db := setupModelListControllerTestDB(t)
	require.NoError(t, db.AutoMigrate(&model.ModelProbeRecord{}, &model.SystemTask{}))
	model.InvalidatePricingCache()
	t.Cleanup(model.InvalidatePricingCache)

	engine := gin.New()
	engine.GET("/api/model-status", middleware.TryUserAuth(), GetModelStatus)
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/api/model-status", nil)
	engine.ServeHTTP(recorder, request)

	require.Equal(t, http.StatusOK, recorder.Code)
	var payload struct {
		Success bool `json:"success"`
	}
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &payload))
	assert.True(t, payload.Success)
}

func TestModelStatusProbeEndpointUsesTheModelProtocol(t *testing.T) {
	tests := []struct {
		name         string
		channel      *model.Channel
		modelName    string
		wantEndpoint string
		wantProbe    bool
	}{
		{
			name:         "embedding model",
			channel:      &model.Channel{Type: constant.ChannelTypeOpenAI},
			modelName:    "text-embedding-3-small",
			wantEndpoint: string(constant.EndpointTypeEmbeddings),
			wantProbe:    true,
		},
		{
			name:         "volcengine image model",
			channel:      &model.Channel{Type: constant.ChannelTypeVolcEngine},
			modelName:    "doubao-seedream-4-0",
			wantEndpoint: string(constant.EndpointTypeImageGeneration),
			wantProbe:    true,
		},
		{
			name:         "ali image model",
			channel:      &model.Channel{Type: constant.ChannelTypeAli},
			modelName:    "wan2.7",
			wantEndpoint: string(constant.EndpointTypeImageGeneration),
			wantProbe:    true,
		},
		{
			name:      "async video model",
			channel:   &model.Channel{Type: constant.ChannelTypeAli},
			modelName: "wan2.7-i2v",
			wantProbe: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			endpoint, ok := modelStatusProbeEndpoint(tt.channel, tt.modelName)
			assert.Equal(t, tt.wantProbe, ok)
			assert.Equal(t, tt.wantEndpoint, endpoint)
		})
	}
}
