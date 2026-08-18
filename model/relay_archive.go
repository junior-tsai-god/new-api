package model

import (
	"bytes"
	"compress/gzip"
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"mime"
	"strings"
	"unicode/utf8"

	"github.com/QuantumNous/new-api/common"

	"gorm.io/gorm"
)

const (
	relayArchiveChunkSize         = 32 * 1024
	relayArchiveChunkBatchSize    = 64
	RelayArchiveDirectionRequest  = "request"
	RelayArchiveDirectionResponse = "response"
	RelayArchiveEncoding          = "chunked-gzip-aes256gcm-v1"
)

type RelayArchive struct {
	Id                  int64  `json:"id" gorm:"index:idx_relay_archives_created_id,priority:2"`
	RequestId           string `json:"request_id" gorm:"type:varchar(64);uniqueIndex"`
	UserId              int    `json:"user_id" gorm:"index:idx_relay_archives_user_created,priority:1"`
	Username            string `json:"username" gorm:"type:varchar(128);index"`
	TokenId             int    `json:"token_id" gorm:"index"`
	TokenName           string `json:"token_name" gorm:"type:varchar(128)"`
	CreatedAt           int64  `json:"created_at" gorm:"bigint;index:idx_relay_archives_created_id,priority:1;index:idx_relay_archives_user_created,priority:2"`
	Method              string `json:"method" gorm:"type:varchar(16)"`
	Path                string `json:"path" gorm:"type:varchar(512)"`
	ModelName           string `json:"model_name" gorm:"type:varchar(191);index"`
	ChannelId           int    `json:"channel_id" gorm:"index"`
	StatusCode          int    `json:"status_code" gorm:"index"`
	IsStream            bool   `json:"is_stream"`
	Transport           string `json:"transport" gorm:"type:varchar(16)"`
	DurationMs          int64  `json:"duration_ms" gorm:"bigint"`
	RequestContentType  string `json:"request_content_type" gorm:"type:varchar(255)"`
	ResponseContentType string `json:"response_content_type" gorm:"type:varchar(255)"`
	RequestSize         int64  `json:"request_size" gorm:"bigint"`
	ResponseSize        int64  `json:"response_size" gorm:"bigint"`
	RequestStoredSize   int64  `json:"request_stored_size" gorm:"bigint"`
	ResponseStoredSize  int64  `json:"response_stored_size" gorm:"bigint"`
	RequestTruncated    bool   `json:"request_truncated"`
	ResponseTruncated   bool   `json:"response_truncated"`
	RequestSha256       string `json:"-" gorm:"type:char(64)"`
	ResponseSha256      string `json:"-" gorm:"type:char(64)"`
	CaptureError        string `json:"capture_error" gorm:"type:varchar(255)"`
	PayloadEncoding     string `json:"-" gorm:"type:varchar(64)"`
	EncryptionKeyId     string `json:"-" gorm:"type:varchar(32)"`
}

type RelayArchiveChunk struct {
	Id        int64  `json:"-"`
	ArchiveId int64  `json:"-" gorm:"uniqueIndex:idx_relay_archive_chunk,priority:1;index"`
	Direction string `json:"-" gorm:"type:varchar(8);uniqueIndex:idx_relay_archive_chunk,priority:2"`
	Sequence  int    `json:"-" gorm:"uniqueIndex:idx_relay_archive_chunk,priority:3"`
	PlainSize int    `json:"-"`
	Payload   string `json:"-" gorm:"type:text"`
}

type RelayArchiveFilter struct {
	Username       string
	ModelName      string
	RequestId      string
	Path           string
	StatusCode     int
	StartTimestamp int64
	EndTimestamp   int64
}

func GetUserCompletedWithoutConsumeRelayArchiveRequestIds(userId int, requestIds []string) ([]string, error) {
	if userId <= 0 || len(requestIds) == 0 {
		return []string{}, nil
	}
	settledRequestIds := make([]string, 0, len(requestIds))
	err := DB.Model(&RelayArchive{}).
		Where(
			"user_id = ? AND request_id IN ? AND (status_code >= ? OR capture_error LIKE ? OR capture_error LIKE ? OR capture_error LIKE ?)",
			userId,
			requestIds,
			400,
			"%client_disconnected%",
			"%handler_panicked%",
			"%response_write_failed%",
		).
		Pluck("request_id", &settledRequestIds).Error
	return settledRequestIds, err
}

func CreateRelayArchive(archive *RelayArchive, requestBody io.Reader, responseBody io.Reader) error {
	if archive == nil {
		return errors.New("relay archive is nil")
	}
	if archive.UserId <= 0 {
		return errors.New("relay archive user is invalid")
	}
	if archive.RequestId == "" {
		archive.RequestId = common.NewRequestId()
	}
	normalizeRelayArchiveMetadata(archive)
	if archive.CreatedAt == 0 {
		archive.CreatedAt = common.GetTimestamp()
	}
	archive.PayloadEncoding = RelayArchiveEncoding
	archive.EncryptionKeyId = relayArchiveKeyID()

	return DB.Transaction(func(tx *gorm.DB) error {
		if err := lockRelayArchiveUser(tx, archive.UserId); err != nil {
			return err
		}
		if err := tx.Create(archive).Error; err != nil {
			return err
		}

		requestSize, requestHash, requestTruncated, err := writeRelayArchiveChunks(tx, archive, RelayArchiveDirectionRequest, requestBody)
		if err != nil {
			return err
		}
		responseSize, responseHash, responseTruncated, err := writeRelayArchiveChunks(tx, archive, RelayArchiveDirectionResponse, responseBody)
		if err != nil {
			return err
		}
		archive.RequestTruncated = archive.RequestTruncated || requestTruncated
		archive.ResponseTruncated = archive.ResponseTruncated || responseTruncated
		archive.RequestStoredSize = requestSize
		archive.ResponseStoredSize = responseSize
		if archive.RequestSize == 0 {
			archive.RequestSize = requestSize
			if requestTruncated {
				archive.RequestSize++
			}
		}
		if archive.ResponseSize == 0 {
			archive.ResponseSize = responseSize
			if responseTruncated {
				archive.ResponseSize++
			}
		}
		archive.RequestSha256 = requestHash
		archive.ResponseSha256 = responseHash
		return tx.Model(&RelayArchive{}).Where("id = ?", archive.Id).Updates(map[string]interface{}{
			"request_size":         archive.RequestSize,
			"response_size":        archive.ResponseSize,
			"request_stored_size":  requestSize,
			"response_stored_size": responseSize,
			"request_truncated":    archive.RequestTruncated,
			"response_truncated":   archive.ResponseTruncated,
			"request_sha256":       requestHash,
			"response_sha256":      responseHash,
		}).Error
	})
}

func lockRelayArchiveUser(tx *gorm.DB, userId int) error {
	// SQLite has no SELECT FOR UPDATE. A no-op update obtains its database
	// write lock before archive insertion so account deletion and archival are
	// serialized in the same order as on MySQL/PostgreSQL.
	if common.UsingMainDatabase(common.DatabaseTypeSQLite) {
		result := tx.Model(&User{}).
			Where("id = ?", userId).
			UpdateColumn("auth_version", gorm.Expr("auth_version"))
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected != 1 {
			return fmt.Errorf("relay archive user is unavailable: %w", gorm.ErrRecordNotFound)
		}
		return nil
	}

	activeUser := &User{}
	if err := lockForUpdate(tx).Select("id").Where("id = ?", userId).First(activeUser).Error; err != nil {
		return fmt.Errorf("relay archive user is unavailable: %w", err)
	}
	return nil
}

func normalizeRelayArchiveMetadata(archive *RelayArchive) {
	metadataTruncated := false
	normalize := func(value string, maxRunes int) string {
		normalized := strings.ToValidUTF8(value, "�")
		if normalized != value {
			metadataTruncated = true
		}
		runeCount := 0
		for index := range normalized {
			if runeCount == maxRunes {
				metadataTruncated = true
				return normalized[:index]
			}
			runeCount++
		}
		return normalized
	}

	archive.RequestId = normalize(archive.RequestId, 64)
	archive.Username = normalize(archive.Username, 128)
	archive.TokenName = normalize(archive.TokenName, 128)
	archive.Method = normalize(archive.Method, 16)
	archive.Path = normalize(archive.Path, 512)
	archive.ModelName = normalize(archive.ModelName, 191)
	archive.Transport = normalize(archive.Transport, 16)
	archive.RequestContentType = normalize(archive.RequestContentType, 255)
	archive.ResponseContentType = normalize(archive.ResponseContentType, 255)
	if metadataTruncated {
		if archive.CaptureError != "" {
			archive.CaptureError += ","
		}
		archive.CaptureError += "metadata_truncated"
	}
	archive.CaptureError = normalize(archive.CaptureError, 255)
}

func writeRelayArchiveChunks(tx *gorm.DB, archive *RelayArchive, direction string, reader io.Reader) (int64, string, bool, error) {
	hash := sha256.New()
	if reader == nil {
		return 0, hex.EncodeToString(hash.Sum(nil)), false, nil
	}
	maxBytes := common.RelayArchiveMaxBodyBytes
	if maxBytes <= 0 {
		return 0, "", false, errors.New("relay archive body limit is not configured")
	}

	buffer := make([]byte, relayArchiveChunkSize)
	chunks := make([]RelayArchiveChunk, 0, relayArchiveChunkBatchSize)
	var total int64
	sequence := 0
	truncated := false

	flush := func() error {
		if len(chunks) == 0 {
			return nil
		}
		if err := tx.CreateInBatches(chunks, relayArchiveChunkBatchSize).Error; err != nil {
			return err
		}
		chunks = chunks[:0]
		return nil
	}

	for {
		remaining := maxBytes - total
		if remaining <= 0 {
			var extra [1]byte
			n, err := reader.Read(extra[:])
			if n > 0 {
				truncated = true
			}
			if err != nil && !errors.Is(err, io.EOF) {
				return 0, "", false, err
			}
			break
		}
		readBuffer := buffer
		if remaining < int64(len(readBuffer)) {
			readBuffer = readBuffer[:remaining]
		}
		n, err := io.ReadFull(reader, readBuffer)
		if err != nil && !errors.Is(err, io.EOF) && !errors.Is(err, io.ErrUnexpectedEOF) {
			return 0, "", false, err
		}
		if n > 0 {
			plain := buffer[:n]
			if _, hashErr := hash.Write(plain); hashErr != nil {
				return 0, "", false, hashErr
			}
			payload, sealErr := sealRelayArchiveChunk(archive.RequestId, archive.EncryptionKeyId, direction, sequence, plain)
			if sealErr != nil {
				return 0, "", false, sealErr
			}
			chunks = append(chunks, RelayArchiveChunk{
				ArchiveId: archive.Id,
				Direction: direction,
				Sequence:  sequence,
				PlainSize: n,
				Payload:   payload,
			})
			total += int64(n)
			sequence++
			if len(chunks) == relayArchiveChunkBatchSize {
				if flushErr := flush(); flushErr != nil {
					return 0, "", false, flushErr
				}
			}
		}
		if errors.Is(err, io.EOF) || errors.Is(err, io.ErrUnexpectedEOF) {
			break
		}
	}
	if err := flush(); err != nil {
		return 0, "", false, err
	}
	return total, hex.EncodeToString(hash.Sum(nil)), truncated, nil
}

func sealRelayArchiveChunk(requestId, keyId, direction string, sequence int, plain []byte) (string, error) {
	var compressed bytes.Buffer
	compressor, err := gzip.NewWriterLevel(&compressed, gzip.BestSpeed)
	if err != nil {
		return "", err
	}
	if _, err := compressor.Write(plain); err != nil {
		_ = compressor.Close()
		return "", err
	}
	if err := compressor.Close(); err != nil {
		return "", err
	}

	aead, err := relayArchiveAEAD()
	if err != nil {
		return "", err
	}
	nonce := make([]byte, aead.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}
	aad := relayArchiveAAD(requestId, keyId, direction, sequence)
	sealed := aead.Seal(nil, nonce, compressed.Bytes(), aad)
	envelope := append(nonce, sealed...)
	return base64.StdEncoding.EncodeToString(envelope), nil
}

func openRelayArchiveChunk(archive *RelayArchive, chunk *RelayArchiveChunk) ([]byte, error) {
	if archive.EncryptionKeyId != relayArchiveKeyID() {
		return nil, errors.New("relay archive encryption key is unavailable")
	}
	envelope, err := base64.StdEncoding.DecodeString(chunk.Payload)
	if err != nil {
		return nil, err
	}
	aead, err := relayArchiveAEAD()
	if err != nil {
		return nil, err
	}
	if len(envelope) < aead.NonceSize() {
		return nil, errors.New("invalid relay archive chunk")
	}
	nonce := envelope[:aead.NonceSize()]
	ciphertext := envelope[aead.NonceSize():]
	aad := relayArchiveAAD(archive.RequestId, archive.EncryptionKeyId, chunk.Direction, chunk.Sequence)
	compressed, err := aead.Open(nil, nonce, ciphertext, aad)
	if err != nil {
		return nil, err
	}
	reader, err := gzip.NewReader(bytes.NewReader(compressed))
	if err != nil {
		return nil, err
	}
	plain, readErr := io.ReadAll(io.LimitReader(reader, int64(relayArchiveChunkSize+1)))
	closeErr := reader.Close()
	if readErr != nil {
		return nil, readErr
	}
	if closeErr != nil {
		return nil, closeErr
	}
	if len(plain) != chunk.PlainSize || len(plain) > relayArchiveChunkSize {
		return nil, errors.New("relay archive chunk size mismatch")
	}
	return plain, nil
}

func relayArchiveAEAD() (cipher.AEAD, error) {
	secret := common.RelayArchiveSecret
	if secret == "" {
		return nil, errors.New("relay archive encryption secret is not configured")
	}
	key := sha256.Sum256([]byte("new-api/relay-archive/v1/" + secret))
	block, err := aes.NewCipher(key[:])
	if err != nil {
		return nil, err
	}
	return cipher.NewGCM(block)
}

func relayArchiveKeyID() string {
	key := sha256.Sum256([]byte("new-api/relay-archive/key-id/v1/" + common.RelayArchiveSecret))
	return hex.EncodeToString(key[:8])
}

func relayArchiveAAD(requestId, keyId, direction string, sequence int) []byte {
	return []byte(fmt.Sprintf("%s\x00%s\x00%s\x00%d", requestId, keyId, direction, sequence))
}

func GetRelayArchives(filter RelayArchiveFilter, startIdx, limit int) ([]*RelayArchive, int64, error) {
	if startIdx < 0 {
		startIdx = 0
	}
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	tx := DB.Model(&RelayArchive{})
	var err error
	if tx, err = applyRelayArchiveTextFilter(tx, "relay_archives.username", filter.Username); err != nil {
		return nil, 0, err
	}
	if tx, err = applyRelayArchiveTextFilter(tx, "relay_archives.model_name", filter.ModelName); err != nil {
		return nil, 0, err
	}
	if filter.RequestId != "" {
		tx = tx.Where("relay_archives.request_id = ?", filter.RequestId)
	}
	if filter.Path != "" {
		pathFilter := strings.TrimSpace(filter.Path)
		if !strings.Contains(pathFilter, "%") {
			pathFilter = "%" + pathFilter + "%"
		}
		pattern, patternErr := sanitizeLikePattern(pathFilter)
		if patternErr != nil {
			return nil, 0, patternErr
		}
		tx = tx.Where("relay_archives.path LIKE ? ESCAPE '!'", pattern)
	}
	if filter.StatusCode != 0 {
		tx = tx.Where("relay_archives.status_code = ?", filter.StatusCode)
	}
	if filter.StartTimestamp != 0 {
		tx = tx.Where("relay_archives.created_at >= ?", filter.StartTimestamp)
	}
	if filter.EndTimestamp != 0 {
		tx = tx.Where("relay_archives.created_at <= ?", filter.EndTimestamp)
	}

	var total int64
	if err := tx.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	archives := make([]*RelayArchive, 0)
	if err := tx.Order("relay_archives.created_at desc, relay_archives.id desc").Limit(limit).Offset(startIdx).Find(&archives).Error; err != nil {
		return nil, 0, err
	}
	return archives, total, nil
}

func applyRelayArchiveTextFilter(tx *gorm.DB, column, value string) (*gorm.DB, error) {
	if value == "" {
		return tx, nil
	}
	if !strings.Contains(value, "%") {
		return tx.Where(column+" = ?", value), nil
	}
	pattern, err := sanitizeLikePattern(value)
	if err != nil {
		return nil, err
	}
	return tx.Where(column+" LIKE ? ESCAPE '!'", pattern), nil
}

func GetRelayArchiveByID(id int64) (*RelayArchive, error) {
	archive := &RelayArchive{}
	if err := DB.Where("id = ?", id).First(archive).Error; err != nil {
		return nil, err
	}
	return archive, nil
}

func RevealRelayArchive(archive *RelayArchive) ([]byte, []byte, error) {
	if archive == nil || archive.Id <= 0 {
		return nil, nil, errors.New("invalid relay archive")
	}
	if archive.PayloadEncoding != RelayArchiveEncoding {
		return nil, nil, errors.New("unsupported relay archive encoding")
	}

	requestBody, err := readRelayArchiveDirection(archive, RelayArchiveDirectionRequest, archive.RequestSha256)
	if err != nil {
		return nil, nil, err
	}
	responseBody, err := readRelayArchiveDirection(archive, RelayArchiveDirectionResponse, archive.ResponseSha256)
	if err != nil {
		return nil, nil, err
	}
	return requestBody, responseBody, nil
}

func readRelayArchiveDirection(archive *RelayArchive, direction, expectedHash string) ([]byte, error) {
	rows, err := DB.Model(&RelayArchiveChunk{}).
		Where("archive_id = ? AND direction = ?", archive.Id, direction).
		Order("sequence asc").Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var body bytes.Buffer
	hash := sha256.New()
	expectedSequence := 0
	for rows.Next() {
		chunk := &RelayArchiveChunk{}
		if err := DB.ScanRows(rows, chunk); err != nil {
			return nil, err
		}
		if chunk.Sequence != expectedSequence {
			return nil, errors.New("relay archive chunk sequence mismatch")
		}
		plain, err := openRelayArchiveChunk(archive, chunk)
		if err != nil {
			return nil, err
		}
		if _, err := body.Write(plain); err != nil {
			return nil, err
		}
		if _, err := hash.Write(plain); err != nil {
			return nil, err
		}
		expectedSequence++
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	actualHash := hex.EncodeToString(hash.Sum(nil))
	if expectedHash != "" && actualHash != expectedHash {
		return nil, errors.New("relay archive payload checksum mismatch")
	}
	return body.Bytes(), nil
}

func EncodeRelayArchiveBody(contentType string, body []byte) (string, string) {
	mediaType, _, _ := mime.ParseMediaType(contentType)
	mediaType = strings.ToLower(mediaType)
	textual := strings.HasPrefix(mediaType, "text/") ||
		strings.Contains(mediaType, "json") ||
		strings.Contains(mediaType, "xml") ||
		mediaType == "application/javascript" ||
		mediaType == "application/x-www-form-urlencoded"
	if (textual || mediaType == "") && utf8.Valid(body) {
		return string(body), "utf-8"
	}
	return base64.StdEncoding.EncodeToString(body), "base64"
}

func DeleteRelayArchivesByUserWithTx(tx *gorm.DB, userId int) error {
	archiveIds := tx.Model(&RelayArchive{}).Select("id").Where("user_id = ?", userId)
	if err := tx.Unscoped().Where("archive_id IN (?)", archiveIds).Delete(&RelayArchiveChunk{}).Error; err != nil {
		return err
	}
	return tx.Unscoped().Where("user_id = ?", userId).Delete(&RelayArchive{}).Error
}

func CountRelayArchivesBefore(ctx context.Context, cutoff int64) (int64, error) {
	var total int64
	err := DB.WithContext(ctx).Model(&RelayArchive{}).Where("created_at < ?", cutoff).Count(&total).Error
	return total, err
}

func DeleteRelayArchiveBatchBefore(ctx context.Context, cutoff int64, batchSize int) (int64, error) {
	if err := ctx.Err(); err != nil {
		return 0, err
	}
	if cutoff <= 0 {
		return 0, errors.New("relay archive cleanup cutoff is required")
	}
	if batchSize <= 0 || batchSize > 100 {
		batchSize = 50
	}

	archiveIds := make([]int64, 0, batchSize)
	if err := DB.WithContext(ctx).Model(&RelayArchive{}).
		Select("id").
		Where("created_at < ?", cutoff).
		Order("created_at asc, id asc").
		Limit(batchSize).
		Pluck("id", &archiveIds).Error; err != nil {
		return 0, err
	}
	if len(archiveIds) == 0 {
		return 0, nil
	}

	err := DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("archive_id IN ?", archiveIds).Delete(&RelayArchiveChunk{}).Error; err != nil {
			return err
		}
		return tx.Where("id IN ? AND created_at < ?", archiveIds, cutoff).Delete(&RelayArchive{}).Error
	})
	if err != nil {
		return 0, err
	}
	return int64(len(archiveIds)), nil
}
