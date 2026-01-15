package main

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
)

const (
	tokenEndpoint = "https://api-performance.ozon.ru/api/client/token"
	dailyEndpoint = "https://api-performance.ozon.ru/api/client/statistics/daily"
)

type TokenRequest struct {
	ClientID     string `json:"client_id"`
	ClientSecret string `json:"client_secret"`
	GrantType    string `json:"grant_type"`
}

type TokenResponse struct {
	AccessToken string `json:"access_token"`
	// expires_in и т.п. можно добавить при желании
}

var reTopSuffix = regexp.MustCompile(`(?i)\s*[-—]\s*(вывод\s+в\s+топ|топ)\s*$`)

func articleFromCampaignName(name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return ""
	}
	return strings.TrimSpace(reTopSuffix.ReplaceAllString(name, ""))
}

func mustEnv(k string) string {
	v := strings.TrimSpace(os.Getenv(k))
	if v == "" {
		fmt.Println("missing env:", k)
		os.Exit(1)
	}
	return v
}

func getExportDateMoscow() time.Time {
	loc, _ := time.LoadLocation("Europe/Moscow")
	return time.Now().In(loc).Truncate(24 * time.Hour)
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

func fetchDailyCSV(ctx context.Context, httpc *http.Client, token, dateFrom, dateTo string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, dailyEndpoint, nil)
	if err != nil {
		return nil, err
	}

	q := req.URL.Query()
	q.Add("dateFrom", dateFrom)
	q.Add("dateTo", dateTo)
	req.URL.RawQuery = q.Encode()

	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := httpc.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("daily http %d: %s", resp.StatusCode, string(raw))
	}
	return raw, nil
}

// --- CSV parsing helpers ---

func normalizeHeader(s string) string {
	s = strings.TrimSpace(strings.ToLower(s))
	s = strings.ReplaceAll(s, "\uFEFF", "") // BOM

	// вычищаем пунктуацию/валюту/пробелы
	repl := []string{
		" ", "", "\t", "",
		"_", "", "-", "",
		",", "", ".", "",
		"(", "", ")", "",
		"₽", "", "№", "",
	}
	for i := 0; i < len(repl); i += 2 {
		s = strings.ReplaceAll(s, repl[i], repl[i+1])
	}

	// часто встречается "руб" / "rur"
	s = strings.ReplaceAll(s, "руб", "")
	s = strings.ReplaceAll(s, "rur", "")
	return s
}

func pick(row map[string]string, keys ...string) string {
	for _, k := range keys {
		if v, ok := row[normalizeHeader(k)]; ok && strings.TrimSpace(v) != "" {
			return strings.TrimSpace(v)
		}
	}
	return ""
}

func parseInt64(s string) (int64, bool) {
	s = strings.TrimSpace(s)
	if s == "" {
		return 0, false
	}
	s = strings.ReplaceAll(s, " ", "")
	s = strings.ReplaceAll(s, "\u00A0", "")
	v, err := strconv.ParseInt(s, 10, 64)
	if err != nil {
		return 0, false
	}
	return v, true
}

func parseInt(s string) int {
	v, ok := parseInt64(s)
	if !ok {
		return 0
	}
	// защита от переполнения int32 можно не делать — но ок
	if v > int64(^uint(0)>>1) {
		return 0
	}
	return int(v)
}

func parseMoney(s string) (float64, bool) {
	s = strings.TrimSpace(s)
	if s == "" {
		return 0, false
	}
	s = strings.ReplaceAll(s, " ", "")
	s = strings.ReplaceAll(s, "\u00A0", "")
	s = strings.ReplaceAll(s, ",", ".")
	v, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return 0, false
	}
	return v, true
}

func parseDateAny(s string) (time.Time, bool) {
	s = strings.TrimSpace(s)
	if s == "" {
		return time.Time{}, false
	}
	// самые частые форматы
	layouts := []string{
		"2006-01-02",
		"02.01.2006",
		"2006/01/02",
		"02/01/2006",
		"2006-01-02 15:04:05",
		"02.01.2006 15:04:05",
	}
	for _, l := range layouts {
		if t, err := time.Parse(l, s); err == nil {
			return t, true
		}
	}
	return time.Time{}, false
}

// --- data model / aggregation ---

type AdsAggKey struct {
	StatsDate  time.Time // день статистики (из колонки "Дата")
	CampaignID int64
}

type AdsAggRow struct {
	ExportDate   time.Time
	CampaignID   int64
	CampaignName sql.NullString
	Article      sql.NullString
	StatsDate    sql.NullTime
	Impressions  int
	Clicks       int
	SpendRub     sql.NullFloat64
	AvgBidRub    sql.NullFloat64
	OrdersCount  int
	OrdersRub    sql.NullFloat64
}

func nullText(s string) sql.NullString {
	s = strings.TrimSpace(s)
	if s == "" {
		return sql.NullString{Valid: false}
	}
	return sql.NullString{String: s, Valid: true}
}

func aggregateDaily(exportDate time.Time, csvBytes []byte) ([]AdsAggRow, error) {
	r := csv.NewReader(bytes.NewReader(csvBytes))
	r.Comma = ';'
	r.FieldsPerRecord = -1

	records, err := r.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("csv read: %w", err)
	}
	if len(records) < 2 {
		return nil, fmt.Errorf("csv has no data rows")
	}

	headers := records[0]
	hmap := make([]string, len(headers))
	for i, h := range headers {
		hmap[i] = normalizeHeader(h)
	}

	agg := make(map[AdsAggKey]*AdsAggRow)

	for _, rec := range records[1:] {
		// row map header->value
		row := map[string]string{}
		for i := 0; i < len(rec) && i < len(hmap); i++ {
			row[hmap[i]] = rec[i]
		}

		// campaign_id
		cidStr := pick(row,
			"id", "campaign_id", "campaignid", "idcampaign", "idкампании", "кампанияid",
		)
		cid, ok := parseInt64(cidStr)
		if !ok || cid == 0 {
			continue
		}

		dt, ok := parseDateAny(pick(row, "date", "stats_date", "statsdate", "дата", "Дата"))
		if !ok {
			continue
		}
		statsDay := dt.Truncate(24 * time.Hour)

		key := AdsAggKey{StatsDate: statsDay, CampaignID: cid}
		cur, exists := agg[key]

		if !exists {
			cur = &AdsAggRow{
				ExportDate:   exportDate,
				CampaignID:   cid,
				StatsDate:    sql.NullTime{Time: statsDay, Valid: true},
				CampaignName: nullText(pick(row, "campaign_name", "campaignname", "namecampaign", "названиекампании", "кампания", "Название")),
				Article:      nullText(pick(row, "article", "sku", "offer_id", "offerid", "артикул")),
			}

			agg[key] = cur
		}

		// numeric fields (sum)
		cur.Impressions += parseInt(pick(row, "impressions", "shows", "показы"))
		cur.Clicks += parseInt(pick(row, "clicks", "клики"))

		if v, ok := parseMoney(pick(row, "spend_rub", "spend", "cost", "расход", "затраты", "расход₽")); ok {
			if cur.SpendRub.Valid {
				cur.SpendRub.Float64 += v
			} else {
				cur.SpendRub = sql.NullFloat64{Float64: v, Valid: true}
			}
		}

		// avg bid: обычно это среднее по строке. Если строк много, честнее пересчитать взвешенно.
		// Но т.к. у нас нет веса, делаем простой "последнее ненулевое" (или можно среднее).
		if v, ok := parseMoney(pick(row, "avg_bid_rub", "avgbid", "avgcpc", "средняяставка", "срставка")); ok {
			cur.AvgBidRub = sql.NullFloat64{Float64: v, Valid: true}
		}

		cur.OrdersCount += parseInt(pick(row, "orders_count", "orders", "заказы"))
		if v, ok := parseMoney(pick(row, "orders_rub", "orders_sum", "orderssum", "заказы₽", "заказыруб", "заказысумма")); ok {
			if cur.OrdersRub.Valid {
				cur.OrdersRub.Float64 += v
			} else {
				cur.OrdersRub = sql.NullFloat64{Float64: v, Valid: true}
			}
		}

		// если stats_date встречается, но у первой строки не было — подставим
		if !cur.StatsDate.Valid {
			if dt, ok := parseDateAny(pick(row, "date", "stats_date", "statsdate", "дата")); ok {
				cur.StatsDate = sql.NullTime{Time: dt, Valid: true}
			}
		}

		// если campaign_name пустой — попробуем заполнить из этой строки
		if !cur.CampaignName.Valid {
			cur.CampaignName = nullText(pick(row, "campaign_name", "campaignname", "namecampaign", "названиекампании", "кампания", "Название"))
		}
		if (!cur.Article.Valid || strings.TrimSpace(cur.Article.String) == "") && cur.CampaignName.Valid {
			a := articleFromCampaignName(cur.CampaignName.String)
			if a != "" {
				cur.Article = sql.NullString{String: a, Valid: true}
			}
		}

		// article так же
		if !cur.Article.Valid {
			cur.Article = nullText(pick(row, "article", "sku", "offer_id", "offerid", "артикул"))
		}
	}

	out := make([]AdsAggRow, 0, len(agg))
	for _, v := range agg {
		out = append(out, *v)
	}
	return out, nil
}

// --- DB upsert ---

func upsertAdsAgg(ctx context.Context, db *sql.DB, rows []AdsAggRow) error {
	if len(rows) == 0 {
		return nil
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	stmt, err := tx.PrepareContext(ctx, `
		INSERT INTO public.ads_aggregated (
			export_date,
			campaign_id, campaign_name, article,
			stats_date,
			impressions, clicks,
			spend_rub, avg_bid_rub,
			orders_count, orders_rub
		)
		VALUES (
			$1,
			$2, $3, $4,
			$5,
			$6, $7,
			$8, $9,
			$10, $11
		)
		ON CONFLICT (stats_date, campaign_id) DO UPDATE SET
			campaign_name = EXCLUDED.campaign_name,
			article = EXCLUDED.article,
			stats_date = EXCLUDED.stats_date,
			impressions = EXCLUDED.impressions,
			clicks = EXCLUDED.clicks,
			spend_rub = EXCLUDED.spend_rub,
			avg_bid_rub = EXCLUDED.avg_bid_rub,
			orders_count = EXCLUDED.orders_count,
			orders_rub = EXCLUDED.orders_rub
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, r := range rows {
		_, err := stmt.ExecContext(ctx,
			r.ExportDate,
			r.CampaignID, r.CampaignName, r.Article,
			r.StatsDate,
			r.Impressions, r.Clicks,
			r.SpendRub, r.AvgBidRub,
			r.OrdersCount, r.OrdersRub,
		)
		if err != nil {
			return fmt.Errorf("upsert failed export_date=%s campaign_id=%d: %w",
				r.ExportDate.Format("2006-01-02"), r.CampaignID, err)
		}
	}

	return tx.Commit()
}

func main() {
	ctx := context.Background()
	_ = godotenv.Load("../.env")

	perfClientID := mustEnv("OZON_PERF_CLIENT_ID")
	perfSecret := mustEnv("OZON_PERF_SECRET")
	pgDsn := mustEnv("PG_DSN")

	httpc := &http.Client{Timeout: 120 * time.Second}

	exportDate := getExportDateMoscow()

	// 1) token
	token, err := fetchToken(ctx, httpc, perfClientID, perfSecret)
	if err != nil {
		panic(err)
	}
	fmt.Println("token ok")

	// 2) daily csv
	dateFrom := "2025-12-01"
	dateTo := "2025-12-31"
	rawCSV, err := fetchDailyCSV(ctx, httpc, token, dateFrom, dateTo)
	//_ = os.WriteFile("daily.csv", rawCSV, 0644)
	//fmt.Println("saved: daily.csv")
	if err != nil {
		panic(err)
	}
	fmt.Println("daily csv bytes:", len(rawCSV))

	// 3) parse + aggregate
	rows, err := aggregateDaily(exportDate, rawCSV)
	if err != nil {
		panic(err)
	}
	fmt.Printf("aggregated rows: %d (export_date=%s)\n", len(rows), exportDate.Format("2006-01-02"))

	// 4) db upsert
	db, err := sql.Open("pgx", pgDsn)
	if err != nil {
		panic(err)
	}
	defer db.Close()
	if err := db.PingContext(ctx); err != nil {
		panic(err)
	}

	if err := upsertAdsAgg(ctx, db, rows); err != nil {
		panic(err)
	}

	fmt.Println("done")
}
