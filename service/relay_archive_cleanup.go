package service

import (
	"context"
	"errors"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
)

const relayArchiveCleanupBatchSize = 50

type relayArchiveCleanupHandler struct{}

type relayArchiveCleanupPayload struct {
	TargetTimestamp int64 `json:"target_timestamp"`
	BatchSize       int   `json:"batch_size"`
}

type relayArchiveCleanupResult struct {
	DeletedCount    int64 `json:"deleted_count"`
	TargetTimestamp int64 `json:"target_timestamp"`
}

func (relayArchiveCleanupHandler) Type() string {
	return model.SystemTaskTypeRelayArchiveCleanup
}

func (relayArchiveCleanupHandler) Enabled() bool {
	return common.RelayArchiveRetentionDays > 0
}

func (relayArchiveCleanupHandler) Interval() time.Duration {
	return 24 * time.Hour
}

func (relayArchiveCleanupHandler) NewPayload() any {
	return relayArchiveCleanupPayload{
		TargetTimestamp: common.GetTimestamp() - int64(common.RelayArchiveRetentionDays)*24*60*60,
		BatchSize:       relayArchiveCleanupBatchSize,
	}
}

func (relayArchiveCleanupHandler) Run(ctx context.Context, task *model.SystemTask, runnerID string) {
	payload := relayArchiveCleanupPayload{}
	if err := task.DecodePayload(&payload); err != nil {
		failSystemTask(task, runnerID, err)
		return
	}
	if payload.TargetTimestamp <= 0 {
		failSystemTask(task, runnerID, errors.New("relay archive cleanup cutoff is required"))
		return
	}
	if payload.BatchSize <= 0 || payload.BatchSize > 100 {
		payload.BatchSize = relayArchiveCleanupBatchSize
	}

	total, err := model.CountRelayArchivesBefore(ctx, payload.TargetTimestamp)
	if err != nil {
		failSystemTask(task, runnerID, err)
		return
	}
	reportProgress := NewSystemTaskProgressReporter(task, runnerID)
	reportProgress(0, int(total))

	var deleted int64
	for {
		if err := ctx.Err(); err != nil {
			failSystemTask(task, runnerID, err)
			return
		}
		batchDeleted, err := model.DeleteRelayArchiveBatchBefore(ctx, payload.TargetTimestamp, payload.BatchSize)
		if err != nil {
			failSystemTask(task, runnerID, err)
			return
		}
		if batchDeleted == 0 {
			break
		}
		deleted += batchDeleted
		reportProgress(int(deleted), int(total))
	}

	reportProgress(int(deleted), int(deleted))
	result := relayArchiveCleanupResult{
		DeletedCount:    deleted,
		TargetTimestamp: payload.TargetTimestamp,
	}
	if err := model.FinishSystemTask(task.TaskID, runnerID, model.SystemTaskStatusSucceeded, result, ""); err != nil {
		failSystemTask(task, runnerID, err)
	}
}

func init() {
	RegisterSystemTaskHandler(relayArchiveCleanupHandler{})
}
