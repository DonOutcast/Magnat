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

	// Telegram лимит по длине сообщения ~4096 символов.
	// Чтобы не падать — порежем.
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

func envBool(key string, def bool) bool {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return def
	}
	v = strings.ToLower(v)
	return v == "1" || v == "true" || v == "yes" || v == "y"
}

func envInt(key string, def int) int {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return def
	}
	if i, err := strconv.Atoi(v); err == nil {
		return i
	}
	return def
}

type DatePlan struct {
	// для orders (RFC3339 UTC)
	FromRFC3339 string
	ToRFC3339   string

	// для daily (без времени)
	FromDate string // YYYY-MM-DD
	ToDate   string // YYYY-MM-DD

	// для search (окно)
	FromSearch string // YYYY-MM-DD
	ToSearch   string // YYYY-MM-DD

	// target date
	TargetDate string // YYYY-MM-DD
}

func resolveDatePlan() DatePlan {
	useEnv := envBool("USE_ENV_DATES", false)
	loc := getMoscowLoc()
	now := time.Now().In(loc)

	// сегодня 00:00 по Москве
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)

	// вчера: [00:00:00 .. 23:59:59] по Москве
	yStart := todayStart.AddDate(0, 0, -1)
	yEnd := yStart.Add(24*time.Hour - time.Second)

	// для search: последние N дней до "вчера" включительно
	searchDays := envInt("SEARCH_DAYS_BACK", 30)
	if searchDays < 1 {
		searchDays = 30
	}
	searchFrom := yStart.AddDate(0, 0, -(searchDays - 1)) // включая вчера = N дней

	// по умолчанию — авто режим (вчера)
	p := DatePlan{
		FromRFC3339: yStart.UTC().Format(time.RFC3339),
		ToRFC3339:   yEnd.UTC().Format(time.RFC3339),

		FromDate: yStart.Format("2006-01-02"),
		ToDate:   yStart.Format("2006-01-02"), // один день

		FromSearch: searchFrom.Format("2006-01-02"),
		ToSearch:   yStart.Format("2006-01-02"),

		TargetDate: yStart.Format("2006-01-02"),
	}

	// ручной режим: берём из env
	if useEnv {
		p.FromRFC3339 = mustEnv("PROCESSED_FROM")
		p.ToRFC3339 = mustEnv("PROCESSED_TO")

		p.FromDate = mustEnv("PROCESSED_FROM_WITHOUT_TIME")
		p.ToDate = mustEnv("PROCESSED_TO_WITHOUT_TIME")

		p.FromSearch = mustEnv("PROCESSED_FROM_SEARCH")
		p.ToSearch = mustEnv("PROCESSED_TO_SEARCH")

		p.TargetDate = mustEnv("TARGET_DATE")
	}

	return p
}

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

func debugCSV(csvText string) {
	fmt.Println("========== DEBUG CSV START ==========")

	fmt.Println("TOTAL LENGTH:", len(csvText))

	// покажем первые 800 символов
	limit := 800
	if len(csvText) < limit {
		limit = len(csvText)
	}
	fmt.Println("FIRST BYTES:\n")
	fmt.Println(csvText[:limit])

	fmt.Println("\n---- RAW LINES (first 10) ----")

	lines := strings.Split(csvText, "\n")
	for i := 0; i < len(lines) && i < 10; i++ {
		fmt.Printf("[%d] %s\n", i+1, lines[i])
	}

	fmt.Println("========== DEBUG CSV END ==========")
}

func main() {
	ctx := context.Background()
	_ = godotenv.Load("../.env")

	pgDsn := mustEnv("PG_DSN")
	perfClientID := mustEnv("OZON_PERF_CLIENT_ID")
	perfSecret := mustEnv("OZON_PERF_SECRET")
	tgToken := strings.TrimSpace(os.Getenv("TG_BOT_TOKEN"))
	tgChatID := strings.TrimSpace(os.Getenv("TG_CHAT_ID"))

	httpc := &http.Client{Timeout: 120 * time.Second}

	// Для отчёта в телеграм
	targetDate := mustTargetDate()
	var uuid string
	parsedRows := -1
	var finalErr error

	// ✅ единая отправка результата (OK/ERROR) при любом выходе
	defer func() {
		if r := recover(); r != nil {
			// превратим panic в error
			switch x := r.(type) {
			case error:
				finalErr = x
			default:
				finalErr = fmt.Errorf("%v", x)
			}
		}

		if tgToken == "" || tgChatID == "" {
			// телеги нет — просто выходим
			if finalErr != nil {
				// чтобы panic не "проглотился" в режиме без телеги
				panic(finalErr)
			}
			return
		}

		status := "✅"
		if finalErr != nil {
			status = "❌"
		}

		// uuid может быть пустой, rows может быть -1
		uuidText := uuid
		if uuidText == "" {
			uuidText = "-"
		}
		rowsText := "n/a"
		if parsedRows >= 0 {
			rowsText = strconv.Itoa(parsedRows)
		}

		text := fmt.Sprintf(
			"ADS_Products %s\ndate=%s\nuuid=%s\nparsed_rows=%s",
			status,
			targetDate.In(getMoscowLoc()).Format("2006-01-02"),
			uuidText,
			rowsText,
		)

		// Добавим ошибку (обрежется внутри sendTelegramMessage)
		if finalErr != nil {
			text += "\nerror=" + finalErr.Error()
		}

		if err := sendTelegramMessage(ctx, httpc, tgToken, tgChatID, text); err != nil {
			fmt.Println("telegram send failed:", err)
		}

		// если был panic — пробросим дальше, чтобы крон/мониторинг видел ненулевой exit
		if finalErr != nil {
			panic(finalErr)
		}
	}()

	// --- обычная логика ---

	token, err := fetchToken(ctx, httpc, perfClientID, perfSecret)
	if err != nil {
		finalErr = err
		panic(err)
	}
	fmt.Println("token ok")

	if token == "" || pgDsn == "" {
		finalErr = fmt.Errorf("need env vars: OZON_PERF_TOKEN, PG_DSN")
		panic(finalErr)
	}

	fromISO, toISO := dayRangeMoscowISO(targetDate)

	client := &PerfClient{
		Token: token,
		HTTP:  &http.Client{Timeout: 90 * time.Second},
	}

	uuid, err = client.GenerateUUID(ctx, fromISO, toISO)
	if err != nil {
		finalErr = err
		panic(err)
	}
	fmt.Println("UUID:", uuid)

	csvText, err := waitReportCSV(ctx, client, uuid, 30, 5*time.Second)
	if err != nil {
		finalErr = err
		panic(err)
	}

	rows, err := parseAdsCSV(csvText, targetDate)
	if err != nil {
		finalErr = err
		panic(err)
	}

	parsedRows = len(rows)
	fmt.Println("parsed rows:", parsedRows)

	if parsedRows == 0 {
		// Это не ошибка — просто нет данных
		fmt.Println("no data to insert")
		return
	}

	if err := upsertAdsProducts(ctx, pgDsn, rows); err != nil {
		finalErr = err
		panic(err)
	}

	fmt.Println("done")
}

func mustTargetDate() time.Time {
	// 1) ручной режим: TARGET_DATE=YYYY-MM-DD
	if v := strings.TrimSpace(os.Getenv("TARGET_DATE")); v != "" {
		t, err := time.Parse("2006-01-02", v)
		if err != nil {
			panic("bad TARGET_DATE, expected YYYY-MM-DD")
		}
		return t
	}

	// 2) авто-режим: вчера по Москве
	loc := getMoscowLoc()
	now := time.Now().In(loc)
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
	yesterdayStart := todayStart.AddDate(0, 0, -1)

	// возвращаем "день" (в московской зоне) — time.Date уже в loc
	return yesterdayStart
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
	r.TrimLeadingSpace = true
	r.FieldsPerRecord = -1

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
	//fmt.Println("HEADER FIELDS COUNT:", len(header))
	for i, h := range header {
		//fmt.Printf("[%d] %s\n", i, normHeader(h))

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
			Category:    cleanStr(get(rec, "Категория товара")),

			PromotionStatus: cleanStr(get(rec, "Продвижение")),
			LastChangeInfo:  cleanStr(get(rec, "Последнее изменение")),

			ProductPrice: toNumericString(get(rec, "Цена товара, ₽")),
			BidPercent:   toNumericString(get(rec, "Ставка, %")),
			BidAmount:    toNumericString(get(rec, "Ставка, ₽")),

			// CPC
			CpcSalesAmount: toNumericString(get(rec, `Продажи ("Оплата за клики"), ₽`)),
			CpcOrdersCount: toInt32(get(rec, `Заказы ("Оплата за клики"), шт.`)),
			CpcSpendAmount: toNumericString(get(rec, `Расход ("Оплата за клики"), ₽`)),

			// CPO
			CpoSpendAmount: toNumericString(get(rec, `Расход ("Оплата за заказ"), ₽`)),
			CpoSalesAmount: toNumericString(get(rec, `Продажи ("Оплата за заказ"), ₽`)),
			CpoOrdersCount: toInt32(get(rec, `Заказы ("Оплата за заказ"), шт.`)),
			CpoDrrPercent:  toNumericString(get(rec, `ДРР ("Оплата за заказ"), %`)),
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
FROM (
  SELECT DISTINCT ON (export_date, article)
    export_date,
    sku, article,
    product_name, category,
    promotion_status, last_change_info,
    product_price, bid_percent, bid_amount,
    cpc_sales_amount, cpc_orders_count, cpc_spend_amount,
    cpo_spend_amount, cpo_sales_amount, cpo_orders_count, cpo_drr_percent
  FROM tmp_ads_products
  ORDER BY export_date, article,
           -- правило выбора "лучшей" строки среди дублей:
           -- 1) где больше продаж/расхода, 2) где есть SKU, 3) что угодно
           COALESCE(cpo_sales_amount, 0) DESC,
           COALESCE(cpc_sales_amount, 0) DESC,
           (sku IS NOT NULL) DESC
) t
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
  cpo_drr_percent = EXCLUDED.cpo_drr_percent;

`)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}
