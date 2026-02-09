package main

import (
	"bytes"
	"context"
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/joho/godotenv"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

const (
	tokenEndpoint  = "https://api-performance.ozon.ru/api/client/token"
	genEndpoint    = "https://api-performance.ozon.ru:443/api/client/statistic/products/generate"
	reportEndpoint = "https://api-performance.ozon.ru:443/api/client/statistics/report"
)

type PerfClient struct {
	Token string
	HTTP  *http.Client
}

type generateResp struct {
	UUID string `json:"UUID"`
}

func (c *PerfClient) postJSON(ctx context.Context, url string, body any, out any) error {
	b, err := json.Marshal(body)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(b))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+c.Token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTP.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		rb, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("perf http %d: %s", resp.StatusCode, string(rb))
	}
	return json.NewDecoder(resp.Body).Decode(out)
}

func (c *PerfClient) getCSV(ctx context.Context, uuid string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reportEndpoint, nil)
	if err != nil {
		return "", err
	}
	q := req.URL.Query()
	q.Set("UUID", uuid)
	req.URL.RawQuery = q.Encode()

	req.Header.Set("Authorization", "Bearer "+c.Token)
	// Host можно не ставить вручную — но оставлю как в твоём примере, не мешает.
	req.Header.Set("Host", "api-performance.ozon.ru:443")

	resp, err := c.HTTP.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("report http %d: %s", resp.StatusCode, string(b))
	}
	b, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

func (c *PerfClient) GenerateUUID(ctx context.Context, fromISO, toISO string) (string, error) {
	payload := map[string]any{
		"from": fromISO,
		"to":   toISO,
	}
	var out generateResp
	if err := c.postJSON(ctx, genEndpoint, payload, &out); err != nil {
		return "", err
	}
	if out.UUID == "" {
		return "", errors.New("empty UUID")
	}
	return out.UUID, nil
}

// --- CSV cleaning helpers ---

func normHeader(s string) string {
	s = strings.TrimSpace(s)
	s = strings.TrimPrefix(s, "\ufeff") // BOM
	s = strings.TrimSpace(s)
	s = strings.Trim(s, `"`)
	return strings.TrimSpace(s)
}

// "-" => nil
func cleanStr(s string) *string {
	s = strings.TrimSpace(s)
	if s == "" || s == "-" || strings.EqualFold(s, "nan") {
		return nil
	}
	s = strings.Trim(s, `"`)
	s = strings.TrimSpace(s)
	if s == "" || s == "-" {
		return nil
	}
	return &s
}

func toNumericString(s string) *string {
	cs := cleanStr(s)
	if cs == nil {
		return nil
	}
	t := strings.ReplaceAll(*cs, "₽", "")
	t = strings.ReplaceAll(t, " ", "")
	t = strings.TrimSpace(t)
	if t == "" || t == "-" {
		return nil
	}
	t = strings.ReplaceAll(t, ",", ".")
	// проверим, что это число
	if _, err := strconv.ParseFloat(t, 64); err != nil {
		return nil
	}
	return &t
}

func toInt32(s string) *int32 {
	cs := cleanStr(s)
	if cs == nil {
		return nil
	}
	t := strings.ReplaceAll(*cs, " ", "")
	t = strings.ReplaceAll(t, ",", ".")
	f, err := strconv.ParseFloat(t, 64)
	if err != nil {
		return nil
	}
	v := int32(f)
	return &v
}

func toInt64(s string) *int64 {
	cs := cleanStr(s)
	if cs == nil {
		return nil
	}
	t := strings.ReplaceAll(*cs, " ", "")
	t = strings.ReplaceAll(t, ",", ".")
	f, err := strconv.ParseFloat(t, 64)
	if err != nil {
		return nil
	}
	v := int64(f)
	return &v
}

// --- record for DB ---

type AdsRow struct {
	ExportDate time.Time

	SKU     *int64
	Article string

	ProductName *string
	Category    *string

	PromotionStatus *string
	LastChangeInfo  *string

	ProductPrice *string // NUMERIC as string
	BidPercent   *string // NUMERIC as string
	BidAmount    *string // NUMERIC as string

	CpcSalesAmount *string
	CpcOrdersCount *int32
	CpcSpendAmount *string
	CpoSpendAmount *string
	CpoSalesAmount *string
	CpoOrdersCount *int32
	CpoDrrPercent  *string // может отсутствовать
}

type TokenRequest struct {
	ClientID     string `json:"client_id"`
	ClientSecret string `json:"client_secret"`
	GrantType    string `json:"grant_type"`
}

type TokenResponse struct {
	AccessToken string `json:"access_token"`
	// expires_in и т.п. можно добавить при желании
}

func fetchToken(ctx context.Context, httpc *http.Client, clientID, secret string) (string, error) {
	body, _ := json.Marshal(TokenRequest{
		ClientID:     clientID,
		ClientSecret: secret,
		GrantType:    "client_credentials",
	})

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, tokenEndpoint, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := httpc.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("token http %d: %s", resp.StatusCode, string(raw))
	}

	var tr TokenResponse
	if err := json.Unmarshal(raw, &tr); err != nil {
		return "", fmt.Errorf("token json decode: %w, raw=%s", err, string(raw))
	}
	if tr.AccessToken == "" {
		return "", fmt.Errorf("empty access_token, raw=%s", string(raw))
	}
	return tr.AccessToken, nil
}

func mustEnv(k string) string {
	v := strings.TrimSpace(os.Getenv(k))
	if v == "" {
		fmt.Println("missing env:", k)
		os.Exit(1)
	}
	return v
}

func main() {
	ctx := context.Background()
	_ = godotenv.Load("../.env")

	pgDsn := mustEnv("PG_DSN")
	perfClientID := mustEnv("OZON_PERF_CLIENT_ID")
	perfSecret := mustEnv("OZON_PERF_SECRET")

	httpc := &http.Client{Timeout: 120 * time.Second}

	token, err := fetchToken(ctx, httpc, perfClientID, perfSecret)
	if err != nil {
		panic(err)
	}
	fmt.Println("token ok")

	if token == "" || pgDsn == "" {
		fmt.Println("Need env vars: OZON_PERF_TOKEN, PG_DSN")
		os.Exit(1)
	}

	// По умолчанию грузим за вчера (по Москве, как в твоём примере +03:00)
	targetDate := mustTargetDate()

	fromISO, toISO := dayRangeMoscowISO(targetDate)

	client := &PerfClient{
		Token: token,
		HTTP:  &http.Client{Timeout: 90 * time.Second},
	}

	uuid, err := client.GenerateUUID(ctx, fromISO, toISO)
	if err != nil {
		panic(err)
	}
	fmt.Println("UUID:", uuid)

	// отчёт может быть не готов — сделаем polling
	csvText, err := waitReportCSV(ctx, client, uuid, 30, 5*time.Second)
	if err != nil {
		panic(err)
	}

	rows, err := parseAdsCSV(csvText, targetDate)
	if err != nil {
		panic(err)
	}

	fmt.Println("parsed rows:", len(rows))
	if len(rows) == 0 {
		fmt.Println("no data to insert")
		return
	}

	if err := upsertAdsProducts(ctx, pgDsn, rows); err != nil {
		panic(err)
	}

	fmt.Println("done")
}

func mustTargetDate() time.Time {
	// Можно вручную: TARGET_DATE=2026-02-07
	if v := os.Getenv("TARGET_DATE"); v != "" {
		t, err := time.Parse("2006-01-02", v)
		if err != nil {
			panic("bad TARGET_DATE, expected YYYY-MM-DD")
		}
		return t
	}
	// по умолчанию вчера (UTC -> безопасно)
	now := time.Now().UTC()
	return now.AddDate(0, 0, -1).Truncate(24 * time.Hour)
}

func dayRangeMoscowISO(day time.Time) (string, string) {
	loc, _ := time.LoadLocation("Europe/Moscow")
	start := time.Date(day.Year(), day.Month(), day.Day(), 0, 0, 0, 0, loc)
	end := time.Date(day.Year(), day.Month(), day.Day(), 23, 59, 59, 0, loc)
	// ISO8601 со смещением
	return start.Format(time.RFC3339), end.Format(time.RFC3339)
}

func waitReportCSV(ctx context.Context, c *PerfClient, uuid string, attempts int, delay time.Duration) (string, error) {
	var lastErr error
	for i := 0; i < attempts; i++ {
		txt, err := c.getCSV(ctx, uuid)
		if err == nil && strings.Contains(txt, ";") && len(txt) > 10 {
			return txt, nil
		}
		if err != nil {
			lastErr = err
		} else {
			lastErr = fmt.Errorf("empty/invalid csv")
		}
		time.Sleep(delay)
	}
	return "", fmt.Errorf("report not ready: %w", lastErr)
}

func parseAdsCSV(csvText string, exportDate time.Time) ([]AdsRow, error) {
	// В примере pandas skiprows=1 => пропускаем первую строку (meta), потом читаем header
	r := csv.NewReader(strings.NewReader(csvText))
	r.Comma = ';'
	r.LazyQuotes = true

	// skip first row
	_, err := r.Read()
	if err != nil {
		return nil, fmt.Errorf("csv skip row error: %w", err)
	}

	header, err := r.Read()
	if err != nil {
		return nil, fmt.Errorf("csv header error: %w", err)
	}

	idx := make(map[string]int, len(header))
	for i, h := range header {
		idx[normHeader(h)] = i
	}

	get := func(row []string, name string) string {
		i, ok := idx[normHeader(name)]
		if !ok || i < 0 || i >= len(row) {
			return ""
		}
		return row[i]
	}

	// export_date в БД — DATE, мы дадим полуночь UTC
	exportDateUTC := exportDate.UTC().Truncate(24 * time.Hour)

	var out []AdsRow
	for {
		rec, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			// лучше пропустить кривую строку, чем упасть
			continue
		}

		articlePtr := cleanStr(get(rec, "Артикул"))
		if articlePtr == nil {
			continue
		}

		row := AdsRow{
			ExportDate: exportDateUTC,

			SKU:     toInt64(get(rec, "SKU")),
			Article: *articlePtr,

			ProductName: cleanStr(get(rec, "Название товара")),
			Category:    cleanStr(get(rec, "Категория")),

			PromotionStatus: cleanStr(get(rec, "Статус продвижения")),
			LastChangeInfo:  cleanStr(get(rec, "Последнее изменение статуса продвижения")),

			ProductPrice: toNumericString(get(rec, "Цена товара, ₽")),
			BidPercent:   toNumericString(get(rec, "Ставка, %")),
			BidAmount:    toNumericString(get(rec, "Ставка, ₽")),

			CpcSalesAmount: toNumericString(get(rec, "Продажи (CPC), ₽")),
			CpcOrdersCount: toInt32(get(rec, "Заказы (CPC), шт")),
			CpcSpendAmount: toNumericString(get(rec, "Расход (CPC), ₽")),

			CpoSpendAmount: toNumericString(get(rec, "Расход (CPO), ₽")),
			CpoSalesAmount: toNumericString(get(rec, "Продажи (CPO), ₽")),
			CpoOrdersCount: toInt32(get(rec, "Заказы (CPO), шт")),
			// может отсутствовать в CSV => просто nil
			CpoDrrPercent: toNumericString(get(rec, "ДРР (CPO), %")),
		}

		out = append(out, row)
	}

	return out, nil
}

func upsertAdsProducts(ctx context.Context, dsn string, rows []AdsRow) error {
	conn, err := pgx.Connect(ctx, dsn)
	if err != nil {
		return err
	}
	defer conn.Close(ctx)

	tx, err := conn.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	_, err = tx.Exec(ctx, `
CREATE TEMP TABLE tmp_ads_products (
	export_date DATE NOT NULL,
	sku BIGINT,
	article VARCHAR(100) NOT NULL,
	product_name TEXT,
	category VARCHAR(255),
	promotion_status VARCHAR(50),
	last_change_info TEXT,
	product_price NUMERIC(12,2),
	bid_percent NUMERIC(5,2),
	bid_amount NUMERIC(12,2),
	cpc_sales_amount NUMERIC(14,2),
	cpc_orders_count INTEGER,
	cpc_spend_amount NUMERIC(14,2),
	cpo_spend_amount NUMERIC(14,2),
	cpo_sales_amount NUMERIC(14,2),
	cpo_orders_count INTEGER,
	cpo_drr_percent NUMERIC(6,2)
) ON COMMIT DROP;
`)
	if err != nil {
		return err
	}

	copyRows := make([][]any, 0, len(rows))
	for _, r := range rows {
		copyRows = append(copyRows, []any{
			r.ExportDate, r.SKU, r.Article,
			r.ProductName, r.Category,
			r.PromotionStatus, r.LastChangeInfo,
			r.ProductPrice, r.BidPercent, r.BidAmount,
			r.CpcSalesAmount, r.CpcOrdersCount, r.CpcSpendAmount,
			r.CpoSpendAmount, r.CpoSalesAmount, r.CpoOrdersCount, r.CpoDrrPercent,
		})
	}

	_, err = tx.CopyFrom(
		ctx,
		pgx.Identifier{"tmp_ads_products"},
		[]string{
			"export_date", "sku", "article",
			"product_name", "category",
			"promotion_status", "last_change_info",
			"product_price", "bid_percent", "bid_amount",
			"cpc_sales_amount", "cpc_orders_count", "cpc_spend_amount",
			"cpo_spend_amount", "cpo_sales_amount", "cpo_orders_count", "cpo_drr_percent",
		},
		pgx.CopyFromRows(copyRows),
	)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `
INSERT INTO ads_products (
	export_date,
	sku, article,
	product_name, category,
	promotion_status, last_change_info,
	product_price, bid_percent, bid_amount,
	cpc_sales_amount, cpc_orders_count, cpc_spend_amount,
	cpo_spend_amount, cpo_sales_amount, cpo_orders_count, cpo_drr_percent
)
SELECT
	export_date,
	sku, article,
	product_name, category,
	promotion_status, last_change_info,
	product_price, bid_percent, bid_amount,
	cpc_sales_amount, cpc_orders_count, cpc_spend_amount,
	cpo_spend_amount, cpo_sales_amount, cpo_orders_count, cpo_drr_percent
FROM tmp_ads_products
ON CONFLICT (export_date, article) DO UPDATE SET
	sku = EXCLUDED.sku,
	product_name = EXCLUDED.product_name,
	category = EXCLUDED.category,
	promotion_status = EXCLUDED.promotion_status,
	last_change_info = EXCLUDED.last_change_info,
	product_price = EXCLUDED.product_price,
	bid_percent = EXCLUDED.bid_percent,
	bid_amount = EXCLUDED.bid_amount,
	cpc_sales_amount = EXCLUDED.cpc_sales_amount,
	cpc_orders_count = EXCLUDED.cpc_orders_count,
	cpc_spend_amount = EXCLUDED.cpc_spend_amount,
	cpo_spend_amount = EXCLUDED.cpo_spend_amount,
	cpo_sales_amount = EXCLUDED.cpo_sales_amount,
	cpo_orders_count = EXCLUDED.cpo_orders_count,
	cpo_drr_percent = EXCLUDED.cpo_drr_percent
;
`)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}
