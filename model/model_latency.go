package model

import (
	"github.com/QuantumNous/new-api/common"
)

// ModelLatency summarizes the latest channel probes available for one model.
// A channel is counted once even when it exposes the model to multiple groups.
type ModelLatency struct {
	AvgLatencyMs   int   `json:"avg_latency_ms"`
	MinLatencyMs   int   `json:"min_latency_ms"`
	MaxLatencyMs   int   `json:"max_latency_ms"`
	TestedChannels int   `json:"tested_channels"`
	LastTestTime   int64 `json:"last_test_time"`
}

// GetModelLatency returns probe latency grouped by model for the requested
// groups. Passing an empty, non-nil group slice intentionally returns no data;
// nil includes every group.
func GetModelLatency(groups []string) (map[string]ModelLatency, error) {
	result := make(map[string]ModelLatency)
	if groups != nil && len(groups) == 0 {
		return result, nil
	}

	type latencyRow struct {
		Model        string
		ChannelID    int
		ResponseTime int
		TestTime     int64
	}

	var rows []latencyRow
	query := DB.Table("abilities").
		Select(
			"abilities.model as model, abilities.channel_id as channel_id, channels.response_time as response_time, channels.test_time as test_time",
		).
		Joins("JOIN channels ON abilities.channel_id = channels.id").
		Where(
			"abilities.enabled = ? AND channels.status = ? AND channels.response_time > ? AND channels.test_time > ?",
			true,
			common.ChannelStatusEnabled,
			0,
			0,
		)
	if groups != nil {
		query = query.Where("abilities."+commonGroupCol+" IN ?", groups)
	}
	if err := query.Scan(&rows).Error; err != nil {
		return nil, err
	}

	type modelAccumulator struct {
		channels map[int]struct{}
		sum      int64
		min      int
		max      int
		latest   int64
	}
	accumulators := make(map[string]*modelAccumulator)
	for _, row := range rows {
		accumulator := accumulators[row.Model]
		if accumulator == nil {
			accumulator = &modelAccumulator{
				channels: make(map[int]struct{}),
				min:      row.ResponseTime,
			}
			accumulators[row.Model] = accumulator
		}
		if _, exists := accumulator.channels[row.ChannelID]; exists {
			continue
		}

		accumulator.channels[row.ChannelID] = struct{}{}
		accumulator.sum += int64(row.ResponseTime)
		if row.ResponseTime < accumulator.min {
			accumulator.min = row.ResponseTime
		}
		if row.ResponseTime > accumulator.max {
			accumulator.max = row.ResponseTime
		}
		if row.TestTime > accumulator.latest {
			accumulator.latest = row.TestTime
		}
	}

	for modelName, accumulator := range accumulators {
		channelCount := len(accumulator.channels)
		if channelCount == 0 {
			continue
		}
		result[modelName] = ModelLatency{
			AvgLatencyMs:   int((accumulator.sum + int64(channelCount)/2) / int64(channelCount)),
			MinLatencyMs:   accumulator.min,
			MaxLatencyMs:   accumulator.max,
			TestedChannels: channelCount,
			LastTestTime:   accumulator.latest,
		}
	}
	return result, nil
}
