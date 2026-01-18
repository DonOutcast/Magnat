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
	ExportDate  time.Time
	SKU         int64
	ProductName *string
	Place       *float64
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

// day dimension обычно приходит как "2025-12-05" или RFC3339.
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
		// 1) yyyy-mm-dd
		if d, err := time.Parse("2006-01-02", t); err == nil {
			return d
		}
		// 2) RFC3339
		if d, err := time.Parse(time.RFC3339, t); err == nil {
			return d.UTC().Truncate(24 * time.Hour)
		}
		return fallback
	default:
		return fallback
	}
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

	// ожидаем dimension ["sku","day"]
	// по твоей логике: dims[0]=sku, dims[1]=day
	var out []SearchPositionRow

	// fallback export_date = date_from (yyyy-mm-dd)
	fallbackDate := time.Now().UTC().Truncate(24 * time.Hour)
	if df, err := time.Parse(time.RFC3339, req.DateFrom); err == nil {
		fallbackDate = df.UTC().Truncate(24 * time.Hour)
	}

	// metrics порядок как в req.Metrics:
	// ['ordered_units', 'position_category']
	// place берём из position_category => index 1
	placeIdx := -1
	for i, m := range req.Metrics {
		if m == "position_category" {
			placeIdx = i
			break
		}
	}
	if placeIdx == -1 {
		return nil, fmt.Errorf("metrics must include position_category")
	}

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

		// place metric
		var placePtr *float64
		if len(row.Metrics) > placeIdx {
			if f, ok := toFloat(row.Metrics[placeIdx]); ok {
				placePtr = &f
			}
		}

		out = append(out, SearchPositionRow{
			ExportDate:  exportDate,
			SKU:         skuVal,
			ProductName: name,
			Place:       placePtr,
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
		INSERT INTO public.search_position (export_date, sku, product_name, place)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (export_date, sku) DO UPDATE
		SET product_name = EXCLUDED.product_name,
		    place        = EXCLUDED.place
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, r := range rows {
		_, err := stmt.ExecContext(ctx, r.ExportDate, r.SKU, r.ProductName, r.Place)
		if err != nil {
			return fmt.Errorf("insert failed sku=%d date=%s: %w", r.SKU, r.ExportDate.Format("2006-01-02"), err)
		}
	}

	return tx.Commit()
}

func main() {
	ctx := context.Background()

	_ = godotenv.Load("../.env")

	from := mustEnv("PROCESSED_FROM")
	to := mustEnv("PROCESSED_TO")
	limit := flag.Int("limit", 1000, "limit")
	flag.Parse()

	clientID := mustEnv("OZON_CLIENT_ID")
	apiKey := mustEnv("OZON_API_KEY")
	pgDsn := mustEnv("PG_DSN")
	endpoint := "https://api-seller.ozon.ru/v1/analytics/data" // https://api-seller.ozon.ru/v1/analytics/data

	oz := &OzonClient{
		ClientID: clientID,
		APIKey:   apiKey,
		Endpoint: endpoint,
		HTTP: &http.Client{
			Timeout: 60 * time.Second,
		},
	}

	req := AnalyticsRequest{
		DateFrom:  from,
		DateTo:    to,
		Dimension: []string{"sku", "day"},
		Limit:     *limit,
		Metrics:   []string{"ordered_units", "position_category"},
	}

	rows, err := oz.FetchSearchPositions(ctx, req)
	if err != nil {
		panic(err)
	}

	fmt.Println("parsed rows:", len(rows))
	if len(rows) > 0 {
		// debug first 3
		for i := 0; i < len(rows) && i < 3; i++ {
			fmt.Printf("sample[%d]: date=%s sku=%d name=%v place=%v\n",
				i,
				rows[i].ExportDate.Format("2006-01-02"),
				rows[i].SKU,
				ptrStr(rows[i].ProductName),
				ptrF(rows[i].Place),
			)
		}
	}
	//for _, row := range rows {
	//	b, _ := json.MarshalIndent(row, "", "  ")
	//	fmt.Println(string(b))
	//}

	db, err := sql.Open("pgx", pgDsn)
	if err != nil {
		panic(err)
	}
	defer db.Close()

	if err := db.PingContext(ctx); err != nil {
		panic(err)
	}

	if err := upsertSearchPositions(ctx, db, rows); err != nil {
		panic(err)
	}

	fmt.Println("done")
}

func ptrStr(p *string) string {
	if p == nil {
		return "<nil>"
	}
	return *p
}

func ptrF(p *float64) string {
	if p == nil {
		return "<nil>"
	}
	return fmt.Sprintf("%.6f", *p)
}
