package model

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestLogCategoryFiltersRequestAndAccountActivity(t *testing.T) {
	truncateTables(t)

	for logType := LogTypeTopup; logType <= LogTypeLogin; logType++ {
		require.NoError(t, LOG_DB.Create(&Log{
			UserId:    1,
			CreatedAt: int64(logType),
			Type:      logType,
		}).Error)
	}
	require.NoError(t, LOG_DB.Create(&Log{UserId: 2, CreatedAt: 20, Type: LogTypeConsume}).Error)

	requestLogs, requestTotal, err := GetUserLogs(1, LogTypeUnknown, 0, 0, "", "", 0, 20, "", "", "", LogCategoryRequest)
	require.NoError(t, err)
	assert.EqualValues(t, 2, requestTotal)
	require.Len(t, requestLogs, 2)
	assert.ElementsMatch(t, []int{LogTypeConsume, LogTypeError}, []int{requestLogs[0].Type, requestLogs[1].Type})

	activityLogs, activityTotal, err := GetUserLogs(1, LogTypeUnknown, 0, 0, "", "", 0, 20, "", "", "", LogCategoryActivity)
	require.NoError(t, err)
	assert.EqualValues(t, 5, activityTotal)
	activityTypes := make([]int, 0, len(activityLogs))
	for _, log := range activityLogs {
		activityTypes = append(activityTypes, log.Type)
	}
	assert.ElementsMatch(t, []int{LogTypeTopup, LogTypeManage, LogTypeSystem, LogTypeRefund, LogTypeLogin}, activityTypes)
}

func TestLogCategoryCannotBeBypassedByExplicitType(t *testing.T) {
	truncateTables(t)
	require.NoError(t, LOG_DB.Create(&Log{UserId: 1, CreatedAt: 1, Type: LogTypeTopup}).Error)

	logs, total, err := GetUserLogs(1, LogTypeTopup, 0, 0, "", "", 0, 20, "", "", "", LogCategoryRequest)
	require.NoError(t, err)
	assert.Zero(t, total)
	assert.Empty(t, logs)
}

func TestEmptyLogCategoryKeepsLegacyAllTypesBehavior(t *testing.T) {
	truncateTables(t)
	require.NoError(t, LOG_DB.Create(&Log{UserId: 1, CreatedAt: 1, Type: LogTypeTopup}).Error)
	require.NoError(t, LOG_DB.Create(&Log{UserId: 1, CreatedAt: 2, Type: LogTypeConsume}).Error)

	logs, total, err := GetUserLogs(1, LogTypeUnknown, 0, 0, "", "", 0, 20, "", "", "", "")
	require.NoError(t, err)
	assert.EqualValues(t, 2, total)
	assert.Len(t, logs, 2)
}

func TestInvalidLogCategoryIsRejected(t *testing.T) {
	truncateTables(t)

	_, _, err := GetUserLogs(1, LogTypeUnknown, 0, 0, "", "", 0, 20, "", "", "", "invalid")
	assert.ErrorIs(t, err, ErrInvalidLogCategory)

	_, err = SumUsedQuota(LogTypeUnknown, 0, 0, "", "", "", 0, "", "invalid")
	assert.ErrorIs(t, err, ErrInvalidLogCategory)
}
