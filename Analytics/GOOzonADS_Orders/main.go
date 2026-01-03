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
	tokenEndpoint = "https://api-performance.ozon.ru/api/client/token"

	// Твой endpoint:
	ordersGenerateJSONEndpoint = "https://api-performance.ozon.ru/api/client/statistic/orders/generate/json"

	// Если generate/json вернёт UUID задачи — эти endpoints могут понадобиться.
	// ВАЖНО: у Ozon в разных местах встречаются варианты путей.
	// Если у тебя не совпадёт — пришли реальный ответ generate/json, я подгоню точно.
	ordersTaskStatusEndpointTmpl = "https://api-performance.ozon.ru/api/client/statistics/%s"     // пример: /api/client/statistics/{UUID}
	ordersDownloadEndpoint       = "https://api-performance.ozon.ru/api/client/statistics/report" // пример: /api/client/statistics/report?UUID=...
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
	UUID     string `json:"uuid"`
	TaskID   string `json:"task_id"`
	ReportID string `json:"report_id"`
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
	if mt.UUID != "" || mt.TaskID != "" || mt.ReportID != "" {
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

func pollAndDownloadIfTask(ctx context.Context, httpc *http.Client, token string, task *MaybeTask) ([]byte, error) {
	uuid := task.UUID
	if uuid == "" {
		uuid = task.TaskID
	}
	if uuid == "" {
		uuid = task.ReportID
	}
	if uuid == "" {
		return nil, fmt.Errorf("task returned but uuid/task_id/report_id is empty")
	}

	// Поллим до 5 минут
	deadline := time.Now().Add(5 * time.Minute)
	statusURL := fmt.Sprintf(ordersTaskStatusEndpointTmpl, uuid)

	for time.Now().Before(deadline) {
		req, _ := http.NewRequestWithContext(ctx, http.MethodGet, statusURL, nil)
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := httpc.Do(req)
		if err != nil {
			return nil, err
		}
		raw, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		if resp.StatusCode < 200 || resp.StatusCode >= 300 {
			return nil, fmt.Errorf("task status http %d: %s", resp.StatusCode, string(raw))
		}

		// ожидаем что в ответе будет status=OK/READY/FINISHED или похожее
		var st map[string]any
		dec := json.NewDecoder(bytes.NewReader(raw))
		dec.UseNumber()
		_ = dec.Decode(&st)

		// пробуем найти любой статус
		status := ""
		if v, ok := st["status"]; ok {
			if s, ok2 := v.(string); ok2 {
				status = strings.ToLower(strings.TrimSpace(s))
			}
		}

		if status == "ok" || status == "ready" || status == "finished" || status == "success" {
			// скачиваем report
			// часто это /api/client/statistics/report?UUID=<uuid>
			dlURL := ordersDownloadEndpoint + "?UUID=" + uuid

			req2, _ := http.NewRequestWithContext(ctx, http.MethodGet, dlURL, nil)
			req2.Header.Set("Authorization", "Bearer "+token)

			resp2, err := httpc.Do(req2)
			if err != nil {
				return nil, err
			}
			out, _ := io.ReadAll(resp2.Body)
			resp2.Body.Close()

			if resp2.StatusCode < 200 || resp2.StatusCode >= 300 {
				return nil, fmt.Errorf("download http %d: %s", resp2.StatusCode, string(out))
			}
			return out, nil
		}

		// ждём и пробуем снова
		time.Sleep(5 * time.Second)
	}

	return nil, fmt.Errorf("task not ready after timeout, uuid=%s", uuid)
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
	from := envOr("ADS_ORDERS_FROM", time.Now().Add(-48*time.Hour).UTC().Format(time.RFC3339))
	to := envOr("ADS_ORDERS_TO", time.Now().UTC().Format(time.RFC3339))

	httpc := &http.Client{Timeout: 120 * time.Second}

	// 1) token
	token, err := fetchToken(ctx, httpc, perfClientID, perfSecret)
	if err != nil {
		panic(err)
	}
	fmt.Println("token ok")

	// 2) generate json
	raw, err := fetchOrdersGenerateJSON(ctx, httpc, token, from, to)
	if err != nil {
		panic(err)
	}
	fmt.Println("orders generate bytes:", len(raw))

	// 3) parse (rows or task)
	rowsAny, task, err := extractRowsFromAnyJSON(raw)
	if err != nil {
		panic(err)
	}

	// Если это задача — пробуем дождаться и скачать готовый JSON
	if task != nil {
		fmt.Printf("got task (uuid=%s task_id=%s report_id=%s) -> polling...\n", task.UUID, task.TaskID, task.ReportID)
		raw2, err := pollAndDownloadIfTask(ctx, httpc, token, task)
		if err != nil {
			panic(err)
		}
		fmt.Println("downloaded bytes:", len(raw2))

		rowsAny, task, err = extractRowsFromAnyJSON(raw2)
		if err != nil {
			panic(err)
		}
		if task != nil {
			panic("unexpected: still task after download")
		}
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
