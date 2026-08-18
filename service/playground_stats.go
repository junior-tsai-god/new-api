package service

import (
	"fmt"
	"math"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"
)

const MaxPlaygroundSessionStatsRequestIds = 200

type playgroundLogOther struct {
	CacheTokens           int64  `json:"cache_tokens"`
	CacheCreationTokens   int64  `json:"cache_creation_tokens"`
	CacheCreationTokens5m int64  `json:"cache_creation_tokens_5m"`
	CacheCreationTokens1h int64  `json:"cache_creation_tokens_1h"`
	CacheWriteTokens      int64  `json:"cache_write_tokens"`
	InputTokensTotal      *int64 `json:"input_tokens_total"`
	Claude                bool   `json:"claude"`
	UsageSemantic         string `json:"usage_semantic"`
}

func NormalizePlaygroundSessionStatsRequestIds(requestIds []string) ([]string, error) {
	if len(requestIds) == 0 {
		return nil, fmt.Errorf("request_ids is required")
	}
	if len(requestIds) > MaxPlaygroundSessionStatsRequestIds {
		return nil, fmt.Errorf("request_ids cannot contain more than %d items", MaxPlaygroundSessionStatsRequestIds)
	}

	normalized := make([]string, 0, len(requestIds))
	seen := make(map[string]struct{}, len(requestIds))
	for _, rawRequestId := range requestIds {
		requestId := strings.TrimSpace(rawRequestId)
		if requestId == "" || len(requestId) > 64 {
			return nil, fmt.Errorf("request_ids contains an invalid request id")
		}
		if _, exists := seen[requestId]; exists {
			continue
		}
		seen[requestId] = struct{}{}
		normalized = append(normalized, requestId)
	}
	return normalized, nil
}

func GetPlaygroundSessionStats(userId int, requestIds []string) (dto.PlaygroundSessionStats, error) {
	if !common.LogConsumeEnabled {
		return dto.PlaygroundSessionStats{}, fmt.Errorf("consume logging is disabled")
	}
	normalizedRequestIds, err := NormalizePlaygroundSessionStatsRequestIds(requestIds)
	if err != nil {
		return dto.PlaygroundSessionStats{}, err
	}

	stats := dto.PlaygroundSessionStats{RequestedRequestCount: len(normalizedRequestIds)}
	logs, err := model.GetUserConsumeLogsByRequestIds(userId, normalizedRequestIds)
	if err != nil {
		return dto.PlaygroundSessionStats{}, err
	}
	completedRequestIds, err := model.GetUserCompletedWithoutConsumeRelayArchiveRequestIds(userId, normalizedRequestIds)
	if err != nil {
		return dto.PlaygroundSessionStats{}, err
	}

	latestLogByRequestId := make(map[string]*model.Log, len(logs))
	for _, log := range logs {
		if log == nil || log.RequestId == "" {
			continue
		}
		current := latestLogByRequestId[log.RequestId]
		if current == nil || log.CreatedAt > current.CreatedAt || (log.CreatedAt == current.CreatedAt && log.Id > current.Id) {
			latestLogByRequestId[log.RequestId] = log
		}
	}

	for _, requestId := range normalizedRequestIds {
		log := latestLogByRequestId[requestId]
		if log == nil {
			continue
		}

		other := playgroundLogOther{}
		if log.Other != "" {
			_ = common.UnmarshalJsonStr(log.Other, &other)
		}

		promptTokens := int64(log.PromptTokens)
		if promptTokens < 0 {
			promptTokens = 0
		}
		outputTokens := int64(log.CompletionTokens)
		if outputTokens < 0 {
			outputTokens = 0
		}
		cacheReadTokens := other.CacheTokens
		if cacheReadTokens < 0 {
			cacheReadTokens = 0
		}
		cacheWriteTokens := other.CacheWriteTokens
		if cacheWriteTokens <= 0 {
			cacheWriteTokens = other.CacheCreationTokens5m + other.CacheCreationTokens1h
			if cacheWriteTokens <= 0 {
				cacheWriteTokens = other.CacheCreationTokens
			}
		}
		if cacheWriteTokens < 0 {
			cacheWriteTokens = 0
		}

		inputTokens := promptTokens
		isClaude := other.Claude || strings.EqualFold(other.UsageSemantic, "anthropic")
		if isClaude {
			inputTokens = promptTokens + cacheReadTokens + cacheWriteTokens
		} else if other.InputTokensTotal != nil && *other.InputTokensTotal >= 0 {
			inputTokens = *other.InputTokensTotal
		}

		stats.InputTokens += inputTokens
		stats.OutputTokens += outputTokens
		stats.CacheReadTokens += cacheReadTokens
		stats.CacheWriteTokens += cacheWriteTokens
		if log.Quota > 0 {
			stats.Quota += int64(log.Quota)
		}
	}

	settledRequestIds := make(map[string]struct{}, len(latestLogByRequestId)+len(completedRequestIds))
	for requestId := range latestLogByRequestId {
		settledRequestIds[requestId] = struct{}{}
	}
	for _, requestId := range completedRequestIds {
		settledRequestIds[requestId] = struct{}{}
	}
	stats.SettledRequestCount = len(settledRequestIds)
	stats.Settled = stats.SettledRequestCount == stats.RequestedRequestCount
	stats.TotalTokens = stats.InputTokens + stats.OutputTokens
	stats.CachedTokens = stats.CacheReadTokens
	if stats.InputTokens > 0 {
		stats.CacheHitRate = float64(stats.CacheReadTokens) / float64(stats.InputTokens)
		if stats.CacheHitRate > 1 {
			stats.CacheHitRate = 1
		}
	}
	if common.QuotaPerUnit > 0 && !math.IsNaN(common.QuotaPerUnit) && !math.IsInf(common.QuotaPerUnit, 0) {
		stats.CostUSD = float64(stats.Quota) / common.QuotaPerUnit
	}
	return stats, nil
}
