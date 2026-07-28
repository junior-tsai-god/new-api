package model

import (
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupModelLatencyTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	originalDB := DB
	originalDatabaseType := common.MainDatabaseType()
	originalLogDatabaseType := common.LogDatabaseType()
	common.SetDatabaseTypes(common.DatabaseTypeSQLite, common.DatabaseTypeSQLite)
	initCol()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&Channel{}, &Ability{}))
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

func TestGetModelLatencyFiltersGroupsAndDeduplicatesChannels(t *testing.T) {
	db := setupModelLatencyTestDB(t)
	require.NoError(t, db.Create(&[]Channel{
		{
			Id:           1,
			Name:         "fast",
			Status:       common.ChannelStatusEnabled,
			ResponseTime: 100,
			TestTime:     1000,
		},
		{
			Id:           2,
			Name:         "slow",
			Status:       common.ChannelStatusEnabled,
			ResponseTime: 301,
			TestTime:     1200,
		},
		{
			Id:           3,
			Name:         "disabled",
			Status:       common.ChannelStatusAutoDisabled,
			ResponseTime: 900,
			TestTime:     1300,
		},
		{
			Id:           4,
			Name:         "untested",
			Status:       common.ChannelStatusEnabled,
			ResponseTime: 0,
			TestTime:     0,
		},
	}).Error)
	require.NoError(t, db.Create(&[]Ability{
		{Group: "default", Model: "model-a", ChannelId: 1, Enabled: true},
		{Group: "vip", Model: "model-a", ChannelId: 1, Enabled: true},
		{Group: "default", Model: "model-a", ChannelId: 2, Enabled: true},
		{Group: "vip", Model: "model-a", ChannelId: 3, Enabled: true},
		{Group: "default", Model: "model-a", ChannelId: 4, Enabled: true},
		{Group: "default", Model: "model-b", ChannelId: 2, Enabled: false},
	}).Error)

	latency, err := GetModelLatency([]string{"default", "vip"})
	require.NoError(t, err)
	assert.Equal(t, ModelLatency{
		AvgLatencyMs:   201,
		MinLatencyMs:   100,
		MaxLatencyMs:   301,
		TestedChannels: 2,
		LastTestTime:   1200,
	}, latency["model-a"])
	assert.NotContains(t, latency, "model-b")

	defaultLatency, err := GetModelLatency([]string{"default"})
	require.NoError(t, err)
	assert.Equal(t, latency["model-a"], defaultLatency["model-a"])

	noGroupLatency, err := GetModelLatency([]string{})
	require.NoError(t, err)
	assert.Empty(t, noGroupLatency)
}
