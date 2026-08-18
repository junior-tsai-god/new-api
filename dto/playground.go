package dto

type PlayGroundRequest struct {
	Model string `json:"model,omitempty"`
	Group string `json:"group,omitempty"`
}

type PlaygroundSessionStatsRequest struct {
	RequestIds []string `json:"request_ids"`
}

type PlaygroundSessionStats struct {
	Settled               bool    `json:"settled"`
	RequestedRequestCount int     `json:"requested_request_count"`
	SettledRequestCount   int     `json:"settled_request_count"`
	InputTokens           int64   `json:"input_tokens"`
	OutputTokens          int64   `json:"output_tokens"`
	TotalTokens           int64   `json:"total_tokens"`
	CacheReadTokens       int64   `json:"cache_read_tokens"`
	CacheWriteTokens      int64   `json:"cache_write_tokens"`
	CachedTokens          int64   `json:"cached_tokens"`
	CacheHitRate          float64 `json:"cache_hit_rate"`
	Quota                 int64   `json:"quota"`
	CostUSD               float64 `json:"cost_usd"`
}
