package middleware

import (
	"bytes"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/model"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/gorilla/websocket"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupRelayArchiveMiddlewareTest(t *testing.T) {
	t.Helper()
	previousDB := model.DB
	previousSecret := common.RelayArchiveSecret
	previousMaxBodyBytes := common.RelayArchiveMaxBodyBytes
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&model.User{}, &model.RelayArchive{}, &model.RelayArchiveChunk{}))
	model.DB = db
	require.NoError(t, db.Create(&model.User{
		Id: 23, Username: "archive-middleware-user", Password: "archive-password",
		Role: common.RoleCommonUser, Status: common.UserStatusEnabled,
		Group: "default", AuthVersion: 1,
	}).Error)
	common.RelayArchiveSecret = "middleware-relay-archive-test-secret"
	common.RelayArchiveMaxBodyBytes = 8 << 20
	t.Cleanup(func() {
		model.DB = previousDB
		common.RelayArchiveSecret = previousSecret
		common.RelayArchiveMaxBodyBytes = previousMaxBodyBytes
	})
}

func TestRelayArchiveCapturesAuthenticatedRequestAndStreamingResponse(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupRelayArchiveMiddlewareTest(t)

	router := gin.New()
	router.Use(RecoveryWithRelayArchive(func(c *gin.Context, err any) {
		c.Status(http.StatusInternalServerError)
	}))
	router.POST("/v1/chat/completions", func(c *gin.Context) {
		c.Set("id", 23)
		c.Set("token_id", 7)
		c.Set("token_name", "test-key")
		c.Set(common.RequestIdKey, "middleware-request-id")
		common.SetContextKey(c, constant.ContextKeyUserName, "test-user")
		common.SetContextKey(c, constant.ContextKeyOriginalModel, "gpt-test")
		c.Next()
	}, RelayArchive(), func(c *gin.Context) {
		body, err := io.ReadAll(c.Request.Body)
		require.NoError(t, err)
		assert.JSONEq(t, `{"model":"gpt-test","messages":[]}`, string(body))
		common.SetContextKey(c, constant.ContextKeyIsStream, true)
		c.Header("Content-Type", "text/event-stream")
		_, _ = c.Writer.WriteString("data: {\"delta\":\"hello\"}\n\n")
		_, _ = c.Writer.WriteString("data: [DONE]\n\n")
	})

	requestBody := `{"model":"gpt-test","messages":[]}`
	request := httptest.NewRequest(http.MethodPost, "/v1/chat/completions?key=must-not-be-stored", bytes.NewBufferString(requestBody))
	request.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)

	require.Equal(t, http.StatusOK, recorder.Code)
	archives, total, err := model.GetRelayArchives(model.RelayArchiveFilter{RequestId: "middleware-request-id"}, 0, 20)
	require.NoError(t, err)
	assert.EqualValues(t, 1, total)
	require.Len(t, archives, 1)
	archive := archives[0]
	assert.Equal(t, "/v1/chat/completions", archive.Path)
	assert.NotContains(t, archive.Path, "must-not-be-stored")
	assert.True(t, archive.IsStream)

	storedRequest, storedResponse, err := model.RevealRelayArchive(archive)
	require.NoError(t, err)
	assert.Equal(t, requestBody, string(storedRequest))
	assert.Equal(t, recorder.Body.String(), string(storedResponse))
}

func TestRelayArchivePersistsPanickedHandlerBeforeRecovery(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupRelayArchiveMiddlewareTest(t)

	router := gin.New()
	router.Use(RecoveryWithRelayArchive(func(c *gin.Context, err any) {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"message": "recovered panic response"},
		})
	}))
	router.POST("/v1/responses", func(c *gin.Context) {
		c.Set("id", 23)
		c.Set(common.RequestIdKey, "panicked-handler-archive")
		c.Next()
	}, RelayArchive(), func(c *gin.Context) {
		_, _ = io.ReadAll(c.Request.Body)
		panic("archive panic regression")
	})

	requestBody := `{"model":"gpt-test","input":"hello"}`
	request := httptest.NewRequest(http.MethodPost, "/v1/responses", bytes.NewBufferString(requestBody))
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)

	assert.Equal(t, http.StatusInternalServerError, response.Code)
	archives, total, err := model.GetRelayArchives(model.RelayArchiveFilter{RequestId: "panicked-handler-archive"}, 0, 20)
	require.NoError(t, err)
	assert.EqualValues(t, 1, total)
	require.Len(t, archives, 1)
	archive := archives[0]
	assert.Equal(t, http.StatusInternalServerError, archive.StatusCode)
	assert.Contains(t, archive.CaptureError, "handler_panicked")

	storedRequest, storedResponse, err := model.RevealRelayArchive(archive)
	require.NoError(t, err)
	assert.Equal(t, requestBody, string(storedRequest))
	assert.JSONEq(t, response.Body.String(), string(storedResponse))
}

func TestRelayArchiveDoesNotMarkFailedWebSocketUpgradeAs101(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupRelayArchiveMiddlewareTest(t)

	router := gin.New()
	router.GET("/v1/realtime", func(c *gin.Context) {
		c.Set("id", 23)
		c.Set(common.RequestIdKey, "failed-websocket-upgrade")
		c.Next()
	}, RelayArchive(), func(c *gin.Context) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "upgrade rejected"})
	})

	request := httptest.NewRequest(http.MethodGet, "/v1/realtime", nil)
	request.Header.Set("Connection", "Upgrade")
	request.Header.Set("Upgrade", "websocket")
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)

	archives, total, err := model.GetRelayArchives(model.RelayArchiveFilter{RequestId: "failed-websocket-upgrade"}, 0, 20)
	require.NoError(t, err)
	assert.EqualValues(t, 1, total)
	require.Len(t, archives, 1)
	assert.Equal(t, http.StatusBadRequest, archives[0].StatusCode)
	assert.Equal(t, "http", archives[0].Transport)
}

func TestRelayArchiveMarksAndStoresBoundedPrefixes(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupRelayArchiveMiddlewareTest(t)
	common.RelayArchiveMaxBodyBytes = 8

	router := gin.New()
	router.POST("/v1/responses", func(c *gin.Context) {
		c.Set("id", 23)
		c.Set(common.RequestIdKey, "bounded-request-archive")
		c.Next()
	}, RelayArchive(), func(c *gin.Context) {
		_, _ = io.ReadAll(c.Request.Body)
		_, _ = c.Writer.WriteString("response-long")
	})

	requestBody := "request-long"
	request := httptest.NewRequest(http.MethodPost, "/v1/responses", bytes.NewBufferString(requestBody))
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)

	archives, total, err := model.GetRelayArchives(model.RelayArchiveFilter{RequestId: "bounded-request-archive"}, 0, 20)
	require.NoError(t, err)
	assert.EqualValues(t, 1, total)
	require.Len(t, archives, 1)
	archive := archives[0]
	assert.EqualValues(t, len(requestBody), archive.RequestSize)
	assert.EqualValues(t, len(response.Body.Bytes()), archive.ResponseSize)
	assert.EqualValues(t, 8, archive.RequestStoredSize)
	assert.EqualValues(t, 8, archive.ResponseStoredSize)
	assert.True(t, archive.RequestTruncated)
	assert.True(t, archive.ResponseTruncated)
	assert.Contains(t, archive.CaptureError, "request_body_truncated")
	assert.Contains(t, archive.CaptureError, "response_body_truncated")

	storedRequest, storedResponse, err := model.RevealRelayArchive(archive)
	require.NoError(t, err)
	assert.Equal(t, requestBody[:8], string(storedRequest))
	assert.Equal(t, response.Body.String()[:8], string(storedResponse))
}

func TestRelayArchiveStoresBinaryResponseBodyAtBinaryLimit(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupRelayArchiveMiddlewareTest(t)
	payload := bytes.Repeat([]byte{0xff}, relayArchiveBinaryResponseMaxBytes)

	router := gin.New()
	router.GET("/v1/videos/task/content", func(c *gin.Context) {
		c.Set("id", 23)
		c.Set(common.RequestIdKey, "binary-response-archive")
		c.Next()
	}, RelayArchive(), func(c *gin.Context) {
		c.Header("Content-Type", "video/mp4")
		_, _ = c.Writer.Write(payload)
	})

	request := httptest.NewRequest(http.MethodGet, "/v1/videos/task/content", nil)
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)

	archives, total, err := model.GetRelayArchives(model.RelayArchiveFilter{RequestId: "binary-response-archive"}, 0, 20)
	require.NoError(t, err)
	assert.EqualValues(t, 1, total)
	require.Len(t, archives, 1)
	archive := archives[0]
	assert.EqualValues(t, response.Body.Len(), archive.ResponseSize)
	assert.EqualValues(t, response.Body.Len(), archive.ResponseStoredSize)
	assert.False(t, archive.ResponseTruncated)
	assert.NotContains(t, archive.CaptureError, "response_body_truncated")

	_, storedResponse, err := model.RevealRelayArchive(archive)
	require.NoError(t, err)
	assert.Equal(t, response.Body.Bytes(), storedResponse)
}

func TestRelayArchiveTruncatesBinaryResponseAboveBinaryLimit(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupRelayArchiveMiddlewareTest(t)
	payload := bytes.Repeat([]byte{0xff}, relayArchiveBinaryResponseMaxBytes+1)

	router := gin.New()
	router.GET("/v1/videos/task/content", func(c *gin.Context) {
		c.Set("id", 23)
		c.Set(common.RequestIdKey, "large-binary-response-archive")
		c.Next()
	}, RelayArchive(), func(c *gin.Context) {
		c.Header("Content-Type", "video/mp4")
		_, _ = c.Writer.Write(payload)
	})

	request := httptest.NewRequest(http.MethodGet, "/v1/videos/task/content", nil)
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)

	assert.Equal(t, payload, response.Body.Bytes())
	archives, total, err := model.GetRelayArchives(model.RelayArchiveFilter{RequestId: "large-binary-response-archive"}, 0, 20)
	require.NoError(t, err)
	assert.EqualValues(t, 1, total)
	require.Len(t, archives, 1)
	archive := archives[0]
	assert.EqualValues(t, len(payload), archive.ResponseSize)
	assert.EqualValues(t, relayArchiveBinaryResponseMaxBytes, archive.ResponseStoredSize)
	assert.True(t, archive.ResponseTruncated)
	assert.Contains(t, archive.CaptureError, "response_body_truncated")

	_, storedResponse, err := model.RevealRelayArchive(archive)
	require.NoError(t, err)
	assert.Equal(t, payload[:relayArchiveBinaryResponseMaxBytes], storedResponse)
}

func TestRelayArchiveKeepsTextResponseAboveBinaryLimit(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupRelayArchiveMiddlewareTest(t)
	common.RelayArchiveMaxBodyBytes = relayArchiveBinaryResponseMaxBytes + 1024
	payload := bytes.Repeat([]byte("x"), relayArchiveBinaryResponseMaxBytes+1)

	router := gin.New()
	router.GET("/v1/responses", func(c *gin.Context) {
		c.Set("id", 23)
		c.Set(common.RequestIdKey, "large-text-response-archive")
		c.Next()
	}, RelayArchive(), func(c *gin.Context) {
		c.Header("Content-Type", "application/json")
		_, _ = c.Writer.Write(payload)
	})

	request := httptest.NewRequest(http.MethodGet, "/v1/responses", nil)
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)

	archives, total, err := model.GetRelayArchives(model.RelayArchiveFilter{RequestId: "large-text-response-archive"}, 0, 20)
	require.NoError(t, err)
	assert.EqualValues(t, 1, total)
	require.Len(t, archives, 1)
	archive := archives[0]
	assert.EqualValues(t, len(payload), archive.ResponseStoredSize)
	assert.False(t, archive.ResponseTruncated)

	_, storedResponse, err := model.RevealRelayArchive(archive)
	require.NoError(t, err)
	assert.Equal(t, payload, storedResponse)
}

func TestRelayArchiveSpoolMovesLargePayloadToPrivateTemporaryFile(t *testing.T) {
	spool := &relayArchiveSpool{}
	payload := bytes.Repeat([]byte("x"), relayArchiveMemoryThreshold+1)
	n, err := spool.Write(payload)
	require.NoError(t, err)
	assert.Equal(t, len(payload), n)
	require.NotNil(t, spool.file)
	path := spool.filePath
	info, err := spool.file.Stat()
	require.NoError(t, err)
	assert.Equal(t, os.FileMode(0600), info.Mode().Perm())
	_, err = os.Stat(path)
	assert.True(t, os.IsNotExist(err), "plaintext spool must be unlinked immediately")

	reader, err := spool.Reader()
	require.NoError(t, err)
	actual, err := io.ReadAll(reader)
	require.NoError(t, err)
	assert.Equal(t, payload, actual)

	spool.Close()
	_, err = os.Stat(path)
	assert.True(t, os.IsNotExist(err))
}

func TestRelayArchiveSpoolCapsStoredBytesWithoutShortWritingCaller(t *testing.T) {
	spool := &relayArchiveSpool{maxBytes: 8}
	payload := []byte("twelve-bytes")

	n, err := spool.Write(payload)
	require.NoError(t, err)
	assert.Equal(t, len(payload), n)
	assert.EqualValues(t, len(payload), spool.ObservedSize())
	assert.EqualValues(t, 8, spool.StoredSize())
	assert.True(t, spool.Truncated())

	reader, err := spool.Reader()
	require.NoError(t, err)
	actual, err := io.ReadAll(reader)
	require.NoError(t, err)
	assert.Equal(t, payload[:8], actual)
}

func TestRelayArchiveSpoolCapsStringWithoutAllocatingCallerSizedByteSlice(t *testing.T) {
	spool := &relayArchiveSpool{maxBytes: 8}
	payload := "twelve-bytes"

	n, err := spool.WriteString(payload)
	require.NoError(t, err)
	assert.Equal(t, len(payload), n)
	assert.EqualValues(t, len(payload), spool.ObservedSize())
	assert.EqualValues(t, 8, spool.StoredSize())
	assert.True(t, spool.Truncated())

	reader, err := spool.Reader()
	require.NoError(t, err)
	actual, err := io.ReadAll(reader)
	require.NoError(t, err)
	assert.Equal(t, payload[:8], string(actual))
}

func TestRelayArchiveSpoolLowerLimitTruncatesAlreadyStoredFile(t *testing.T) {
	spool := &relayArchiveSpool{maxBytes: relayArchiveMemoryThreshold * 2}
	t.Cleanup(spool.Close)
	payload := bytes.Repeat([]byte("x"), relayArchiveMemoryThreshold+1)

	n, err := spool.Write(payload)
	require.NoError(t, err)
	assert.Equal(t, len(payload), n)
	require.NotNil(t, spool.file)

	spool.LowerMaxBytes(relayArchiveBinaryResponseMaxBytes)
	assert.EqualValues(t, len(payload), spool.ObservedSize())
	assert.EqualValues(t, relayArchiveBinaryResponseMaxBytes, spool.StoredSize())
	assert.True(t, spool.Truncated())

	reader, err := spool.Reader()
	require.NoError(t, err)
	actual, err := io.ReadAll(reader)
	require.NoError(t, err)
	assert.Equal(t, payload[:relayArchiveBinaryResponseMaxBytes], actual)

	n, err = spool.Write([]byte("more"))
	require.NoError(t, err)
	assert.Equal(t, len("more"), n)
	assert.EqualValues(t, len(payload)+len("more"), spool.ObservedSize())
	assert.EqualValues(t, relayArchiveBinaryResponseMaxBytes, spool.StoredSize())
}

func TestRelayArchiveFrameRecorderPreservesTextAndBinaryFrames(t *testing.T) {
	requestSpool := &relayArchiveSpool{}
	responseSpool := &relayArchiveSpool{}
	recorder := &relayArchiveFrameRecorder{
		request:  requestSpool,
		response: responseSpool,
	}

	recorder.RecordRequestFrame(1, []byte(`{"type":"session.update"}`))
	recorder.RecordResponseFrame(2, []byte{0xff, 0x00, 0x7f})

	requestReader, err := requestSpool.Reader()
	require.NoError(t, err)
	requestData, err := io.ReadAll(requestReader)
	require.NoError(t, err)
	responseReader, err := responseSpool.Reader()
	require.NoError(t, err)
	responseData, err := io.ReadAll(responseReader)
	require.NoError(t, err)

	requestFrame := &relayArchiveFrame{}
	require.NoError(t, common.Unmarshal(bytes.TrimSpace(requestData), requestFrame))
	assert.Equal(t, 1, requestFrame.MessageType)
	assert.Equal(t, "utf-8", requestFrame.Encoding)
	assert.Equal(t, `{"type":"session.update"}`, requestFrame.Data)

	responseFrame := &relayArchiveFrame{}
	require.NoError(t, common.Unmarshal(bytes.TrimSpace(responseData), responseFrame))
	assert.Equal(t, 2, responseFrame.MessageType)
	assert.Equal(t, "base64", responseFrame.Encoding)
	assert.Equal(t, "/wB/", responseFrame.Data)
}

func TestRelayArchiveFrameRecorderBoundsLargeFrameBeforeEncoding(t *testing.T) {
	spool := &relayArchiveSpool{maxBytes: 256}
	recorder := &relayArchiveFrameRecorder{request: spool, response: &relayArchiveSpool{}}
	payload := bytes.Repeat([]byte("<"), 4096)

	recorder.RecordRequestFrame(websocket.TextMessage, payload)

	assert.LessOrEqual(t, spool.StoredSize(), int64(256))
	assert.Greater(t, spool.ObservedSize(), spool.StoredSize())
	assert.True(t, spool.Truncated())
	reader, err := spool.Reader()
	require.NoError(t, err)
	stored, err := io.ReadAll(reader)
	require.NoError(t, err)
	frame := &relayArchiveFrame{}
	require.NoError(t, common.Unmarshal(bytes.TrimSpace(stored), frame))
	assert.Equal(t, websocket.TextMessage, frame.MessageType)
	assert.Equal(t, "utf-8", frame.Encoding)
	assert.NotEmpty(t, frame.Data)
}

func TestRelayArchiveFrameRecorderHandlesFrameAfterSpoolIsFull(t *testing.T) {
	spool := &relayArchiveSpool{maxBytes: 1}
	_, err := spool.Write([]byte("x"))
	require.NoError(t, err)
	recorder := &relayArchiveFrameRecorder{request: spool, response: &relayArchiveSpool{}}

	recorder.RecordRequestFrame(websocket.TextMessage, []byte("still-valid-utf8"))

	assert.EqualValues(t, 1, spool.StoredSize())
	assert.Greater(t, spool.ObservedSize(), spool.StoredSize())
	assert.True(t, spool.Truncated())
}

func TestRelayArchiveFrameRecorderBoundsLargeBinaryFrameBeforeEncoding(t *testing.T) {
	spool := &relayArchiveSpool{maxBytes: 256}
	recorder := &relayArchiveFrameRecorder{request: &relayArchiveSpool{}, response: spool}
	payload := bytes.Repeat([]byte{0xff}, 4096)

	recorder.RecordResponseFrame(websocket.BinaryMessage, payload)

	assert.LessOrEqual(t, spool.StoredSize(), int64(256))
	assert.Greater(t, spool.ObservedSize(), spool.StoredSize())
	assert.True(t, spool.Truncated())
	reader, err := spool.Reader()
	require.NoError(t, err)
	stored, err := io.ReadAll(reader)
	require.NoError(t, err)
	frame := &relayArchiveFrame{}
	require.NoError(t, common.Unmarshal(bytes.TrimSpace(stored), frame))
	assert.Equal(t, websocket.BinaryMessage, frame.MessageType)
	assert.Equal(t, "base64", frame.Encoding)
	assert.NotEmpty(t, frame.Data)
}

func TestRelayArchiveFrameRecorderAppliesBinaryResponseLimit(t *testing.T) {
	spool := &relayArchiveSpool{maxBytes: relayArchiveBinaryResponseMaxBytes * 2}
	recorder := &relayArchiveFrameRecorder{request: &relayArchiveSpool{}, response: spool}
	payload := bytes.Repeat([]byte{0xff}, relayArchiveBinaryResponseMaxBytes*2)

	recorder.RecordResponseFrame(websocket.BinaryMessage, payload)

	assert.LessOrEqual(t, spool.StoredSize(), int64(relayArchiveBinaryResponseMaxBytes))
	assert.Positive(t, spool.StoredSize())
	assert.Greater(t, spool.ObservedSize(), spool.StoredSize())
	assert.True(t, spool.Truncated())
	reader, err := spool.Reader()
	require.NoError(t, err)
	stored, err := io.ReadAll(reader)
	require.NoError(t, err)
	assert.EqualValues(t, spool.StoredSize(), len(stored))
}
