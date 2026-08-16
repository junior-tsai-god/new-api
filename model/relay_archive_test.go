package model

import (
	"bytes"
	"context"
	"fmt"
	"strings"
	"testing"
	"unicode/utf8"

	"github.com/QuantumNous/new-api/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func useRelayArchiveTestSecret(t *testing.T) {
	t.Helper()
	previous := common.RelayArchiveSecret
	common.RelayArchiveSecret = "relay-archive-test-secret-with-stable-entropy"
	t.Cleanup(func() { common.RelayArchiveSecret = previous })
}

func createRelayArchiveTestUser(t *testing.T, userId int) *User {
	t.Helper()
	user := &User{
		Id:          userId,
		Username:    fmt.Sprintf("archive-user-%d", userId),
		Password:    "archive-password",
		Role:        common.RoleCommonUser,
		Status:      common.UserStatusEnabled,
		Group:       "default",
		AuthVersion: 1,
	}
	require.NoError(t, DB.Create(user).Error)
	return user
}

func TestRelayArchiveRoundTripPreservesMultiChunkPayloads(t *testing.T) {
	truncateTables(t)
	useRelayArchiveTestSecret(t)
	createRelayArchiveTestUser(t, 17)

	requestBody := bytes.Repeat([]byte("request-payload-0123456789\n"), 3000)
	responseBody := bytes.Repeat([]byte("data: {\"delta\":\"response\"}\n\n"), 2800)
	archive := &RelayArchive{
		RequestId:           "request-archive-round-trip",
		UserId:              17,
		Username:            "archive-user",
		Method:              "POST",
		Path:                "/v1/responses",
		ModelName:           "gpt-test",
		StatusCode:          200,
		IsStream:            true,
		RequestContentType:  "application/json",
		ResponseContentType: "text/event-stream",
	}

	require.NoError(t, CreateRelayArchive(archive, bytes.NewReader(requestBody), bytes.NewReader(responseBody)))
	assert.Greater(t, archive.Id, int64(0))
	assert.EqualValues(t, len(requestBody), archive.RequestSize)
	assert.EqualValues(t, len(responseBody), archive.ResponseSize)
	assert.EqualValues(t, len(requestBody), archive.RequestStoredSize)
	assert.EqualValues(t, len(responseBody), archive.ResponseStoredSize)
	assert.Len(t, archive.RequestSha256, 64)
	assert.Len(t, archive.ResponseSha256, 64)

	stored, err := GetRelayArchiveByID(archive.Id)
	require.NoError(t, err)
	actualRequest, actualResponse, err := RevealRelayArchive(stored)
	require.NoError(t, err)
	assert.Equal(t, requestBody, actualRequest)
	assert.Equal(t, responseBody, actualResponse)

	var chunkCount int64
	require.NoError(t, DB.Model(&RelayArchiveChunk{}).Where("archive_id = ?", archive.Id).Count(&chunkCount).Error)
	assert.Greater(t, chunkCount, int64(4))
}

func TestRelayArchiveKeepsObservedAndStoredSizesForTruncatedBodies(t *testing.T) {
	truncateTables(t)
	useRelayArchiveTestSecret(t)
	createRelayArchiveTestUser(t, 1)

	archive := &RelayArchive{
		RequestId:         "request-archive-truncated",
		UserId:            1,
		StatusCode:        200,
		RequestSize:       100,
		ResponseSize:      200,
		RequestTruncated:  true,
		ResponseTruncated: true,
	}
	requestPrefix := []byte("request-prefix")
	responsePrefix := []byte("response-prefix")
	require.NoError(t, CreateRelayArchive(archive, bytes.NewReader(requestPrefix), bytes.NewReader(responsePrefix)))

	stored, err := GetRelayArchiveByID(archive.Id)
	require.NoError(t, err)
	assert.EqualValues(t, 100, stored.RequestSize)
	assert.EqualValues(t, 200, stored.ResponseSize)
	assert.EqualValues(t, len(requestPrefix), stored.RequestStoredSize)
	assert.EqualValues(t, len(responsePrefix), stored.ResponseStoredSize)
	assert.True(t, stored.RequestTruncated)
	assert.True(t, stored.ResponseTruncated)

	actualRequest, actualResponse, err := RevealRelayArchive(stored)
	require.NoError(t, err)
	assert.Equal(t, requestPrefix, actualRequest)
	assert.Equal(t, responsePrefix, actualResponse)
}

func TestRelayArchiveStorageEnforcesBodyLimitDefenseInDepth(t *testing.T) {
	truncateTables(t)
	useRelayArchiveTestSecret(t)
	createRelayArchiveTestUser(t, 1)
	previousMaxBodyBytes := common.RelayArchiveMaxBodyBytes
	common.RelayArchiveMaxBodyBytes = 8
	t.Cleanup(func() { common.RelayArchiveMaxBodyBytes = previousMaxBodyBytes })

	archive := &RelayArchive{RequestId: "request-archive-model-limit", UserId: 1, StatusCode: 200}
	require.NoError(t, CreateRelayArchive(archive, bytes.NewBufferString("request-long"), nil))
	assert.True(t, archive.RequestTruncated)
	assert.EqualValues(t, 8, archive.RequestStoredSize)
	assert.EqualValues(t, 9, archive.RequestSize)

	stored, err := GetRelayArchiveByID(archive.Id)
	require.NoError(t, err)
	requestBody, _, err := RevealRelayArchive(stored)
	require.NoError(t, err)
	assert.Equal(t, "request-", string(requestBody))
}

func TestRelayArchiveRejectsTamperedCiphertext(t *testing.T) {
	truncateTables(t)
	useRelayArchiveTestSecret(t)
	createRelayArchiveTestUser(t, 1)

	archive := &RelayArchive{RequestId: "request-archive-tamper", UserId: 1, StatusCode: 200}
	require.NoError(t, CreateRelayArchive(archive, bytes.NewBufferString("request"), bytes.NewBufferString("response")))

	chunk := &RelayArchiveChunk{}
	require.NoError(t, DB.Where("archive_id = ? AND direction = ?", archive.Id, RelayArchiveDirectionResponse).First(chunk).Error)
	require.NotEmpty(t, chunk.Payload)
	tampered := []byte(chunk.Payload)
	if tampered[len(tampered)-1] == 'A' {
		tampered[len(tampered)-1] = 'B'
	} else {
		tampered[len(tampered)-1] = 'A'
	}
	require.NoError(t, DB.Model(chunk).Update("payload", string(tampered)).Error)

	stored, err := GetRelayArchiveByID(archive.Id)
	require.NoError(t, err)
	_, _, err = RevealRelayArchive(stored)
	require.Error(t, err)
}

func TestRelayArchiveListNeverLoadsPayloadChunks(t *testing.T) {
	truncateTables(t)
	useRelayArchiveTestSecret(t)
	createRelayArchiveTestUser(t, 4)

	archive := &RelayArchive{
		RequestId:  "request-archive-list",
		UserId:     4,
		Username:   "list-user",
		Path:       "/v1/chat/completions",
		ModelName:  "gpt-list",
		StatusCode: 429,
	}
	require.NoError(t, CreateRelayArchive(archive, bytes.NewBufferString("secret request"), bytes.NewBufferString("secret response")))

	archives, total, err := GetRelayArchives(RelayArchiveFilter{
		Username:   "list-user",
		Path:       "chat/completions",
		StatusCode: 429,
	}, 0, 20)
	require.NoError(t, err)
	assert.EqualValues(t, 1, total)
	require.Len(t, archives, 1)
	assert.Equal(t, archive.RequestId, archives[0].RequestId)
}

func TestRelayArchiveNormalizesUntrustedMetadataForAllDatabases(t *testing.T) {
	truncateTables(t)
	useRelayArchiveTestSecret(t)
	createRelayArchiveTestUser(t, 1)

	archive := &RelayArchive{
		RequestId:           "metadata-normalization",
		UserId:              1,
		Method:              strings.Repeat("M", 32),
		Path:                strings.Repeat("路", 600),
		ModelName:           strings.Repeat("模", 220),
		RequestContentType:  strings.Repeat("类", 300),
		ResponseContentType: string([]byte{'t', 'e', 'x', 't', '/', 0xff}),
		StatusCode:          200,
	}
	require.NoError(t, CreateRelayArchive(archive, nil, nil))

	stored, err := GetRelayArchiveByID(archive.Id)
	require.NoError(t, err)
	assert.LessOrEqual(t, utf8.RuneCountInString(stored.Method), 16)
	assert.LessOrEqual(t, utf8.RuneCountInString(stored.Path), 512)
	assert.LessOrEqual(t, utf8.RuneCountInString(stored.ModelName), 191)
	assert.LessOrEqual(t, utf8.RuneCountInString(stored.RequestContentType), 255)
	assert.True(t, utf8.ValidString(stored.ResponseContentType))
	assert.Contains(t, stored.CaptureError, "metadata_truncated")
}

func TestRelayArchiveSoftDeletePurgesAndRejectsLateArchive(t *testing.T) {
	truncateTables(t)
	useRelayArchiveTestSecret(t)
	user := createRelayArchiveTestUser(t, 1)

	require.NoError(t, CreateRelayArchive(
		&RelayArchive{RequestId: "before-soft-delete", UserId: user.Id, StatusCode: 200},
		bytes.NewBufferString("request"),
		bytes.NewBufferString("response"),
	))
	require.NoError(t, user.Delete())

	var count int64
	require.NoError(t, DB.Model(&RelayArchive{}).Where("user_id = ?", user.Id).Count(&count).Error)
	assert.Zero(t, count)
	err := CreateRelayArchive(
		&RelayArchive{RequestId: "after-soft-delete", UserId: user.Id, StatusCode: 200},
		bytes.NewBufferString("request"),
		bytes.NewBufferString("response"),
	)
	require.Error(t, err)
	require.NoError(t, DB.Model(&RelayArchive{}).Where("user_id = ?", user.Id).Count(&count).Error)
	assert.Zero(t, count)
}

func TestEncodeRelayArchiveBodyUsesBase64ForBinaryPayload(t *testing.T) {
	encoded, encoding := EncodeRelayArchiveBody("application/octet-stream", []byte{0xff, 0x00, 0x7f})
	assert.Equal(t, "base64", encoding)
	assert.Equal(t, "/wB/", encoded)

	encoded, encoding = EncodeRelayArchiveBody("application/json", []byte(`{"ok":true}`))
	assert.Equal(t, "utf-8", encoding)
	assert.Equal(t, `{"ok":true}`, encoded)
}

func TestRelayArchiveRetentionDeletesOnlyExpiredArchivesAndChunks(t *testing.T) {
	truncateTables(t)
	useRelayArchiveTestSecret(t)
	createRelayArchiveTestUser(t, 1)

	for _, archive := range []*RelayArchive{
		{RequestId: "archive-old-1", UserId: 1, CreatedAt: 100, StatusCode: 200},
		{RequestId: "archive-old-2", UserId: 1, CreatedAt: 200, StatusCode: 200},
		{RequestId: "archive-current", UserId: 1, CreatedAt: 300, StatusCode: 200},
	} {
		require.NoError(t, CreateRelayArchive(archive, bytes.NewBufferString("request"), bytes.NewBufferString("response")))
	}

	total, err := CountRelayArchivesBefore(t.Context(), 250)
	require.NoError(t, err)
	assert.EqualValues(t, 2, total)

	deleted, err := DeleteRelayArchiveBatchBefore(t.Context(), 250, 1)
	require.NoError(t, err)
	assert.EqualValues(t, 1, deleted)
	deleted, err = DeleteRelayArchiveBatchBefore(t.Context(), 250, 1)
	require.NoError(t, err)
	assert.EqualValues(t, 1, deleted)
	deleted, err = DeleteRelayArchiveBatchBefore(t.Context(), 250, 1)
	require.NoError(t, err)
	assert.Zero(t, deleted)

	archives, total, err := GetRelayArchives(RelayArchiveFilter{}, 0, 20)
	require.NoError(t, err)
	assert.EqualValues(t, 1, total)
	require.Len(t, archives, 1)
	assert.Equal(t, "archive-current", archives[0].RequestId)
	var chunkCount int64
	require.NoError(t, DB.Model(&RelayArchiveChunk{}).Count(&chunkCount).Error)
	assert.EqualValues(t, 2, chunkCount)
}

func TestRelayArchiveRetentionHonorsCanceledContext(t *testing.T) {
	truncateTables(t)
	useRelayArchiveTestSecret(t)
	createRelayArchiveTestUser(t, 1)
	archive := &RelayArchive{RequestId: "archive-canceled-cleanup", UserId: 1, CreatedAt: 100, StatusCode: 200}
	require.NoError(t, CreateRelayArchive(archive, bytes.NewBufferString("request"), bytes.NewBufferString("response")))

	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	deleted, err := DeleteRelayArchiveBatchBefore(ctx, 200, 1)
	require.ErrorIs(t, err, context.Canceled)
	assert.Zero(t, deleted)

	remaining, err := CountRelayArchivesBefore(t.Context(), 200)
	require.NoError(t, err)
	assert.EqualValues(t, 1, remaining)
}
