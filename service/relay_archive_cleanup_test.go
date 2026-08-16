package service

import (
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRelayArchiveCleanupScheduleDoesNotDependOnEncryptionKey(t *testing.T) {
	previousSecret := common.RelayArchiveSecret
	previousRetentionDays := common.RelayArchiveRetentionDays
	t.Cleanup(func() {
		common.RelayArchiveSecret = previousSecret
		common.RelayArchiveRetentionDays = previousRetentionDays
	})

	handler := relayArchiveCleanupHandler{}
	common.RelayArchiveSecret = ""
	common.RelayArchiveRetentionDays = 7
	assert.True(t, handler.Enabled())

	common.RelayArchiveRetentionDays = 0
	assert.False(t, handler.Enabled())
	common.RelayArchiveRetentionDays = 7
	assert.Equal(t, 24*time.Hour, handler.Interval())

	before := common.GetTimestamp()
	payload, ok := handler.NewPayload().(relayArchiveCleanupPayload)
	require.True(t, ok)
	after := common.GetTimestamp()
	assert.Equal(t, relayArchiveCleanupBatchSize, payload.BatchSize)
	assert.GreaterOrEqual(t, payload.TargetTimestamp, before-7*24*60*60)
	assert.LessOrEqual(t, payload.TargetTimestamp, after-7*24*60*60)
}
