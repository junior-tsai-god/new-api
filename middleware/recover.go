package middleware

import (
	"fmt"
	"net/http"
	"runtime/debug"

	"github.com/QuantumNous/new-api/common"
	"github.com/gin-gonic/gin"
)

// RecoveryWithRelayArchive keeps Gin's recovery behavior while allowing an
// inner relay archive middleware to persist the final panic response after the
// recovery handler writes it.
func RecoveryWithRelayArchive(handler func(c *gin.Context, err any)) gin.HandlerFunc {
	recovery := gin.CustomRecovery(handler)
	return func(c *gin.Context) {
		common.MarkRelayArchivePanicRecovery(c)
		recovery(c)
		common.FinalizeRelayArchivePanic(c)
	}
}

func RelayPanicRecover() gin.HandlerFunc {
	return func(c *gin.Context) {
		common.MarkRelayArchivePanicRecovery(c)
		defer func() {
			if err := recover(); err != nil {
				common.SysLog(fmt.Sprintf("panic detected: %v", err))
				common.SysLog(fmt.Sprintf("stacktrace from panic: %s", string(debug.Stack())))
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": gin.H{
						"message": fmt.Sprintf("Panic detected, error: %v. Please submit a issue here: https://github.com/Calcium-Ion/new-api", err),
						"type":    "new_api_panic",
					},
				})
				common.FinalizeRelayArchivePanic(c)
				c.Abort()
			}
		}()
		c.Next()
		common.FinalizeRelayArchivePanic(c)
	}
}
