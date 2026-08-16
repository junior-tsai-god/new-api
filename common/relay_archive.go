package common

import "github.com/gin-gonic/gin"

const (
	relayArchiveRecorderKey          = "relay_archive_recorder"
	relayArchiveWebSocketUpgradedKey = "relay_archive_websocket_upgraded"
	relayArchivePanicRecoveryKey     = "relay_archive_panic_recovery"
	relayArchivePanicFinalizerKey    = "relay_archive_panic_finalizer"
)

// RelayArchiveFrameRecorder records application-level WebSocket frames. HTTP
// response bytes are captured by the relay archive response writer, while
// upgraded WebSocket frames bypass it and must be recorded explicitly.
type RelayArchiveFrameRecorder interface {
	RecordRequestFrame(messageType int, data []byte)
	RecordResponseFrame(messageType int, data []byte)
}

func SetRelayArchiveFrameRecorder(c *gin.Context, recorder RelayArchiveFrameRecorder) {
	if c == nil || recorder == nil {
		return
	}
	c.Set(relayArchiveRecorderKey, recorder)
}

func RecordRelayArchiveRequestFrame(c *gin.Context, messageType int, data []byte) {
	if c == nil {
		return
	}
	value, ok := c.Get(relayArchiveRecorderKey)
	if !ok {
		return
	}
	if recorder, ok := value.(RelayArchiveFrameRecorder); ok {
		recorder.RecordRequestFrame(messageType, data)
	}
}

func RecordRelayArchiveResponseFrame(c *gin.Context, messageType int, data []byte) {
	if c == nil {
		return
	}
	value, ok := c.Get(relayArchiveRecorderKey)
	if !ok {
		return
	}
	if recorder, ok := value.(RelayArchiveFrameRecorder); ok {
		recorder.RecordResponseFrame(messageType, data)
	}
}

func MarkRelayArchiveWebSocketUpgraded(c *gin.Context) {
	if c != nil {
		c.Set(relayArchiveWebSocketUpgradedKey, true)
	}
}

func RelayArchiveWebSocketUpgraded(c *gin.Context) bool {
	return c != nil && c.GetBool(relayArchiveWebSocketUpgradedKey)
}

// MarkRelayArchivePanicRecovery tells the archive middleware that an outer
// recovery handler will finish persistence after it writes the client-facing
// panic response.
func MarkRelayArchivePanicRecovery(c *gin.Context) {
	if c != nil {
		c.Set(relayArchivePanicRecoveryKey, true)
	}
}

func RelayArchivePanicRecoveryEnabled(c *gin.Context) bool {
	return c != nil && c.GetBool(relayArchivePanicRecoveryKey)
}

func SetRelayArchivePanicFinalizer(c *gin.Context, finalizer func()) {
	if c == nil || finalizer == nil {
		return
	}
	c.Set(relayArchivePanicFinalizerKey, finalizer)
}

func ClearRelayArchivePanicFinalizer(c *gin.Context) {
	if c != nil {
		c.Set(relayArchivePanicFinalizerKey, nil)
	}
}

// FinalizeRelayArchivePanic consumes the pending finalizer so repeated
// recovery hooks cannot persist the same archive twice.
func FinalizeRelayArchivePanic(c *gin.Context) bool {
	if c == nil {
		return false
	}
	value, ok := c.Get(relayArchivePanicFinalizerKey)
	if !ok {
		return false
	}
	finalizer, ok := value.(func())
	if !ok || finalizer == nil {
		return false
	}
	c.Set(relayArchivePanicFinalizerKey, nil)
	finalizer()
	return true
}
