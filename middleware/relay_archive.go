package middleware

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

const (
	relayArchiveMemoryThreshold        = 256 * 1024
	relayArchiveBinaryResponseMaxBytes = 64 * 1024
)

type relayArchiveSpool struct {
	mu           sync.Mutex
	memory       bytes.Buffer
	file         *os.File
	filePath     string
	observedSize int64
	storedSize   int64
	maxBytes     int64
	truncated    bool
	err          error
}

func (s *relayArchiveSpool) maxSize() int64 {
	if s.maxBytes > 0 {
		return s.maxBytes
	}
	return common.RelayArchiveMaxBodyBytes
}

// LowerMaxBytes reduces the storage ceiling without changing the number of
// bytes observed. It also trims data that was captured before the response
// content type made a smaller safety limit necessary.
func (s *relayArchiveSpool) LowerMaxBytes(maxBytes int64) {
	if maxBytes <= 0 {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if maxBytes >= s.maxSize() {
		return
	}
	s.maxBytes = maxBytes
	if s.storedSize <= maxBytes {
		return
	}
	s.truncated = true
	if s.file == nil {
		s.memory.Truncate(int(maxBytes))
		s.storedSize = maxBytes
		return
	}
	if err := s.file.Truncate(maxBytes); err != nil {
		s.err = err
		return
	}
	if _, err := s.file.Seek(maxBytes, io.SeekStart); err != nil {
		s.err = err
		return
	}
	s.storedSize = maxBytes
}

func (s *relayArchiveSpool) Write(data []byte) (int, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	originalSize := len(data)
	s.observedSize += int64(originalSize)
	if s.err != nil {
		return originalSize, nil
	}
	remaining := s.maxSize() - s.storedSize
	if remaining <= 0 {
		if originalSize > 0 {
			s.truncated = true
		}
		return originalSize, nil
	}
	storedData := data
	if int64(len(storedData)) > remaining {
		storedData = storedData[:remaining]
		s.truncated = true
	}
	if s.file == nil && s.storedSize+int64(len(storedData)) > relayArchiveMemoryThreshold {
		file, err := os.CreateTemp("", "new-api-relay-archive-*.tmp")
		if err != nil {
			s.err = err
			return originalSize, nil
		}
		filePath := file.Name()
		// Keep plaintext payloads anonymous: on Unix an open, unlinked file can
		// still be read through this descriptor but disappears automatically on
		// process exit. If unlinking is unavailable, fail capture instead of
		// leaving recoverable plaintext on disk.
		if err := os.Remove(filePath); err != nil {
			_ = file.Close()
			_ = os.Remove(filePath)
			s.err = err
			return originalSize, nil
		}
		if _, err := file.Write(s.memory.Bytes()); err != nil {
			_ = file.Close()
			s.err = err
			return originalSize, nil
		}
		s.memory.Reset()
		s.file = file
		s.filePath = filePath
	}

	var (
		n   int
		err error
	)
	if s.file != nil {
		n, err = s.file.Write(storedData)
	} else {
		n, err = s.memory.Write(storedData)
	}
	s.storedSize += int64(n)
	if err == nil && n != len(storedData) {
		err = io.ErrShortWrite
	}
	if err != nil {
		s.err = err
	}
	return originalSize, nil
}

func (s *relayArchiveSpool) WriteString(data string) (int, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	originalSize := len(data)
	s.observedSize += int64(originalSize)
	if s.err != nil {
		return originalSize, nil
	}
	remaining := s.maxSize() - s.storedSize
	if remaining <= 0 {
		if originalSize > 0 {
			s.truncated = true
		}
		return originalSize, nil
	}
	storedData := data
	if int64(len(storedData)) > remaining {
		storedData = storedData[:int(remaining)]
		s.truncated = true
	}
	if s.file == nil && s.storedSize+int64(len(storedData)) > relayArchiveMemoryThreshold {
		file, err := os.CreateTemp("", "new-api-relay-archive-*.tmp")
		if err != nil {
			s.err = err
			return originalSize, nil
		}
		filePath := file.Name()
		if err := os.Remove(filePath); err != nil {
			_ = file.Close()
			_ = os.Remove(filePath)
			s.err = err
			return originalSize, nil
		}
		if _, err := file.Write(s.memory.Bytes()); err != nil {
			_ = file.Close()
			s.err = err
			return originalSize, nil
		}
		s.memory.Reset()
		s.file = file
		s.filePath = filePath
	}

	var (
		n   int
		err error
	)
	if s.file != nil {
		n, err = io.WriteString(s.file, storedData)
	} else {
		n, err = s.memory.WriteString(storedData)
	}
	s.storedSize += int64(n)
	if err == nil && n != len(storedData) {
		err = io.ErrShortWrite
	}
	if err != nil {
		s.err = err
	}
	return originalSize, nil
}

func (s *relayArchiveSpool) RemainingCapacity() int64 {
	s.mu.Lock()
	defer s.mu.Unlock()
	remaining := s.maxSize() - s.storedSize
	if remaining < 0 {
		return 0
	}
	return remaining
}

func (s *relayArchiveSpool) RecordUnstoredBytes(size int64) {
	if size <= 0 {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.observedSize += size
	s.truncated = true
}

func (s *relayArchiveSpool) Reader() (io.Reader, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.err != nil {
		return nil, s.err
	}
	if s.file == nil {
		return bytes.NewReader(s.memory.Bytes()), nil
	}
	if _, err := s.file.Seek(0, io.SeekStart); err != nil {
		return nil, err
	}
	return s.file, nil
}

func (s *relayArchiveSpool) Err() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.err
}

func (s *relayArchiveSpool) ObservedSize() int64 {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.observedSize
}

func (s *relayArchiveSpool) StoredSize() int64 {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.storedSize
}

func (s *relayArchiveSpool) Truncated() bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.truncated
}

func (s *relayArchiveSpool) Close() {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.file != nil {
		_ = s.file.Close()
		if s.filePath != "" {
			_ = os.Remove(s.filePath)
		}
		s.file = nil
	}
}

type relayArchiveRequestBody struct {
	io.ReadCloser
	mu         sync.Mutex
	spool      *relayArchiveSpool
	reachedEOF bool
	readErr    error
}

func (b *relayArchiveRequestBody) Read(data []byte) (int, error) {
	n, err := b.ReadCloser.Read(data)
	if n > 0 {
		_, _ = b.spool.Write(data[:n])
	}
	b.mu.Lock()
	defer b.mu.Unlock()
	if err == io.EOF {
		b.reachedEOF = true
	} else if err != nil {
		b.readErr = err
	}
	return n, err
}

func (b *relayArchiveRequestBody) Complete(contentLength int64) bool {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.reachedEOF || contentLength == 0
}

func (b *relayArchiveRequestBody) Err() error {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.readErr
}

type relayArchiveResponseWriter struct {
	gin.ResponseWriter
	response         *relayArchiveSpool
	responseLimitSet sync.Once
	mu               sync.Mutex
	writeErr         error
}

func (w *relayArchiveResponseWriter) Write(data []byte) (int, error) {
	n, err := w.ResponseWriter.Write(data)
	if n > 0 {
		w.applyResponseLimit(data[:n])
		_, _ = w.response.Write(data[:n])
	}
	w.recordWriteError(n, len(data), err)
	return n, err
}

func (w *relayArchiveResponseWriter) WriteString(data string) (int, error) {
	n, err := w.ResponseWriter.WriteString(data)
	if n > 0 {
		sample := data[:n]
		if len(sample) > 512 {
			sample = sample[:512]
		}
		w.applyResponseLimit([]byte(sample))
		_, _ = w.response.WriteString(data[:n])
	}
	w.recordWriteError(n, len(data), err)
	return n, err
}

func (w *relayArchiveResponseWriter) recordWriteError(written, expected int, err error) {
	if err == nil && written == expected {
		return
	}
	if err == nil {
		err = io.ErrShortWrite
	}
	w.mu.Lock()
	defer w.mu.Unlock()
	if w.writeErr == nil {
		w.writeErr = err
	}
}

func (w *relayArchiveResponseWriter) Err() error {
	w.mu.Lock()
	defer w.mu.Unlock()
	return w.writeErr
}

func (w *relayArchiveResponseWriter) applyResponseLimit(sample []byte) {
	w.responseLimitSet.Do(func() {
		contentType := w.Header().Get("Content-Type")
		if contentType == "" {
			contentType = http.DetectContentType(sample)
		}
		if relayArchiveContentTypeIsBinary(contentType) {
			w.response.LowerMaxBytes(relayArchiveBinaryResponseMaxBytes)
		}
	})
}

func relayArchiveContentTypeIsBinary(contentType string) bool {
	mediaType := strings.ToLower(strings.TrimSpace(strings.SplitN(contentType, ";", 2)[0]))
	if mediaType == "" || strings.HasPrefix(mediaType, "text/") ||
		strings.HasSuffix(mediaType, "+json") || strings.HasSuffix(mediaType, "+xml") {
		return false
	}
	switch mediaType {
	case "application/json", "application/json-seq", "application/x-ndjson",
		"application/xml", "application/javascript", "application/x-javascript",
		"application/yaml", "application/x-yaml", "application/toml",
		"application/graphql", "application/sql", "application/x-www-form-urlencoded":
		return false
	default:
		return true
	}
}

type relayArchiveFrame struct {
	MessageType int    `json:"message_type"`
	Encoding    string `json:"encoding"`
	Data        string `json:"data"`
}

type relayArchiveFrameRecorder struct {
	request  *relayArchiveSpool
	response *relayArchiveSpool
}

func (r *relayArchiveFrameRecorder) RecordRequestFrame(messageType int, data []byte) {
	r.writeFrame(r.request, messageType, data)
}

func (r *relayArchiveFrameRecorder) RecordResponseFrame(messageType int, data []byte) {
	if messageType == websocket.BinaryMessage {
		r.response.LowerMaxBytes(relayArchiveBinaryResponseMaxBytes)
	}
	r.writeFrame(r.response, messageType, data)
}

func (r *relayArchiveFrameRecorder) writeFrame(spool *relayArchiveSpool, messageType int, data []byte) {
	frame := relayArchiveFrame{MessageType: messageType, Encoding: "utf-8"}
	remaining := spool.RemainingCapacity()
	frameBaseSize := int64(0)
	fullDataSize := int64(0)
	prefixLength := len(data)

	if utf8.Valid(data) {
		emptyFrame, err := common.Marshal(frame)
		if err != nil {
			return
		}
		frameBaseSize = int64(len(emptyFrame)) + 1
		budget := remaining - int64(len(emptyFrame)) - 1
		prefixLength, fullDataSize = relayArchiveJSONTextPrefix(data, budget)
		frame.Data = string(data[:prefixLength])
	} else {
		frame.Encoding = "base64"
		emptyFrame, err := common.Marshal(frame)
		if err != nil {
			return
		}
		frameBaseSize = int64(len(emptyFrame)) + 1
		budget := remaining - int64(len(emptyFrame)) - 1
		fullDataSize = int64(base64.StdEncoding.EncodedLen(len(data)))
		prefixLength = 0
		if budget >= 4 {
			prefixLength = int(budget/4) * 3
			if prefixLength > len(data) {
				prefixLength = len(data)
			}
		}
		frame.Data = base64.StdEncoding.EncodeToString(data[:prefixLength])
	}
	encoded, err := common.Marshal(frame)
	if err != nil {
		return
	}
	encoded = append(encoded, '\n')
	_, _ = spool.Write(encoded)
	fullEncodedSize := frameBaseSize + fullDataSize
	spool.RecordUnstoredBytes(fullEncodedSize - int64(len(encoded)))
}

func relayArchiveJSONTextPrefix(data []byte, budget int64) (int, int64) {
	prefixLength := 0
	scanOffset := 0
	encodedSize := int64(0)
	for scanOffset < len(data) {
		r, size := utf8.DecodeRune(data[scanOffset:])
		escapedSize := int64(size)
		switch r {
		case '\b', '\f', '\n', '\r', '\t', '"', '\\':
			escapedSize = 2
		case '<', '>', '&':
			escapedSize = 6
		case '\u2028', '\u2029':
			escapedSize = 6
		default:
			if r < 0x20 {
				escapedSize = 6
			}
		}
		if scanOffset == prefixLength && encodedSize+escapedSize <= budget {
			prefixLength = scanOffset + size
		}
		encodedSize += escapedSize
		scanOffset += size
	}
	return prefixLength, encodedSize
}

type relayArchiveCapture struct {
	startedAt            time.Time
	method               string
	path                 string
	requestContentType   string
	requestContentLength int64
	isWebSocketRequest   bool
	requestSpool         *relayArchiveSpool
	responseSpool        *relayArchiveSpool
	requestBody          *relayArchiveRequestBody
	writer               *relayArchiveResponseWriter
	finalizeOnce         sync.Once
}

func (capture *relayArchiveCapture) finalize(c *gin.Context, handlerPanicked bool) {
	capture.finalizeOnce.Do(func() {
		defer capture.requestSpool.Close()
		defer capture.responseSpool.Close()
		capture.persist(c, handlerPanicked)
	})
}

func (capture *relayArchiveCapture) persist(c *gin.Context, handlerPanicked bool) {
	captureErrors := make([]string, 0, 6)
	if handlerPanicked {
		captureErrors = appendArchiveCaptureError(captureErrors, "handler_panicked")
	}
	if capture.requestBody != nil && capture.requestBody.Err() != nil {
		captureErrors = appendArchiveCaptureError(captureErrors, "request_body_read_failed")
	}
	if capture.requestBody != nil && !capture.isWebSocketRequest &&
		!capture.requestBody.Complete(capture.requestContentLength) {
		captureErrors = appendArchiveCaptureError(captureErrors, "request_body_incomplete")
	}
	if capture.requestSpool.Truncated() {
		captureErrors = appendArchiveCaptureError(captureErrors, "request_body_truncated")
	}
	if capture.responseSpool.Truncated() {
		captureErrors = appendArchiveCaptureError(captureErrors, "response_body_truncated")
	}
	if capture.responseSpool.Err() != nil {
		captureErrors = appendArchiveCaptureError(captureErrors, "response_body_capture_failed")
	}
	if capture.writer.Err() != nil {
		captureErrors = appendArchiveCaptureError(captureErrors, "response_write_failed")
	}
	if c.Request.Context().Err() != nil {
		captureErrors = appendArchiveCaptureError(captureErrors, "client_disconnected")
	}

	userId := c.GetInt("id")
	if userId <= 0 {
		return
	}
	requestReader, requestErr := capture.requestSpool.Reader()
	if requestErr != nil {
		requestReader = nil
	}
	responseReader, responseErr := capture.responseSpool.Reader()
	if responseErr != nil {
		responseReader = nil
	}
	if requestErr != nil && !containsArchiveCaptureError(captureErrors, "request_body_read_failed") {
		captureErrors = appendArchiveCaptureError(captureErrors, "request_body_read_failed")
	}
	if responseErr != nil {
		captureErrors = appendArchiveCaptureError(captureErrors, "response_body_capture_failed")
	}

	statusCode := capture.writer.Status()
	transport := "http"
	responseContentType := capture.writer.Header().Get("Content-Type")
	isWebSocket := common.RelayArchiveWebSocketUpgraded(c)
	if isWebSocket {
		statusCode = http.StatusSwitchingProtocols
		transport = "websocket"
		capture.requestContentType = "application/x-ndjson"
		responseContentType = "application/x-ndjson"
	} else if handlerPanicked && !capture.writer.Written() {
		statusCode = http.StatusInternalServerError
	}
	isStream := isWebSocket || common.GetContextKeyBool(c, constant.ContextKeyIsStream) ||
		strings.Contains(strings.ToLower(responseContentType), "text/event-stream")

	archive := &model.RelayArchive{
		RequestId:           c.GetString(common.RequestIdKey),
		UserId:              userId,
		Username:            common.GetContextKeyString(c, constant.ContextKeyUserName),
		TokenId:             c.GetInt("token_id"),
		TokenName:           c.GetString("token_name"),
		CreatedAt:           capture.startedAt.Unix(),
		Method:              capture.method,
		Path:                capture.path,
		ModelName:           common.GetContextKeyString(c, constant.ContextKeyOriginalModel),
		ChannelId:           c.GetInt("channel_id"),
		StatusCode:          statusCode,
		IsStream:            isStream,
		Transport:           transport,
		DurationMs:          time.Since(capture.startedAt).Milliseconds(),
		RequestContentType:  capture.requestContentType,
		ResponseContentType: responseContentType,
		RequestSize:         capture.requestSpool.ObservedSize(),
		ResponseSize:        capture.responseSpool.ObservedSize(),
		RequestStoredSize:   capture.requestSpool.StoredSize(),
		ResponseStoredSize:  capture.responseSpool.StoredSize(),
		RequestTruncated:    capture.requestSpool.Truncated(),
		ResponseTruncated:   capture.responseSpool.Truncated(),
		CaptureError:        strings.Join(captureErrors, ","),
	}
	if err := model.CreateRelayArchive(archive, requestReader, responseReader); err != nil {
		logger.LogError(c, fmt.Sprintf("failed to persist relay request archive: %v", err))
	}
}

// RelayArchive records authenticated relay request/response bodies up to the
// configured safety limit and marks truncation or incomplete delivery. Mount
// it after TokenAuth/UserAuth and before distribution so authenticated
// failures are included without persisting credentials.
func RelayArchive() gin.HandlerFunc {
	return func(c *gin.Context) {
		if common.RelayArchiveSecret == "" {
			c.Next()
			return
		}

		requestSpool := &relayArchiveSpool{maxBytes: common.RelayArchiveMaxBodyBytes}
		responseSpool := &relayArchiveSpool{maxBytes: common.RelayArchiveMaxBodyBytes}

		capture := &relayArchiveCapture{
			startedAt:            time.Now(),
			method:               c.Request.Method,
			path:                 c.Request.URL.Path,
			requestContentType:   c.GetHeader("Content-Type"),
			requestContentLength: c.Request.ContentLength,
			isWebSocketRequest:   websocket.IsWebSocketUpgrade(c.Request),
			requestSpool:         requestSpool,
			responseSpool:        responseSpool,
		}
		if c.Request.Body != nil && c.Request.Body != http.NoBody {
			capture.requestBody = &relayArchiveRequestBody{
				ReadCloser: c.Request.Body,
				spool:      requestSpool,
			}
			c.Request.Body = capture.requestBody
		}

		capture.writer = &relayArchiveResponseWriter{ResponseWriter: c.Writer, response: responseSpool}
		c.Writer = capture.writer
		common.SetRelayArchiveFrameRecorder(c, &relayArchiveFrameRecorder{
			request:  requestSpool,
			response: responseSpool,
		})
		common.SetRelayArchivePanicFinalizer(c, func() {
			capture.finalize(c, true)
		})

		defer func() {
			recovered := recover()
			if recovered != nil {
				if !common.RelayArchivePanicRecoveryEnabled(c) {
					common.ClearRelayArchivePanicFinalizer(c)
					capture.finalize(c, true)
				}
				panic(recovered)
			}
			common.ClearRelayArchivePanicFinalizer(c)
			capture.finalize(c, false)
		}()
		c.Next()
	}
}

func appendArchiveCaptureError(values []string, value string) []string {
	if containsArchiveCaptureError(values, value) {
		return values
	}
	return append(values, value)
}

func containsArchiveCaptureError(values []string, target string) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}
	return false
}
