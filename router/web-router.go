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

// ThemeAssets holds the embedded frontend assets for both themes.
type ThemeAssets struct {
	DefaultBuildFS   embed.FS
	DefaultIndexPage []byte
	ClassicBuildFS   embed.FS
	ClassicIndexPage []byte
}

func SetWebRouter(router *gin.Engine, assets ThemeAssets) {
	defaultFS := common.EmbedFolder(assets.DefaultBuildFS, "web/default/dist")
	defaultIndexPath := ""
	if distDir := strings.TrimSpace(os.Getenv("FRONTEND_DIST_DIR")); distDir != "" {
		indexPath := filepath.Join(distDir, "index.html")
		if info, err := os.Stat(distDir); err == nil && info.IsDir() {
			if _, err = os.Stat(indexPath); err == nil {
				defaultFS = common.DiskFolder(distDir)
				defaultIndexPath = indexPath
				common.SysLog("Serving default frontend from " + distDir)
			} else {
				common.SysError("FRONTEND_DIST_DIR has no readable index.html; using embedded frontend: " + err.Error())
			}
		} else if err != nil {
			common.SysError("FRONTEND_DIST_DIR is unavailable; using embedded frontend: " + err.Error())
		}
	}
	classicFS := common.EmbedFolder(assets.ClassicBuildFS, "web/classic/dist")
	themeFS := common.NewThemeAwareFS(defaultFS, classicFS)

	router.Use(gzip.Gzip(gzip.DefaultCompression))
	router.Use(middleware.GlobalWebRateLimit())
	router.Use(middleware.Cache())
	router.Use(static.Serve("/", themeFS))
	router.NoRoute(func(c *gin.Context) {
		c.Set(middleware.RouteTagKey, "web")
		if strings.HasPrefix(c.Request.RequestURI, "/v1") || strings.HasPrefix(c.Request.RequestURI, "/api") || strings.HasPrefix(c.Request.RequestURI, "/assets") {
			controller.RelayNotFound(c)
			return
		}
		c.Header("Cache-Control", "no-cache")
		if common.GetTheme() == "classic" {
			c.Data(http.StatusOK, "text/html; charset=utf-8", assets.ClassicIndexPage)
		} else {
			indexPage := assets.DefaultIndexPage
			if defaultIndexPath != "" {
				if runtimeIndexPage, err := os.ReadFile(defaultIndexPath); err == nil {
					indexPage = runtimeIndexPage
				} else {
					common.SysError("Failed to read runtime frontend index; using embedded frontend: " + err.Error())
				}
			}
			c.Data(http.StatusOK, "text/html; charset=utf-8", indexPage)
		}
	})
}
