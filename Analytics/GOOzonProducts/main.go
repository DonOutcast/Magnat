package main

import (
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
	createReportEndpoint = "https://api-seller.ozon.ru/v1/report/products/create"
	infoReportEndpoint   = "https://api-seller.ozon.ru/v1/report/info"
)

type OzonClient struct {
	ClientID string
	APIKey   string
	HTTP     *http.Client
}

type createReportResp struct {
	Result struct {
		Code string `json:"code"`
	} `json:"result"`
}

type infoReportResp struct {
	Result struct {
		File string `json:"file"`
	} `json:"result"`
}

func (c *OzonClient) postJSON(ctx context.Context, url string, body any, out any) error {
	var rdr io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return err
		}
		rdr = strings.NewReader(string(b))
	} else {
		rdr = strings.NewReader(`{}`)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, rdr)
	if err != nil {
		return err
	}
	req.Header.Set("Client-Id", c.ClientID)
	req.Header.Set("Api-Key", c.APIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTP.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("ozon http %d: %s", resp.StatusCode, string(b))
	}

	return json.NewDecoder(resp.Body).Decode(out)
}

func (c *OzonClient) CreateProductsReport(ctx context.Context) (string, error) {
	payload := map[string]any{
		"language":   "DEFAULT",
		"offer_id":   []string{},
		"search":     "",
		"sku":        []string{},
		"visibility": "ALL",
	}

	var out createReportResp
	if err := c.postJSON(ctx, createReportEndpoint, payload, &out); err != nil {
		return "", err
	}
	if out.Result.Code == "" {
		return "", errors.New("empty report code")
	}
	return out.Result.Code, nil
}

func (c *OzonClient) GetReportFileURL(ctx context.Context, code string) (string, error) {
	payload := map[string]any{"code": code}
	var out infoReportResp
	if err := c.postJSON(ctx, infoReportEndpoint, payload, &out); err != nil {
		return "", err
	}
	if out.Result.File == "" {
		return "", errors.New("empty file url")
	}
	return out.Result.File, nil
}

func downloadCSV(ctx context.Context, httpClient *http.Client, url string) (io.ReadCloser, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		return nil, fmt.Errorf("download http %d: %s", resp.StatusCode, string(b))
	}
	return resp.Body, nil
}

// --- cleaning helpers ---

func cleanStr(s string) *string {
	s = strings.TrimSpace(s)
	if s == "" || strings.EqualFold(s, "nan") {
		return nil
	}
	// убираем ведущий апостроф из "'4.90"
	s = strings.TrimLeft(s, "'")
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	return &s
}

func toInt(s string) *int32 {
	cs := cleanStr(s)
	if cs == nil {
		return nil
	}
	// иногда бывает "1130.0"
	f, err := strconv.ParseFloat(strings.ReplaceAll(*cs, ",", "."), 64)
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
	f, err := strconv.ParseFloat(strings.ReplaceAll(*cs, ",", "."), 64)
	if err != nil {
		return nil
	}
	v := int64(f)
	return &v
}

func toFloat(s string) *float64 {
	cs := cleanStr(s)
	if cs == nil {
		return nil
	}
	// уберём ₽ и пробелы
	t := strings.ReplaceAll(*cs, "₽", "")
	t = strings.TrimSpace(t)
	f, err := strconv.ParseFloat(strings.ReplaceAll(t, ",", "."), 64)
	if err != nil {
		return nil
	}
	return &f
}

func toVATPercent(s string) *float64 {
	cs := cleanStr(s)
	if cs == nil {
		return nil
	}
	t := strings.ReplaceAll(*cs, "%", "")
	t = strings.TrimSpace(t)
	return toFloat(t)
}

func toTime(s string) *time.Time {
	cs := cleanStr(s)
	if cs == nil {
		return nil
	}
	// ожидаем "2022-08-30 13:32:08"
	layouts := []string{
		"2006-01-02 15:04:05",
		time.RFC3339,
		"02.01.2006 15:04:05",
	}
	for _, l := range layouts {
		if t, err := time.ParseInLocation(l, *cs, time.UTC); err == nil {
			return &t
		}
	}
	return nil
}

// --- record for DB insertion ---

type ProductRow struct {
	ExportDate time.Time

	Article      string
	OzonProdID   *int64
	SKU          *int64
	Barcode      *string
	ProductName  *string
	Category     *string
	ProductType  *string
	QtyInPack    *int32
	VolumeLiters *float64

	ProductStatus  *string
	Labels         *string
	OzonVisibility *string
	HiddenReason   *string

	ReviewsCount *int32
	Rating       *float64

	FboSalesVolume      *int32
	AvailableRealFBS    *int32
	ReservedMyWarehouse *int32
	AvailableFBS        *int32

	CurrentPrice        *float64
	PriceBeforeDiscount *float64
	VatPercent          *float64
	OzonOfferPrice      *float64
	CreatedAt           *time.Time
}

func main() {
	ctx := context.Background()
	err := godotenv.Load("../.env")
	if err != nil {
		fmt.Println("Error loading .env file")
	}

	clientID := os.Getenv("OZON_CLIENT_ID")
	apiKey := os.Getenv("OZON_API_KEY")
	pgDsn := os.Getenv("PG_DSN")

	if clientID == "" || apiKey == "" || pgDsn == "" {
		fmt.Println("Need env vars: OZON_CLIENT_ID, OZON_API_KEY, PG_DSN")
		os.Exit(1)
	}

	oz := &OzonClient{
		ClientID: clientID,
		APIKey:   apiKey,
		HTTP: &http.Client{
			Timeout: 60 * time.Second,
		},
	}

	// 1) create report
	code, err := oz.CreateProductsReport(ctx)
	if err != nil {
		panic(err)
	}
	fmt.Println("report code:", code)

	// 2) get file url (иногда отчёт готовится — можно добавить ретраи, но часто сразу есть)
	fileURL, err := oz.GetReportFileURL(ctx, code)
	if err != nil {
		panic(err)
	}
	fmt.Println("report file:", fileURL)

	// 3) download CSV
	body, err := downloadCSV(ctx, oz.HTTP, fileURL)
	if err != nil {
		panic(err)
	}
	defer body.Close()
	r := csv.NewReader(body)
	r.Comma = ';'
	r.LazyQuotes = true

	// header
	header, err := r.Read()
	if err != nil {
		panic(err)
	}

	normHeader := func(s string) string {
		s = strings.TrimSpace(s)
		s = strings.TrimPrefix(s, "\ufeff") // BOM
		s = strings.TrimSpace(s)
		s = strings.Trim(s, `"`) // убрать "...."
		s = strings.TrimSpace(s)
		return s
	}

	idx := make(map[string]int, len(header))
	for i, h := range header {
		idx[normHeader(h)] = i
	}

	get := func(row []string, name string) string {
		name = normHeader(name)
		i, ok := idx[name]
		if !ok || i < 0 || i >= len(row) {
			return ""
		}
		return row[i]
	}

	exportDate := time.Now().UTC().Truncate(24 * time.Hour)

	var rows []ProductRow
	for {
		rec, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			// если встретилась кривая строка — лучше логировать и пропускать
			fmt.Println("csv read error:", err)
			continue
		}

		articlePtr := cleanStr(get(rec, "Артикул"))
		if articlePtr == nil {
			continue
		}
		article := *articlePtr

		row := ProductRow{
			ExportDate: exportDate,
			Article:    article,

			OzonProdID: toInt64(get(rec, "Ozon Product ID")),
			SKU:        toInt64(get(rec, "SKU")),
			Barcode:    cleanStr(get(rec, "Barcode")),

			ProductName:  cleanStr(get(rec, "Название товара")),
			Category:     cleanStr(get(rec, "Категория")),
			ProductType:  cleanStr(get(rec, "Тип")),
			QtyInPack:    toInt(get(rec, "Количество товара в кванте")),
			VolumeLiters: toFloat(get(rec, "Объем товара, л")),

			ProductStatus:  cleanStr(get(rec, "Статус товара")),
			Labels:         cleanStr(get(rec, "Метки")),
			OzonVisibility: cleanStr(get(rec, "Видимость на Ozon")),
			HiddenReason:   cleanStr(get(rec, "Причины скрытия")),

			ReviewsCount: toInt(get(rec, "Отзывы")),
			Rating:       toFloat(get(rec, "Рейтинг")),

			FboSalesVolume:      toInt(get(rec, "Доступно к продаже по схеме FBO, шт.")),
			AvailableRealFBS:    toInt(get(rec, "Доступно к продаже по схеме realFBS, шт.")),
			ReservedMyWarehouse: toInt(get(rec, "Зарезервировано на моих складах, шт")),
			AvailableFBS:        toInt(get(rec, "Доступно к продаже по схеме FBS, шт.")),

			CurrentPrice:        toFloat(get(rec, "Текущая цена с учетом скидки, ₽")),
			PriceBeforeDiscount: toFloat(get(rec, "Цена до скидки (перечеркнутая цена), ₽")),
			VatPercent:          toVATPercent(get(rec, "Размер НДС, %")),
			// в твоём примере этой колонки может не быть — оставим nil, либо добавь правильное имя:
			// OzonOfferPrice: toFloat(get(rec, "Цена Ozon/Предложения, ₽")),

			CreatedAt: toTime(get(rec, "Дата создания")),
		}

		rows = append(rows, row)
	}
	//for _, row := range rows {
	//	b, _ := json.MarshalIndent(row, "", "  ")
	//	fmt.Println(string(b))
	//}

	fmt.Println("parsed rows:", len(rows))
	if len(rows) == 0 {
		fmt.Println("no data to insert")
		return
	}

	//4) insert/upsert into postgres
	if err := upsertProducts(ctx, pgDsn, rows); err != nil {
		panic(err)
	}

	fmt.Println("done")
}

func upsertProducts(ctx context.Context, dsn string, rows []ProductRow) error {
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

	// temp table mirrors target columns we insert
	_, err = tx.Exec(ctx, `
CREATE TEMP TABLE tmp_products (
	export_date DATE NOT NULL,
	article VARCHAR(100) NOT NULL,
	ozon_product_id BIGINT,
	sku BIGINT,
	barcode VARCHAR(50),
	product_name TEXT,
	category VARCHAR(255),
	product_type VARCHAR(100),
	quantity_in_pack INTEGER,
	volume_liters DOUBLE PRECISION,
	product_status VARCHAR(50),
	labels TEXT,
	ozon_visibility VARCHAR(50),
	hidden_reason TEXT,
	reviews_count INTEGER,
	rating DOUBLE PRECISION,
	fbo_sales_volume INTEGER,
	available_realfbs INTEGER,
	reserved_my_warehouse INTEGER,
	available_fbs INTEGER,
	current_price DOUBLE PRECISION,
	price_before_discount DOUBLE PRECISION,
	vat_percent DOUBLE PRECISION,
	ozon_offer_price DOUBLE PRECISION,
	created_at TIMESTAMP
) ON COMMIT DROP;
`)
	if err != nil {
		return err
	}

	copyRows := make([][]any, 0, len(rows))
	for _, r := range rows {
		copyRows = append(copyRows, []any{
			r.ExportDate,
			r.Article,
			r.OzonProdID,
			r.SKU,
			r.Barcode,
			r.ProductName,
			r.Category,
			r.ProductType,
			r.QtyInPack,
			r.VolumeLiters,
			r.ProductStatus,
			r.Labels,
			r.OzonVisibility,
			r.HiddenReason,
			r.ReviewsCount,
			r.Rating,
			r.FboSalesVolume,
			r.AvailableRealFBS,
			r.ReservedMyWarehouse,
			r.AvailableFBS,
			r.CurrentPrice,
			r.PriceBeforeDiscount,
			r.VatPercent,
			r.OzonOfferPrice,
			r.CreatedAt,
		})
	}

	_, err = tx.CopyFrom(
		ctx,
		pgx.Identifier{"tmp_products"},
		[]string{
			"export_date", "article", "ozon_product_id", "sku", "barcode",
			"product_name", "category", "product_type", "quantity_in_pack", "volume_liters",
			"product_status", "labels", "ozon_visibility", "hidden_reason",
			"reviews_count", "rating",
			"fbo_sales_volume", "available_realfbs", "reserved_my_warehouse", "available_fbs",
			"current_price", "price_before_discount", "vat_percent", "ozon_offer_price",
			"created_at",
		},
		pgx.CopyFromRows(copyRows),
	)
	if err != nil {
		return err
	}

	// upsert into target
	_, err = tx.Exec(ctx, `
INSERT INTO products (
	export_date,
	article, ozon_product_id, sku, barcode,
	product_name, category, product_type, quantity_in_pack, volume_liters,
	product_status, labels, ozon_visibility, hidden_reason,
	reviews_count, rating,
	fbo_sales_volume, available_realfbs, reserved_my_warehouse, available_fbs,
	current_price, price_before_discount, vat_percent, ozon_offer_price,
	created_at
)
SELECT
	export_date,
	article, ozon_product_id, sku, barcode,
	product_name, category, product_type, quantity_in_pack, volume_liters,
	product_status, labels, ozon_visibility, hidden_reason,
	reviews_count, rating,
	fbo_sales_volume, available_realfbs, reserved_my_warehouse, available_fbs,
	current_price, price_before_discount, vat_percent, ozon_offer_price,
	created_at
FROM tmp_products
ON CONFLICT (export_date, article) DO UPDATE SET
	ozon_product_id = EXCLUDED.ozon_product_id,
	sku = EXCLUDED.sku,
	barcode = EXCLUDED.barcode,
	product_name = EXCLUDED.product_name,
	category = EXCLUDED.category,
	product_type = EXCLUDED.product_type,
	quantity_in_pack = EXCLUDED.quantity_in_pack,
	volume_liters = EXCLUDED.volume_liters,
	product_status = EXCLUDED.product_status,
	labels = EXCLUDED.labels,
	ozon_visibility = EXCLUDED.ozon_visibility,
	hidden_reason = EXCLUDED.hidden_reason,
	reviews_count = EXCLUDED.reviews_count,
	rating = EXCLUDED.rating,
	fbo_sales_volume = EXCLUDED.fbo_sales_volume,
	available_realfbs = EXCLUDED.available_realfbs,
	reserved_my_warehouse = EXCLUDED.reserved_my_warehouse,
	available_fbs = EXCLUDED.available_fbs,
	current_price = EXCLUDED.current_price,
	price_before_discount = EXCLUDED.price_before_discount,
	vat_percent = EXCLUDED.vat_percent,
	ozon_offer_price = EXCLUDED.ozon_offer_price,
	created_at = EXCLUDED.created_at;
`)
	if err != nil {
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return err
	}
	return nil
}
