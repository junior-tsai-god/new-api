package model

import (
	"sort"

	"github.com/QuantumNous/new-api/common"
	"gorm.io/gorm"
)

const (
	ModelProbeStatusHealthy  = "healthy"
	ModelProbeStatusDegraded = "degraded"
	ModelProbeStatusDown     = "down"
	ModelProbeStatusUnknown  = "unknown"
)

type ModelProbeRecord struct {
	ID           int64  `json:"id" gorm:"primaryKey"`
	BatchID      string `json:"batch_id" gorm:"type:varchar(64);index:idx_model_probe_batch_model,priority:1"`
	ModelName    string `json:"model_name" gorm:"type:varchar(255);index:idx_model_probe_batch_model,priority:2;index"`
	ChannelID    int    `json:"channel_id" gorm:"index"`
	EndpointType string `json:"endpoint_type" gorm:"type:varchar(64)"`
	Success      bool   `json:"success"`
	LatencyMs    int64  `json:"latency_ms" gorm:"bigint"`
	ErrorCode    string `json:"error_code,omitempty" gorm:"type:varchar(128)"`
	CheckedAt    int64  `json:"checked_at" gorm:"bigint;index"`
}

type ModelProbeTarget struct {
	ModelName   string
	ChannelID   int
	ChannelType int
}

type ModelProbeHistory struct {
	BatchID         string `json:"batch_id"`
	Status          string `json:"status"`
	LatencyMs       int64  `json:"latency_ms"`
	HealthyChannels int    `json:"healthy_channels"`
	TotalChannels   int    `json:"total_channels"`
	CheckedAt       int64  `json:"checked_at"`
}

type ModelProbeSnapshot struct {
	Status                string              `json:"status"`
	LatencyMs             int64               `json:"latency_ms"`
	HealthyChannels       int                 `json:"healthy_channels"`
	TotalChannels         int                 `json:"total_channels"`
	Availability7d        float64             `json:"availability_7d"`
	AvailabilitySamples7d int                 `json:"availability_samples_7d"`
	LastCheckedAt         int64               `json:"last_checked_at"`
	History               []ModelProbeHistory `json:"history"`
}

func GetEnabledModelProbeTargets() ([]ModelProbeTarget, error) {
	var rows []ModelProbeTarget
	err := DB.Table("abilities").
		Select("abilities.model AS model_name, abilities.channel_id AS channel_id, channels.type AS channel_type").
		Joins("JOIN channels ON abilities.channel_id = channels.id").
		Where("abilities.enabled = ? AND channels.status = ?", true, common.ChannelStatusEnabled).
		Order("abilities.model ASC, abilities.channel_id ASC").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	targets := make([]ModelProbeTarget, 0, len(rows))
	type targetKey struct {
		modelName string
		channelID int
	}
	seen := make(map[targetKey]struct{}, len(rows))
	for _, row := range rows {
		key := targetKey{modelName: row.ModelName, channelID: row.ChannelID}
		if _, exists := seen[key]; exists {
			continue
		}
		seen[key] = struct{}{}
		targets = append(targets, row)
	}
	return targets, nil
}

func SaveModelProbeBatch(records []ModelProbeRecord, deleteBefore int64) error {
	return DB.Transaction(func(tx *gorm.DB) error {
		if len(records) > 0 {
			if err := tx.CreateInBatches(records, 200).Error; err != nil {
				return err
			}
		}
		if deleteBefore > 0 {
			if err := tx.Where("checked_at < ?", deleteBefore).Delete(&ModelProbeRecord{}).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func GetModelProbeSnapshots(modelNames []string, since int64, availabilitySince int64, historyLimit int) (map[string]ModelProbeSnapshot, error) {
	snapshots := make(map[string]ModelProbeSnapshot, len(modelNames))
	for _, modelName := range modelNames {
		snapshots[modelName] = ModelProbeSnapshot{
			Status:  ModelProbeStatusUnknown,
			History: make([]ModelProbeHistory, 0),
		}
	}
	if len(modelNames) == 0 {
		return snapshots, nil
	}

	var records []ModelProbeRecord
	if err := DB.Where("model_name IN ? AND checked_at >= ?", modelNames, since).
		Order("checked_at ASC, id ASC").
		Find(&records).Error; err != nil {
		return nil, err
	}

	type cycleKey struct {
		modelName string
		batchID   string
	}
	type cycleAggregate struct {
		checkedAt int64
		total     int
		healthy   int
		latency   int64
	}
	cycles := make(map[cycleKey]*cycleAggregate)
	for _, record := range records {
		key := cycleKey{modelName: record.ModelName, batchID: record.BatchID}
		cycle := cycles[key]
		if cycle == nil {
			cycle = &cycleAggregate{checkedAt: record.CheckedAt}
			cycles[key] = cycle
		}
		if record.CheckedAt > cycle.checkedAt {
			cycle.checkedAt = record.CheckedAt
		}
		cycle.total++
		if record.Success {
			cycle.healthy++
			cycle.latency += record.LatencyMs
		}
	}

	historyByModel := make(map[string][]ModelProbeHistory, len(modelNames))
	for key, cycle := range cycles {
		status := ModelProbeStatusDown
		if cycle.healthy == cycle.total {
			status = ModelProbeStatusHealthy
		} else if cycle.healthy > 0 {
			status = ModelProbeStatusDegraded
		}
		latency := int64(0)
		if cycle.healthy > 0 {
			latency = cycle.latency / int64(cycle.healthy)
		}
		historyByModel[key.modelName] = append(historyByModel[key.modelName], ModelProbeHistory{
			BatchID:         key.batchID,
			Status:          status,
			LatencyMs:       latency,
			HealthyChannels: cycle.healthy,
			TotalChannels:   cycle.total,
			CheckedAt:       cycle.checkedAt,
		})
	}

	for _, modelName := range modelNames {
		history := historyByModel[modelName]
		sort.Slice(history, func(i, j int) bool {
			if history[i].CheckedAt == history[j].CheckedAt {
				return history[i].BatchID < history[j].BatchID
			}
			return history[i].CheckedAt < history[j].CheckedAt
		})

		availabilityTotal := 0
		availabilityHealthy := 0
		for _, cycle := range history {
			if cycle.CheckedAt < availabilitySince {
				continue
			}
			availabilityTotal++
			if cycle.Status != ModelProbeStatusDown {
				availabilityHealthy++
			}
		}
		if historyLimit > 0 && len(history) > historyLimit {
			history = history[len(history)-historyLimit:]
		}

		snapshot := snapshots[modelName]
		if len(history) > 0 {
			latest := history[len(history)-1]
			snapshot.Status = latest.Status
			snapshot.LatencyMs = latest.LatencyMs
			snapshot.HealthyChannels = latest.HealthyChannels
			snapshot.TotalChannels = latest.TotalChannels
			snapshot.LastCheckedAt = latest.CheckedAt
		}
		if availabilityTotal > 0 {
			snapshot.Availability7d = float64(availabilityHealthy) * 100 / float64(availabilityTotal)
		}
		snapshot.AvailabilitySamples7d = availabilityTotal
		snapshot.History = history
		snapshots[modelName] = snapshot
	}

	return snapshots, nil
}
