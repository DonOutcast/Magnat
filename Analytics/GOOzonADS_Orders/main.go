package main

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
)

const (
	tokenEndpoint              = "https://api-performance.ozon.ru/api/client/token"
	ordersGenerateJSONEndpoint = "https://api-performance.ozon.ru/api/client/statistic/orders/generate/json"
	ordersReportEndpoint       = "https://api-performance.ozon.ru/api/client/statistics/report" // ?UUID=
)

type TokenRequest struct {
	ClientID     string `json:"client_id"`
	ClientSecret string `json:"client_secret"`
	GrantType    string `json:"grant_type"`
}

type TokenResponse struct {
	AccessToken string `json:"access_token"`
}

func mustEnv(k string) string {
	v := strings.TrimSpace(os.Getenv(k))
	if v == "" {
		fmt.Println("missing env:", k)
		os.Exit(1)
	}
	return v
}

func envOr(k, def string) string {
	v := strings.TrimSpace(os.Getenv(k))
	if v == "" {
		return def
	}
	return v
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

// -------------------- ADS ORDERS MODEL --------------------

type AdsOrderRow struct {
	OrderID     int64          // order_id
	OrderNumber sql.NullString // order_number
	OrderDate   sql.NullTime   // order_date (DATE)

	SKU         sql.NullInt64 // sku
	PromotedSKU sql.NullInt64 // promoted_sku
	Article     sql.NullString
	ProductName sql.NullString

	OrderSource sql.NullString

	Quantity      sql.NullFloat64
	SaleAmountRub sql.NullFloat64
	CostRub       sql.NullFloat64

	BidPercent sql.NullFloat64
	BidRub     sql.NullFloat64
	SpendRub   sql.NullFloat64
}

func nullText(s string) sql.NullString {
	s = strings.TrimSpace(s)
	if s == "" {
		return sql.NullString{Valid: false}
	}
	return sql.NullString{String: s, Valid: true}
}

func parseTimeRFC3339(s string) (time.Time, bool) {
	s = strings.TrimSpace(s)
	if s == "" {
		return time.Time{}, false
	}
	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		return time.Time{}, false
	}
	return t, true
}

// json can contain numbers as int/float/string → делаем аккуратный парсер
func asInt64(v any) (int64, bool) {
	switch x := v.(type) {
	case float64:
		return int64(x), true
	case int64:
		return x, true
	case json.Number:
		i, err := x.Int64()
		return i, err == nil
	case string:
		x = strings.TrimSpace(x)
		if x == "" {
			return 0, false
		}
		i, err := strconv.ParseInt(x, 10, 64)
		return i, err == nil
	default:
		return 0, false
	}
}

func asFloat64(v any) (float64, bool) {
	switch x := v.(type) {
	case float64:
		return x, true
	case json.Number:
		f, err := x.Float64()
		return f, err == nil
	case string:
		x = strings.TrimSpace(x)
		if x == "" {
			return 0, false
		}
		x = strings.ReplaceAll(x, " ", "")
		x = strings.ReplaceAll(x, "\u00A0", "")
		x = strings.ReplaceAll(x, ",", ".")
		f, err := strconv.ParseFloat(x, 64)
		return f, err == nil
	default:
		return 0, false
	}
}

func pick(m map[string]any, keys ...string) (any, bool) {
	for _, k := range keys {
		if v, ok := m[k]; ok && v != nil {
			// пустые строки считаем отсутствием
			if s, ok2 := v.(string); ok2 && strings.TrimSpace(s) == "" {
				continue
			}
			return v, true
		}
	}
	return nil, false
}

// -------------------- FETCH ORDERS JSON --------------------

type OrdersGeneratePayload struct {
	From string `json:"from"`
	To   string `json:"to"`
}

// если generate/json вернёт задачу — обычно там что-то вроде uuid/report_id/task_id
type MaybeTask struct {
	UUID string `json:"UUID"`
}

func fetchOrdersGenerateJSON(ctx context.Context, httpc *http.Client, token, fromRFC3339, toRFC3339 string) ([]byte, error) {
	body, _ := json.Marshal(OrdersGeneratePayload{From: fromRFC3339, To: toRFC3339})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, ordersGenerateJSONEndpoint, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := httpc.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("orders generate http %d: %s", resp.StatusCode, string(raw))
	}
	return raw, nil
}

// универсальный распарсер: принимает любые варианты структуры и возвращает []map[string]any
func extractRowsFromAnyJSON(raw []byte) ([]map[string]any, *MaybeTask, error) {
	// 1) может быть сразу массив
	var arr []map[string]any
	dec := json.NewDecoder(bytes.NewReader(raw))
	dec.UseNumber()
	if err := dec.Decode(&arr); err == nil && len(arr) > 0 {
		return arr, nil, nil
	}

	// 2) может быть объект
	var obj map[string]any
	dec = json.NewDecoder(bytes.NewReader(raw))
	dec.UseNumber()
	if err := dec.Decode(&obj); err != nil {
		return nil, nil, fmt.Errorf("json decode failed: %w, raw=%s", err, string(raw))
	}

	// 2a) попробуем как task
	var mt MaybeTask
	b, _ := json.Marshal(obj)
	_ = json.Unmarshal(b, &mt)
	if mt.UUID != "" {
		return nil, &mt, nil
	}

	// 2b) rows/result/data
	for _, key := range []string{"rows", "result", "data"} {
		if v, ok := obj[key]; ok {
			// бывает: result: { rows: [...] }
			if inner, ok2 := v.(map[string]any); ok2 {
				if vv, ok3 := inner["rows"]; ok3 {
					if a, ok4 := vv.([]any); ok4 {
						return anySliceToMapSlice(a), nil, nil
					}
				}
			}
			if a, ok2 := v.([]any); ok2 {
				return anySliceToMapSlice(a), nil, nil
			}
		}
	}

	// пусто — это не ошибка: просто нет данных в периоде
	return []map[string]any{}, nil, nil
}

func anySliceToMapSlice(a []any) []map[string]any {
	out := make([]map[string]any, 0, len(a))
	for _, it := range a {
		if m, ok := it.(map[string]any); ok {
			out = append(out, m)
		}
	}
	return out
}

// -------------------- OPTIONAL: POLLING TASK (IF NEEDED) --------------------

func downloadReportByUUID(ctx context.Context, httpc *http.Client, token, uuid string) ([]byte, string, int, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, ordersReportEndpoint, nil)
	if err != nil {
		return nil, "", 0, err
	}

	q := req.URL.Query()
	q.Set("UUID", uuid)
	req.URL.RawQuery = q.Encode()

	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := httpc.Do(req)
	if err != nil {
		return nil, "", 0, err
	}
	defer resp.Body.Close()

	ct := resp.Header.Get("Content-Type")
	raw, _ := io.ReadAll(resp.Body)

	// Ozon иногда возвращает 200, но текстом "report not ready"
	return raw, ct, resp.StatusCode, nil
}

func pollAndDownloadReport(ctx context.Context, httpc *http.Client, token, uuid string) ([]byte, string, error) {
	deadline := time.Now().Add(10 * time.Minute) // месяц может собираться дольше 5 минут

	for time.Now().Before(deadline) {
		raw, ct, code, err := downloadReportByUUID(ctx, httpc, token, uuid)
		if err != nil {
			fmt.Println("download error:", err)
			time.Sleep(5 * time.Second)
			continue
		}

		// иногда бывает 404/409 пока не готово
		if code < 200 || code >= 300 {
			fmt.Printf("report not ready yet: http %d body=%s\n", code, string(raw))
			time.Sleep(5 * time.Second)
			continue
		}

		// Если пришел JSON — отлично
		if strings.Contains(strings.ToLower(ct), "application/json") {
			return raw, ct, nil
		}

		// Если пришел ZIP/CSV — это тоже "готово", но формат другой
		if strings.Contains(strings.ToLower(ct), "application/zip") ||
			strings.Contains(strings.ToLower(ct), "text/csv") ||
			strings.Contains(strings.ToLower(ct), "application/octet-stream") {
			return raw, ct, nil
		}

		// Иначе — скорее всего “ещё не готов”
		fmt.Printf("report not ready yet: content-type=%s body=%s\n", ct, string(raw))
		time.Sleep(5 * time.Second)
	}

	return nil, "", fmt.Errorf("timeout waiting report uuid=%s", uuid)
}

// -------------------- TRANSFORM TO DB ROWS --------------------

func mapToAdsOrderRow(m map[string]any) (AdsOrderRow, bool) {
	// Обрати внимание: ключи могут отличаться в твоём аккаунте.
	// Я добавил несколько вариантов на случай разных схем.
	// Если у тебя в JSON другие названия — пришли 1 строку, я подправлю список ключей.

	oidAny, ok := pick(m, "order_id", "orderId", "id", "orderID")
	if !ok {
		return AdsOrderRow{}, false
	}
	oid, ok := asInt64(oidAny)
	if !ok || oid == 0 {
		return AdsOrderRow{}, false
	}

	r := AdsOrderRow{OrderID: oid}

	if v, ok := pick(m, "order_number", "orderNumber", "posting_number", "postingNumber"); ok {
		if s, ok2 := v.(string); ok2 {
			r.OrderNumber = nullText(s)
		}
	}
	if v, ok := pick(m, "order_date", "date", "created_at", "createdAt"); ok {
		if s, ok2 := v.(string); ok2 {
			if t, ok3 := parseTimeRFC3339(s); ok3 {
				// в таблице DATE → время обрежем
				r.OrderDate = sql.NullTime{Time: t.Truncate(24 * time.Hour), Valid: true}
			}
		}
	}

	// sku/promoted_sku
	if v, ok := pick(m, "sku"); ok {
		if i, ok2 := asInt64(v); ok2 {
			r.SKU = sql.NullInt64{Int64: i, Valid: true}
		}
	}
	if v, ok := pick(m, "promoted_sku", "promotedSku"); ok {
		if i, ok2 := asInt64(v); ok2 {
			r.PromotedSKU = sql.NullInt64{Int64: i, Valid: true}
		}
	}

	if v, ok := pick(m, "article", "offer_id", "offerId"); ok {
		if s, ok2 := v.(string); ok2 {
			r.Article = nullText(s)
		}
	}
	if v, ok := pick(m, "product_name", "productName", "name"); ok {
		if s, ok2 := v.(string); ok2 {
			r.ProductName = nullText(s)
		}
	}
	if v, ok := pick(m, "order_source", "source"); ok {
		if s, ok2 := v.(string); ok2 {
			r.OrderSource = nullText(s)
		}
	}

	// numbers
	if v, ok := pick(m, "quantity"); ok {
		if f, ok2 := asFloat64(v); ok2 {
			r.Quantity = sql.NullFloat64{Float64: f, Valid: true}
		}
	}
	if v, ok := pick(m, "sale_amount_rub", "saleAmountRub", "sale_amount", "saleAmount"); ok {
		if f, ok2 := asFloat64(v); ok2 {
			r.SaleAmountRub = sql.NullFloat64{Float64: f, Valid: true}
		}
	}
	if v, ok := pick(m, "cost_rub", "costRub", "cost"); ok {
		if f, ok2 := asFloat64(v); ok2 {
			r.CostRub = sql.NullFloat64{Float64: f, Valid: true}
		}
	}
	if v, ok := pick(m, "bid_percent", "bidPercent"); ok {
		if f, ok2 := asFloat64(v); ok2 {
			r.BidPercent = sql.NullFloat64{Float64: f, Valid: true}
		}
	}
	if v, ok := pick(m, "bid_rub", "bidRub", "bid"); ok {
		if f, ok2 := asFloat64(v); ok2 {
			r.BidRub = sql.NullFloat64{Float64: f, Valid: true}
		}
	}
	if v, ok := pick(m, "spend_rub", "spendRub", "spend"); ok {
		if f, ok2 := asFloat64(v); ok2 {
			r.SpendRub = sql.NullFloat64{Float64: f, Valid: true}
		}
	}

	return r, true
}

// -------------------- DB UPSERT --------------------

func upsertAdsOrders(ctx context.Context, db *sql.DB, rows []AdsOrderRow) error {
	if len(rows) == 0 {
		return nil
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	stmt, err := tx.PrepareContext(ctx, `
		INSERT INTO public.ads_orders (
			order_id, order_number, order_date,
			sku, promoted_sku, article, product_name,
			order_source,
			quantity, sale_amount_rub, cost_rub,
			bid_percent, bid_rub, spend_rub
		) VALUES (
			$1, $2, $3,
			$4, $5, $6, $7,
			$8,
			$9, $10, $11,
			$12, $13, $14
		)
		ON CONFLICT (order_id) DO UPDATE SET
			order_number = EXCLUDED.order_number,
			order_date = EXCLUDED.order_date,
			sku = EXCLUDED.sku,
			promoted_sku = EXCLUDED.promoted_sku,
			article = EXCLUDED.article,
			product_name = EXCLUDED.product_name,
			order_source = EXCLUDED.order_source,
			quantity = EXCLUDED.quantity,
			sale_amount_rub = EXCLUDED.sale_amount_rub,
			cost_rub = EXCLUDED.cost_rub,
			bid_percent = EXCLUDED.bid_percent,
			bid_rub = EXCLUDED.bid_rub,
			spend_rub = EXCLUDED.spend_rub
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, r := range rows {
		_, err := stmt.ExecContext(ctx,
			r.OrderID, r.OrderNumber, r.OrderDate,
			r.SKU, r.PromotedSKU, r.Article, r.ProductName,
			r.OrderSource,
			r.Quantity, r.SaleAmountRub, r.CostRub,
			r.BidPercent, r.BidRub, r.SpendRub,
		)
		if err != nil {
			return fmt.Errorf("upsert failed order_id=%d: %w", r.OrderID, err)
		}
	}

	return tx.Commit()
}

// -------------------- MAIN --------------------

func main() {
	ctx := context.Background()
	_ = godotenv.Load("../.env")

	perfClientID := mustEnv("OZON_PERF_CLIENT_ID")
	perfSecret := mustEnv("OZON_PERF_SECRET")
	pgDsn := mustEnv("PG_DSN")

	// Период можно задавать env:
	// ADS_ORDERS_FROM="2025-12-21T00:00:00Z"
	// ADS_ORDERS_TO="2025-12-25T23:59:59Z"
	from := "2025-12-01T00:00:00Z" //envOr("ADS_ORDERS_FROM", time.Now().Add(-48*time.Hour).UTC().Format(time.RFC3339))
	to := "2026-01-15T23:59:59Z"   //envOr("ADS_ORDERS_TO", time.Now().UTC().Format(time.RFC3339))

	httpc := &http.Client{Timeout: 120 * time.Second}

	// 1) token
	token, err := fetchToken(ctx, httpc, perfClientID, perfSecret)
	if err != nil {
		panic(err)
	}
	fmt.Println("token ok")

	raw, err := fetchOrdersGenerateJSON(ctx, httpc, token, from, to)
	if err != nil {
		panic(err)
	}
	fmt.Println("orders generate raw:", string(raw))

	// тут достаём UUID
	var task MaybeTask
	if err := json.Unmarshal(raw, &task); err != nil || task.UUID == "" {
		panic(fmt.Errorf("no UUID in generate/json response: %s", string(raw)))
	}

	fmt.Println("got task UUID:", task.UUID, "-> downloading report...")

	raw2, ct, err := pollAndDownloadReport(ctx, httpc, token, task.UUID)
	if err != nil {
		panic(err)
	}
	fmt.Println("downloaded bytes:", len(raw2), "content-type:", ct)

	_ = os.WriteFile("report.bin", raw2, 0644)
	fmt.Println("saved: report.bin")

	if !strings.Contains(strings.ToLower(ct), "application/json") {
		panic(fmt.Errorf("report is not json (ct=%s). Saved to report.bin", ct))
	}

	// raw2 — это и есть отчет (для json-отчёта ожидаем JSON)
	rowsAny, task2, err := extractRowsFromAnyJSON(raw2)
	if err != nil {
		panic(err)
	}
	if task2 != nil {
		panic("unexpected: got task again after report download")
	}

	// 4) map -> db rows
	out := make([]AdsOrderRow, 0, len(rowsAny))
	for _, m := range rowsAny {
		r, ok := mapToAdsOrderRow(m)
		if !ok {
			continue
		}
		out = append(out, r)
	}
	fmt.Println("parsed rows:", len(out))

	// 5) upsert
	db, err := sql.Open("pgx", pgDsn)
	if err != nil {
		panic(err)
	}
	defer db.Close()
	if err := db.PingContext(ctx); err != nil {
		panic(err)
	}

	if err := upsertAdsOrders(ctx, db, out); err != nil {
		panic(err)
	}

	fmt.Println("done")
}
