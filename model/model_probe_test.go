package model

import (
	"fmt"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupModelProbeTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	originalDB := DB
	originalDatabaseType := common.MainDatabaseType()
	originalLogDatabaseType := common.LogDatabaseType()
	common.SetDatabaseTypes(common.DatabaseTypeSQLite, common.DatabaseTypeSQLite)
	initCol()

	dsn := fmt.Sprintf("file:%s?mode=memory&cache=shared", strings.ReplaceAll(t.Name(), "/", "_"))
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&Channel{}, &Ability{}, &ModelProbeRecord{}))
	DB = db

	t.Cleanup(func() {
		DB = originalDB
		common.SetDatabaseTypes(originalDatabaseType, originalLogDatabaseType)
		initCol()
		sqlDB, dbErr := db.DB()
		if dbErr == nil {
			_ = sqlDB.Close()
		}
	})
	return db
}

func TestGetEnabledModelProbeTargetsDeduplicatesGroupsAndExcludesDisabledChannels(t *testing.T) {
	db := setupModelProbeTestDB(t)
	require.NoError(t, db.Create(&[]Channel{
		{Id: 1, Name: "enabled", Status: common.ChannelStatusEnabled},
		{Id: 2, Name: "disabled", Status: common.ChannelStatusAutoDisabled},
	}).Error)
	require.NoError(t, db.Create(&[]Ability{
		{Group: "default", Model: "model-a", ChannelId: 1, Enabled: true},
		{Group: "vip", Model: "model-a", ChannelId: 1, Enabled: true},
		{Group: "default", Model: "model-a", ChannelId: 2, Enabled: true},
		{Group: "default", Model: "model-b", ChannelId: 1, Enabled: false},
	}).Error)

	targets, err := GetEnabledModelProbeTargets()
	require.NoError(t, err)
	assert.Equal(t, []ModelProbeTarget{{ModelName: "model-a", ChannelID: 1}}, targets)
}

func TestGetModelProbeSnapshotsAggregatesChannelHealthAndSevenDayAvailability(t *testing.T) {
	db := setupModelProbeTestDB(t)
	now := int64(2_000_000)
	require.NoError(t, db.Create(&[]ModelProbeRecord{
		{BatchID: "batch-old", ModelName: "model-a", ChannelID: 1, Success: true, LatencyMs: 100, CheckedAt: now - 8*24*60*60},
		{BatchID: "batch-old", ModelName: "model-a", ChannelID: 2, Success: true, LatencyMs: 200, CheckedAt: now - 8*24*60*60},
		{BatchID: "batch-degraded", ModelName: "model-a", ChannelID: 1, Success: true, LatencyMs: 300, CheckedAt: now - 5*24*60*60},
		{BatchID: "batch-degraded", ModelName: "model-a", ChannelID: 2, Success: false, LatencyMs: 900, CheckedAt: now - 5*24*60*60},
		{BatchID: "batch-down", ModelName: "model-a", ChannelID: 1, Success: false, LatencyMs: 500, CheckedAt: now - 60},
		{BatchID: "batch-down", ModelName: "model-a", ChannelID: 2, Success: false, LatencyMs: 700, CheckedAt: now - 60},
	}).Error)

	snapshots, err := GetModelProbeSnapshots(
		[]string{"model-a", "model-without-history"},
		now-45*24*60*60,
		now-7*24*60*60,
		2,
	)
	require.NoError(t, err)

	modelA := snapshots["model-a"]
	assert.Equal(t, ModelProbeStatusDown, modelA.Status)
	assert.Equal(t, 0, modelA.HealthyChannels)
	assert.Equal(t, 2, modelA.TotalChannels)
	assert.Equal(t, float64(50), modelA.Availability7d)
	assert.Equal(t, 2, modelA.AvailabilitySamples7d)
	assert.Equal(t, now-60, modelA.LastCheckedAt)
	require.Len(t, modelA.History, 2)
	assert.Equal(t, ModelProbeStatusDegraded, modelA.History[0].Status)
	assert.Equal(t, int64(300), modelA.History[0].LatencyMs)
	assert.Equal(t, ModelProbeStatusDown, modelA.History[1].Status)

	unknown := snapshots["model-without-history"]
	assert.Equal(t, ModelProbeStatusUnknown, unknown.Status)
	assert.Empty(t, unknown.History)
}

func TestSaveModelProbeBatchReplacesNoHistoryAndPrunesExpiredRecords(t *testing.T) {
	db := setupModelProbeTestDB(t)
	require.NoError(t, db.Create(&ModelProbeRecord{
		BatchID: "expired", ModelName: "model-a", ChannelID: 1, CheckedAt: 10,
	}).Error)

	err := SaveModelProbeBatch([]ModelProbeRecord{{
		BatchID: "current", ModelName: "model-a", ChannelID: 1, Success: true, CheckedAt: 100,
	}}, 50)
	require.NoError(t, err)

	var records []ModelProbeRecord
	require.NoError(t, db.Order("checked_at ASC").Find(&records).Error)
	require.Len(t, records, 1)
	assert.Equal(t, "current", records[0].BatchID)
}
