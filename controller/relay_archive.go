package controller

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func GetRelayArchives(c *gin.Context) {
	pageInfo := common.GetPageQuery(c)
	statusCode, _ := strconv.Atoi(c.Query("status_code"))
	startTimestamp, _ := strconv.ParseInt(c.Query("start_timestamp"), 10, 64)
	endTimestamp, _ := strconv.ParseInt(c.Query("end_timestamp"), 10, 64)

	archives, total, err := model.GetRelayArchives(model.RelayArchiveFilter{
		Username:       c.Query("username"),
		ModelName:      c.Query("model_name"),
		RequestId:      c.Query("request_id"),
		Path:           c.Query("path"),
		StatusCode:     statusCode,
		StartTimestamp: startTimestamp,
		EndTimestamp:   endTimestamp,
	}, pageInfo.GetStartIdx(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	setRelayArchiveResponseHeaders(c)
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(archives)
	common.ApiSuccess(c, pageInfo)
}

func RevealRelayArchive(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid archive id"})
		return
	}
	archive, err := model.GetRelayArchiveByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "request archive not found"})
			return
		}
		common.ApiError(c, err)
		return
	}
	requestBody, responseBody, err := model.RevealRelayArchive(archive)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	requestText, requestEncoding := model.EncodeRelayArchiveBody(archive.RequestContentType, requestBody)
	responseText, responseEncoding := model.EncodeRelayArchiveBody(archive.ResponseContentType, responseBody)
	recordManageAudit(c, "request_archive.read", map[string]interface{}{
		"archive_id": archive.Id,
		"request_id": archive.RequestId,
	})

	setRelayArchiveResponseHeaders(c)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data": gin.H{
			"id":                     archive.Id,
			"request_id":             archive.RequestId,
			"user_id":                archive.UserId,
			"username":               archive.Username,
			"token_id":               archive.TokenId,
			"token_name":             archive.TokenName,
			"created_at":             archive.CreatedAt,
			"method":                 archive.Method,
			"path":                   archive.Path,
			"model_name":             archive.ModelName,
			"channel_id":             archive.ChannelId,
			"status_code":            archive.StatusCode,
			"is_stream":              archive.IsStream,
			"transport":              archive.Transport,
			"duration_ms":            archive.DurationMs,
			"request_content_type":   archive.RequestContentType,
			"response_content_type":  archive.ResponseContentType,
			"request_size":           archive.RequestSize,
			"response_size":          archive.ResponseSize,
			"request_stored_size":    archive.RequestStoredSize,
			"response_stored_size":   archive.ResponseStoredSize,
			"request_truncated":      archive.RequestTruncated,
			"response_truncated":     archive.ResponseTruncated,
			"capture_error":          archive.CaptureError,
			"request_body":           requestText,
			"request_body_encoding":  requestEncoding,
			"response_body":          responseText,
			"response_body_encoding": responseEncoding,
		},
	})
}

func setRelayArchiveResponseHeaders(c *gin.Context) {
	c.Header("Cache-Control", "no-store, private")
	c.Header("Pragma", "no-cache")
	c.Header("X-Content-Type-Options", "nosniff")
}
