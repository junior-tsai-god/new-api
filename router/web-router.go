package router

import (
	"embed"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/controller"
	"github.com/QuantumNous/new-api/middleware"
	"github.com/gin-contrib/gzip"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
)

// WebAssets holds the embedded dashboard frontend assets.
type WebAssets struct {
	BuildFS   embed.FS
	IndexPage []byte
}

func SetWebRouter(router *gin.Engine, assets WebAssets) {
	frontendFS := common.EmbedFolder(assets.BuildFS, "web/dist")
	frontendIndexPath := ""
	if distDir := strings.TrimSpace(os.Getenv("FRONTEND_DIST_DIR")); distDir != "" {
		indexPath := filepath.Join(distDir, "index.html")
		if info, err := os.Stat(distDir); err == nil && info.IsDir() {
			if _, err = os.Stat(indexPath); err == nil {
				frontendFS = common.DiskFolder(distDir)
				frontendIndexPath = indexPath
				common.SysLog("Serving frontend from " + distDir)
			} else {
				common.SysError("FRONTEND_DIST_DIR has no readable index.html; using embedded frontend: " + err.Error())
			}
		} else if err != nil {
			common.SysError("FRONTEND_DIST_DIR is unavailable; using embedded frontend: " + err.Error())
		} else {
			common.SysError("FRONTEND_DIST_DIR is not a directory; using embedded frontend")
		}
	}

	router.Use(gzip.Gzip(gzip.DefaultCompression))
	router.Use(middleware.GlobalWebRateLimit())
	router.Use(middleware.Cache())
	router.Use(static.Serve("/", frontendFS))
	router.NoRoute(func(c *gin.Context) {
		c.Set(middleware.RouteTagKey, "web")
		if strings.HasPrefix(c.Request.RequestURI, "/v1") || strings.HasPrefix(c.Request.RequestURI, "/api") || strings.HasPrefix(c.Request.RequestURI, "/assets") {
			controller.RelayNotFound(c)
			return
		}
		c.Header("Cache-Control", "no-cache")
		indexPage := assets.IndexPage
		if frontendIndexPath != "" {
			if runtimeIndexPage, err := os.ReadFile(frontendIndexPath); err == nil {
				indexPage = runtimeIndexPage
			} else {
				common.SysError("Failed to read runtime frontend index; using embedded frontend: " + err.Error())
			}
		}
		c.Data(http.StatusOK, "text/html; charset=utf-8", indexPage)
	})
}
