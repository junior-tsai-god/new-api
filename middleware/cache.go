package middleware

import (
	"github.com/gin-gonic/gin"
)

func Cache() func(c *gin.Context) {
	return func(c *gin.Context) {
		path := c.Request.URL.Path
		// Keep brand assets fresh; browsers otherwise sticky-cache /favicon.ico for days.
		if c.Request.RequestURI == "/" || path == "/favicon.ico" || path == "/logo.png" || path == "/logo.svg" {
			c.Header("Cache-Control", "no-cache")
		} else {
			c.Header("Cache-Control", "max-age=604800") // one week
		}
		c.Header("Cache-Version", "aivanta-brand-favicon-20260723")
		c.Next()
	}
}
