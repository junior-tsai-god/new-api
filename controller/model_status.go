package controller

import (
	"context"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting/model_setting"
	"github.com/QuantumNous/new-api/setting/ratio_setting"

	"github.com/gin-gonic/gin"
)

const (
	modelStatusProbeDefaultIntervalHours = 12
	modelStatusProbeHistoryLimit         = 60
	modelStatusProbeRetentionDays        = 45
)

type modelStatusProbeSummary struct {
	Targets   int `json:"targets"`
	Tested    int `json:"tested"`
	Succeeded int `json:"succeeded"`
	Failed    int `json:"failed"`
	Skipped   int `json:"skipped"`
}

type modelStatusItem struct {
	ModelName              string                    `json:"model_name"`
	Icon                   string                    `json:"icon,omitempty"`
	VendorName             string                    `json:"vendor_name,omitempty"`
	VendorIcon             string                    `json:"vendor_icon,omitempty"`
	SupportedEndpointTypes []constant.EndpointType   `json:"supported_endpoint_types"`
	Status                 string                    `json:"status"`
	LatencyMs              int64                     `json:"latency_ms"`
	HealthyChannels        int                       `json:"healthy_channels"`
	TotalChannels          int                       `json:"total_channels"`
	Availability7d         float64                   `json:"availability_7d"`
	AvailabilitySamples7d  int                       `json:"availability_samples_7d"`
	LastCheckedAt          int64                     `json:"last_checked_at"`
	History                []model.ModelProbeHistory `json:"history"`
}

func modelStatusProbeInterval() time.Duration {
	hours := common.GetEnvOrDefault("MODEL_STATUS_PROBE_INTERVAL_HOURS", modelStatusProbeDefaultIntervalHours)
	if hours < 1 {
		hours = modelStatusProbeDefaultIntervalHours
	}
	return time.Duration(hours) * time.Hour
}

func modelStatusProbeTimeout() time.Duration {
	seconds := common.GetEnvOrDefault("MODEL_STATUS_PROBE_TIMEOUT_SECONDS", 120)
	if seconds < 10 {
		seconds = 10
	}
	if seconds > 600 {
		seconds = 600
	}
	return time.Duration(seconds) * time.Second
}

func modelStatusProbeEndpoint(channel *model.Channel, modelName string) (string, bool) {
	if channel == nil {
		return "", false
	}
	lowerModelName := strings.ToLower(modelName)
	if strings.Contains(lowerModelName, "-i2v") ||
		strings.Contains(lowerModelName, "-t2v") ||
		strings.Contains(lowerModelName, "-s2v") ||
		strings.Contains(lowerModelName, "-kf2v") {
		return "", false
	}
	if strings.Contains(lowerModelName, "rerank") {
		return string(constant.EndpointTypeJinaRerank), true
	}
	if strings.Contains(lowerModelName, "embedding") ||
		strings.HasPrefix(lowerModelName, "m3e") ||
		strings.Contains(lowerModelName, "bge-") ||
		strings.Contains(lowerModelName, "embed") ||
		channel.Type == constant.ChannelTypeMokaAI {
		return string(constant.EndpointTypeEmbeddings), true
	}
	if strings.HasSuffix(modelName, ratio_setting.CompactModelSuffix) {
		return string(constant.EndpointTypeOpenAIResponseCompact), true
	}
	if channel.Type == constant.ChannelTypeCodex || strings.Contains(lowerModelName, "codex") {
		return string(constant.EndpointTypeOpenAIResponse), true
	}
	if channel.Type == constant.ChannelTypeVolcEngine && strings.Contains(lowerModelName, "seedream") {
		return string(constant.EndpointTypeImageGeneration), true
	}
	if channel.Type == constant.ChannelTypeAli && model_setting.IsSyncImageModel(modelName) {
		return string(constant.EndpointTypeImageGeneration), true
	}

	endpointTypes := common.GetEndpointTypesByChannelType(channel.Type, modelName)
	if channel.Type == constant.ChannelTypeAdvancedCustom {
		if config := channel.GetOtherSettings().AdvancedCustom; config != nil {
			endpointTypes = config.SupportedEndpointTypesForModel(modelName)
		}
	}
	for _, endpointType := range endpointTypes {
		if endpointType == constant.EndpointTypeOpenAIVideo {
			continue
		}
		return string(endpointType), true
	}
	return "", false
}

func modelStatusProbeChannelSupported(channelType int) bool {
	switch channelType {
	case constant.ChannelTypeMidjourney,
		constant.ChannelTypeMidjourneyPlus,
		constant.ChannelTypeSunoAPI,
		constant.ChannelTypeKling,
		constant.ChannelTypeJimeng,
		constant.ChannelTypeDoubaoVideo,
		constant.ChannelTypeVidu,
		constant.ChannelTypeSora:
		return false
	default:
		return true
	}
}

func runModelStatusProbeTask(ctx context.Context, batchID string, report func(processed, total int)) (modelStatusProbeSummary, error) {
	if ctx == nil {
		ctx = context.Background()
	}
	targets, err := model.GetEnabledModelProbeTargets()
	if err != nil {
		return modelStatusProbeSummary{}, err
	}
	summary := modelStatusProbeSummary{Targets: len(targets)}
	if len(targets) == 0 {
		if report != nil {
			report(0, 0)
		}
		return summary, model.SaveModelProbeBatch(nil, common.GetTimestamp()-modelStatusProbeRetentionDays*24*60*60)
	}

	channelIDs := make([]int, 0, len(targets))
	seenChannelIDs := make(map[int]struct{}, len(targets))
	for _, target := range targets {
		if _, exists := seenChannelIDs[target.ChannelID]; exists {
			continue
		}
		seenChannelIDs[target.ChannelID] = struct{}{}
		channelIDs = append(channelIDs, target.ChannelID)
	}
	channels, err := model.GetChannelsByIds(channelIDs)
	if err != nil {
		return summary, err
	}
	channelByID := make(map[int]*model.Channel, len(channels))
	for _, channel := range channels {
		channelByID[channel.Id] = channel
	}
	testUserID, err := resolveChannelTestUserID(nil)
	if err != nil {
		return summary, err
	}

	records := make([]model.ModelProbeRecord, 0, len(targets))
	for index, target := range targets {
		if ctx != nil && ctx.Err() != nil {
			return summary, ctx.Err()
		}
		if report != nil {
			report(index, len(targets))
		}

		channel := channelByID[target.ChannelID]
		endpointType, supported := modelStatusProbeEndpoint(channel, target.ModelName)
		if channel == nil || !supported || !modelStatusProbeChannelSupported(target.ChannelType) {
			summary.Skipped++
			continue
		}

		probeCtx, cancel := context.WithTimeout(ctx, modelStatusProbeTimeout())
		startedAt := time.Now()
		result := testChannelWithOptions(
			probeCtx,
			channel,
			testUserID,
			target.ModelName,
			endpointType,
			shouldUseStreamForAutomaticChannelTest(channel),
			false,
		)
		latencyMs := time.Since(startedAt).Milliseconds()
		probeErr := probeCtx.Err()
		cancel()

		success := result.localErr == nil && result.newAPIError == nil && probeErr == nil
		errorCode := ""
		if result.newAPIError != nil {
			errorCode = string(result.newAPIError.GetErrorCode())
		} else if probeErr != nil {
			errorCode = "probe_timeout"
		} else if result.localErr != nil {
			errorCode = "probe_failed"
		}
		records = append(records, model.ModelProbeRecord{
			BatchID:      batchID,
			ModelName:    target.ModelName,
			ChannelID:    target.ChannelID,
			EndpointType: endpointType,
			Success:      success,
			LatencyMs:    latencyMs,
			ErrorCode:    errorCode,
			CheckedAt:    common.GetTimestamp(),
		})
		summary.Tested++
		if success {
			summary.Succeeded++
		} else {
			summary.Failed++
		}
	}

	if report != nil {
		report(len(targets), len(targets))
	}
	deleteBefore := common.GetTimestamp() - modelStatusProbeRetentionDays*24*60*60
	if err := model.SaveModelProbeBatch(records, deleteBefore); err != nil {
		return summary, err
	}
	return summary, nil
}

func GetModelStatus(c *gin.Context) {
	userGroup := ""
	if userID, authenticated := c.Get("id"); authenticated {
		user, err := model.GetUserCache(userID.(int))
		if err != nil {
			common.ApiError(c, err)
			return
		}
		userGroup = user.Group
	}
	pricing := filterPricingByUsableGroups(model.GetPricing(), service.GetUserUsableGroups(userGroup))
	modelNames := make([]string, 0, len(pricing))
	seenModels := make(map[string]struct{}, len(pricing))
	for _, item := range pricing {
		if _, exists := seenModels[item.ModelName]; exists {
			continue
		}
		seenModels[item.ModelName] = struct{}{}
		modelNames = append(modelNames, item.ModelName)
	}

	now := common.GetTimestamp()
	snapshots, err := model.GetModelProbeSnapshots(
		modelNames,
		now-modelStatusProbeRetentionDays*24*60*60,
		now-7*24*60*60,
		modelStatusProbeHistoryLimit,
	)
	if err != nil {
		logger.LogError(c, "failed to load model probe status: "+err.Error())
		common.ApiError(c, err)
		return
	}

	vendorByID := make(map[int]model.PricingVendor)
	for _, vendor := range model.GetVendors() {
		vendorByID[vendor.ID] = vendor
	}
	items := make([]modelStatusItem, 0, len(modelNames))
	latestCheckedAt := int64(0)
	for _, pricingItem := range pricing {
		if _, exists := seenModels[pricingItem.ModelName]; !exists {
			continue
		}
		delete(seenModels, pricingItem.ModelName)
		snapshot := snapshots[pricingItem.ModelName]
		vendor := vendorByID[pricingItem.VendorID]
		items = append(items, modelStatusItem{
			ModelName:              pricingItem.ModelName,
			Icon:                   pricingItem.Icon,
			VendorName:             vendor.Name,
			VendorIcon:             vendor.Icon,
			SupportedEndpointTypes: pricingItem.SupportedEndpointTypes,
			Status:                 snapshot.Status,
			LatencyMs:              snapshot.LatencyMs,
			HealthyChannels:        snapshot.HealthyChannels,
			TotalChannels:          snapshot.TotalChannels,
			Availability7d:         snapshot.Availability7d,
			AvailabilitySamples7d:  snapshot.AvailabilitySamples7d,
			LastCheckedAt:          snapshot.LastCheckedAt,
			History:                snapshot.History,
		})
		if snapshot.LastCheckedAt > latestCheckedAt {
			latestCheckedAt = snapshot.LastCheckedAt
		}
	}
	sort.Slice(items, func(i, j int) bool {
		return items[i].ModelName < items[j].ModelName
	})

	intervalSeconds := int64(modelStatusProbeInterval().Seconds())
	nextProbeAt := now
	scheduleBase := latestCheckedAt
	latestTask, taskErr := model.GetLatestSystemTask(model.SystemTaskTypeModelStatusProbe)
	if taskErr != nil {
		logger.LogError(c, "failed to load latest model probe task: "+taskErr.Error())
	} else if latestTask != nil && latestTask.UpdatedAt > scheduleBase {
		scheduleBase = latestTask.UpdatedAt
	}
	if scheduleBase > 0 {
		nextProbeAt = scheduleBase + intervalSeconds
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"generated_at":           now,
			"probe_interval_seconds": intervalSeconds,
			"next_probe_at":          nextProbeAt,
			"models":                 items,
		},
	})
}
