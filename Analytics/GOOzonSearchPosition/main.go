package main

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
)

type TgSendMessageRequest struct {
	ChatID                string `json:"chat_id"`
	Text                  string `json:"text"`
	DisableWebPagePreview bool   `json:"disable_web_page_preview"`
}

type TgSendMessageResponse struct {
	Ok          bool            `json:"ok"`
	Description string          `json:"description"`
	Result      json.RawMessage `json:"result"`
}

func sendTelegramMessage(ctx context.Context, httpc *http.Client, botToken, chatID, text string) error {
	if strings.TrimSpace(botToken) == "" || strings.TrimSpace(chatID) == "" {
		return fmt.Errorf("telegram creds are empty (TG_BOT_TOKEN / TG_CHAT_ID)")
	}

	const maxLen = 3900
	if len(text) > maxLen {
		text = text[:maxLen] + "\n\n...(truncated)"
	}

	url := "https://api.telegram.org/bot" + botToken + "/sendMessage"
	payload, _ := json.Marshal(TgSendMessageRequest{
		ChatID:                chatID,
		Text:                  text,
		DisableWebPagePreview: true,
	})

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := httpc.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("telegram http %d: %s", resp.StatusCode, string(raw))
	}

	var tr TgSendMessageResponse
	if err := json.Unmarshal(raw, &tr); err != nil {
		return fmt.Errorf("telegram json decode: %w, raw=%s", err, string(raw))
	}
	if !tr.Ok {
		return fmt.Errorf("telegram api not ok: %s", tr.Description)
	}
	return nil
}

func getMoscowLoc() *time.Location {
	loc, err := time.LoadLocation("Europe/Moscow")
	if err != nil {
		return time.FixedZone("MSK", 3*60*60)
	}
	return loc
}

func yesterdayMoscowUTCDate() time.Time {
	loc := getMoscowLoc()
	now := time.Now().In(loc)
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
	yStart := todayStart.AddDate(0, 0, -1) // вчера 00:00 по МСК
	// возвращаем как UTC-день (полночь UTC не важна, важен “календарный день”)
	return yStart.UTC().Truncate(24 * time.Hour)
}

func envBool(key string, def bool) bool {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return def
	}
	v = strings.ToLower(v)
	return v == "1" || v == "true" || v == "yes" || v == "y"
}

type OzonClient struct {
	ClientID string
	APIKey   string
	Endpoint string
	HTTP     *http.Client
}

type AnalyticsRequest struct {
	DateFrom   string   `json:"date_from"`
	DateTo     string   `json:"date_to"`
	Dimension  []string `json:"dimension"`
	Limit      int      `json:"limit"`
	Metrics    []string `json:"metrics"`
	Offset     int      `json:"offset,omitempty"`
	Sort       []any    `json:"sort,omitempty"`
	Filters    []any    `json:"filters,omitempty"`
	WithStats  bool     `json:"with_stats,omitempty"`
	WithTotals bool     `json:"with_totals,omitempty"`
}

type AnalyticsResponse struct {
	Result struct {
		Data []struct {
			Dimensions []struct {
				ID   any    `json:"id"`
				Name string `json:"name"`
			} `json:"dimensions"`
			Metrics []any `json:"metrics"`
		} `json:"data"`
	} `json:"result"`
}

type SearchPositionRow struct {
	ExportDate   time.Time
	SKU          int64
	ProductName  *string
	Place        *float64
	OrderedUnits *float64
	Revenue      *float64
}

// ---------- helpers ----------
func mustEnv(k string) string {
	v := strings.TrimSpace(os.Getenv(k))
	if v == "" {
		fmt.Printf("missing env: %s\n", k)
		os.Exit(1)
	}
	return v
}

func toInt64(v any) (int64, bool) {
	switch t := v.(type) {
	case float64:
		return int64(t), true
	case int64:
		return t, true
	case int:
		return int64(t), true
	case string:
		t = strings.TrimSpace(t)
		if t == "" {
			return 0, false
		}
		var n int64
		_, err := fmt.Sscan(t, &n)
		return n, err == nil
	default:
		return 0, false
	}
}

func toFloat(v any) (float64, bool) {
	switch t := v.(type) {
	case float64:
		return t, true
	case int:
		return float64(t), true
	case int64:
		return float64(t), true
	case string:
		t = strings.TrimSpace(t)
		t = strings.ReplaceAll(t, ",", ".")
		if t == "" {
			return 0, false
		}
		var f float64
		_, err := fmt.Sscan(t, &f)
		return f, err == nil
	default:
		return 0, false
	}
}

func cleanPtr(s string) *string {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	return &s
}

// day dimension обычно приходит как "2026-01-04" или RFC3339.
// парсим максимально терпимо.
func parseDayToDate(v any, fallback time.Time) time.Time {
	if v == nil {
		return fallback
	}
	switch t := v.(type) {
	case string:
		t = strings.TrimSpace(t)
		if t == "" {
			return fallback
		}
		if d, err := time.Parse("2006-01-02", t); err == nil {
			return d
		}
		if d, err := time.Parse(time.RFC3339, t); err == nil {
			return d.UTC().Truncate(24 * time.Hour)
		}
		return fallback
	default:
		return fallback
	}
}

func dayBoundsUTC(day time.Time) (from, to time.Time) {
	day = day.UTC().Truncate(24 * time.Hour)
	from = day
	to = day.Add(24 * time.Hour).Add(-1 * time.Nanosecond)
	return
}

func parseAnyDate(s string) (time.Time, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return time.Time{}, fmt.Errorf("empty date")
	}
	// поддержим и yyyy-mm-dd и RFC3339
	if d, err := time.Parse("2006-01-02", s); err == nil {
		return d.UTC().Truncate(24 * time.Hour), nil
	}
	if d, err := time.Parse(time.RFC3339, s); err == nil {
		return d.UTC(), nil
	}
	return time.Time{}, fmt.Errorf("unknown date format: %s", s)
}

// ---------- ozon call ----------
func (c *OzonClient) FetchSearchPositions(ctx context.Context, req AnalyticsRequest) ([]SearchPositionRow, error) {
	bodyBytes, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.Endpoint, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Client-Id", c.ClientID)
	httpReq.Header.Set("Api-Key", c.APIKey)

	resp, err := c.HTTP.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("ozon http %d: %s", resp.StatusCode, string(raw))
	}

	var ar AnalyticsResponse
	if err := json.Unmarshal(raw, &ar); err != nil {
		return nil, fmt.Errorf("json unmarshal error: %w; raw=%s", err, string(raw))
	}

	// индексы метрик — строго по именам, чтобы порядок в Metrics можно было менять безопасно
	idx := map[string]int{}
	for i, m := range req.Metrics {
		idx[m] = i
	}
	required := []string{"revenue", "ordered_units", "position_category"}
	for _, k := range required {
		if _, ok := idx[k]; !ok {
			return nil, fmt.Errorf("metrics must include %s", k)
		}
	}

	// fallback export_date = date_from
	fallbackDate := time.Now().UTC().Truncate(24 * time.Hour)
	if df, err := time.Parse(time.RFC3339, req.DateFrom); err == nil {
		fallbackDate = df.UTC().Truncate(24 * time.Hour)
	}

	var out []SearchPositionRow

	for _, row := range ar.Result.Data {
		if len(row.Dimensions) < 1 {
			continue
		}

		// sku dimension
		skuVal, ok := toInt64(row.Dimensions[0].ID)
		if !ok || skuVal == 0 {
			continue
		}
		name := cleanPtr(row.Dimensions[0].Name)

		// day dimension (если есть)
		exportDate := fallbackDate
		if len(row.Dimensions) > 1 {
			exportDate = parseDayToDate(row.Dimensions[1].ID, fallbackDate)
		}

		// метрики
		var placePtr, orderedPtr, revenuePtr *float64

		if len(row.Metrics) > idx["position_category"] {
			if f, ok := toFloat(row.Metrics[idx["position_category"]]); ok {
				placePtr = &f
			}
		}
		if len(row.Metrics) > idx["ordered_units"] {
			if f, ok := toFloat(row.Metrics[idx["ordered_units"]]); ok {
				orderedPtr = &f
			}
		}
		if len(row.Metrics) > idx["revenue"] {
			if f, ok := toFloat(row.Metrics[idx["revenue"]]); ok {
				revenuePtr = &f
			}
		}

		out = append(out, SearchPositionRow{
			ExportDate:   exportDate,
			SKU:          skuVal,
			ProductName:  name,
			Place:        placePtr,
			OrderedUnits: orderedPtr,
			Revenue:      revenuePtr,
		})
	}

	return out, nil
}

// ---------- db upsert ----------
func upsertSearchPositions(ctx context.Context, db *sql.DB, rows []SearchPositionRow) error {
	if len(rows) == 0 {
		return nil
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	stmt, err := tx.PrepareContext(ctx, `
		INSERT INTO public.search_position (export_date, sku, product_name, place, ordered_units, revenue)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (export_date, sku) DO UPDATE
		SET product_name  = EXCLUDED.product_name,
		    place         = EXCLUDED.place,
		    ordered_units = EXCLUDED.ordered_units,
		    revenue       = EXCLUDED.revenue
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, r := range rows {
		_, err := stmt.ExecContext(ctx, r.ExportDate, r.SKU, r.ProductName, r.Place, r.OrderedUnits, r.Revenue)
		if err != nil {
			return fmt.Errorf("insert failed sku=%d date=%s: %w", r.SKU, r.ExportDate.Format("2006-01-02"), err)
		}
	}

	return tx.Commit()
}

func main() {
	ctx := context.Background()
	_ = godotenv.Load("../.env")

	tgToken := strings.TrimSpace(os.Getenv("TG_BOT_TOKEN"))
	tgChatID := strings.TrimSpace(os.Getenv("TG_CHAT_ID"))

	httpc := &http.Client{Timeout: 120 * time.Second}

	limit := flag.Int("limit", 1000, "limit per request")
	flag.Parse()

	var finalErr error
	var startDate, endDate time.Time
	totalInserted := 0

	defer func() {
		if r := recover(); r != nil {
			switch x := r.(type) {
			case error:
				finalErr = x
			default:
				finalErr = fmt.Errorf("%v", x)
			}
		}

		if tgToken == "" || tgChatID == "" {
			if finalErr != nil {
				panic(finalErr)
			}
			return
		}

		status := "✅"
		if finalErr != nil {
			status = "❌"
		}

		fromTxt := "-"
		toTxt := "-"
		if !startDate.IsZero() {
			fromTxt = startDate.UTC().Truncate(24 * time.Hour).Format("2006-01-02")
		}
		if !endDate.IsZero() {
			toTxt = endDate.UTC().Truncate(24 * time.Hour).Format("2006-01-02")
		}

		text := fmt.Sprintf(
			"SearchPosition %s\nfrom=%s\nto=%s\nlimit=%d\ntotal_upserted=%d",
			status,
			fromTxt,
			toTxt,
			*limit,
			totalInserted,
		)
		if finalErr != nil {
			text += "\nerror=" + finalErr.Error()
		}

		if err := sendTelegramMessage(ctx, httpc, tgToken, tgChatID, text); err != nil {
			fmt.Println("telegram send failed:", err)
		}

		if finalErr != nil {
			panic(finalErr)
		}
	}()

	clientID := mustEnv("OZON_CLIENT_ID")
	apiKey := mustEnv("OZON_API_KEY")
	pgDsn := mustEnv("PG_DSN")

	endpoint := "https://api-seller.ozon.ru/v1/analytics/data"

	oz := &OzonClient{
		ClientID: clientID,
		APIKey:   apiKey,
		Endpoint: endpoint,
		HTTP: &http.Client{
			Timeout: 60 * time.Second,
		},
	}

	useEnvDates := envBool("USE_ENV_DATES", false)

	if useEnvDates {
		fromEnv := mustEnv("PROCESSED_FROM_SEARCH")
		toEnv := mustEnv("PROCESSED_TO_SEARCH")

		var err error
		startDate, err = parseAnyDate(fromEnv)
		if err != nil {
			finalErr = err
			panic(err)
		}
		endDate, err = parseAnyDate(toEnv)
		if err != nil {
			finalErr = err
			panic(err)
		}
	} else {
		loc := getMoscowLoc()
		now := time.Now().In(loc)
		todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
		yStart := todayStart.AddDate(0, 0, -1) // вчера 00:00 МСК

		// для цикла мы работаем с UTC-днями
		yUTC := yStart.UTC().Truncate(24 * time.Hour)
		startDate = yUTC
		endDate = yUTC
	}

	// ---- db ----

	db, err := sql.Open("pgx", pgDsn)
	if err != nil {
		finalErr = err
		panic(err)
	}
	defer db.Close()

	if err := db.PingContext(ctx); err != nil {
		finalErr = err
		panic(err)
	}

	// ---- run ----

	for day := startDate.UTC().Truncate(24 * time.Hour); !day.After(endDate.UTC().Truncate(24 * time.Hour)); day = day.AddDate(0, 0, 1) {
		fromDay, toDay := dayBoundsUTC(day)

		offset := 0
		dayRows := 0

		for {
			req := AnalyticsRequest{
				DateFrom:  fromDay.Format(time.RFC3339Nano),
				DateTo:    toDay.Format(time.RFC3339Nano),
				Dimension: []string{"sku", "day"},
				Limit:     *limit,
				Offset:    offset,
				Metrics:   []string{"revenue", "ordered_units", "position_category"},
			}

			rows, err := oz.FetchSearchPositions(ctx, req)
			if err != nil {
				finalErr = err
				panic(err)
			}

			// чтобы не душить API
			time.Sleep(1 * time.Second)

			if len(rows) > 0 {
				if err := upsertSearchPositions(ctx, db, rows); err != nil {
					finalErr = err
					panic(err)
				}
				dayRows += len(rows)
				totalInserted += len(rows)
			}

			if len(rows) < *limit {
				break
			}
			offset += *limit
		}

		fmt.Printf("day %s: upserted %d rows\n", day.Format("2006-01-02"), dayRows)
	}

	fmt.Println("done, total rows:", totalInserted)
}
