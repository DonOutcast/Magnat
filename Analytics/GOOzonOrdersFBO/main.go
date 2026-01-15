package main

import (
	"context"
	"database/sql"
	"encoding/csv"
	"encoding/json"
	"errors"
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

type reportInfoResp struct {
	Result struct {
		Status string `json:"status"`
		File   string `json:"file"`
		Error  string `json:"error"`
	} `json:"result"`
}

func (c *OzonClient) postJSON(ctx context.Context, url string, payload any, out any) error {
	var body io.Reader
	if payload != nil {
		b, err := json.Marshal(payload)
		if err != nil {
			return err
		}
		body = strings.NewReader(string(b))
	} else {
		body = strings.NewReader("{}")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, body)
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

	if resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("ozon http %d: %s", resp.StatusCode, string(b))
	}
	return json.NewDecoder(resp.Body).Decode(out)
}

func (c *OzonClient) CreateFBOPostingsReport(ctx context.Context, from, to time.Time) (string, error) {
	endpoint := "https://api-seller.ozon.ru/v1/report/postings/create"

	payload := map[string]any{
		"filter": map[string]any{
			"processed_at_from": "2025-12-01T17:10:54.861Z", //from.UTC().Format(time.RFC3339Nano),
			"processed_at_to":   "2025-12-31T17:10:54.861Z", //to.UTC().Format(time.RFC3339Nano),
			"delivery_schema":   []string{"fbo"},
		},
	}

	var resp createReportResp
	if err := c.postJSON(ctx, endpoint, payload, &resp); err != nil {
		return "", err
	}
	if resp.Result.Code == "" {
		return "", errors.New("empty report code")
	}
	return resp.Result.Code, nil
}

func (c *OzonClient) GetReportFileURLWithRetry(ctx context.Context, code string, attempts int, sleep time.Duration) (string, error) {
	endpoint := "https://api-seller.ozon.ru/v1/report/info"

	for i := 1; i <= attempts; i++ {
		payload := map[string]any{"code": code}
		var resp reportInfoResp

		if err := c.postJSON(ctx, endpoint, payload, &resp); err != nil {
			return "", err
		}

		// обычно статус: "success" когда готов
		if strings.ToLower(resp.Result.Status) == "success" && resp.Result.File != "" {
			return resp.Result.File, nil
		}

		// если ошибка от Ozon — тоже покажем
		if resp.Result.Error != "" {
			fmt.Println("report not ready yet:", resp.Result.Status, "error:", resp.Result.Error)
		} else {
			fmt.Println("report not ready yet:", resp.Result.Status)
		}

		select {
		case <-time.After(sleep):
		case <-ctx.Done():
			return "", ctx.Err()
		}
	}
	return "", fmt.Errorf("report not ready after %d attempts", attempts)
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
	if resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		return nil, fmt.Errorf("download http %d: %s", resp.StatusCode, string(b))
	}
	return resp.Body, nil
}

// ---------- parsing helpers ----------

func normHeader(s string) string {
	s = strings.TrimSpace(s)
	s = strings.TrimPrefix(s, "\ufeff") // BOM
	s = strings.TrimSpace(s)
	s = strings.Trim(s, `"`)
	s = strings.TrimSpace(s)
	return s
}

func getField(idx map[string]int, row []string, name string) string {
	name = normHeader(name)
	i, ok := idx[name]
	if !ok || i < 0 || i >= len(row) {
		return ""
	}
	return strings.TrimSpace(row[i])
}

func cleanStrPtr(s string) *string {
	s = strings.TrimSpace(s)
	if s == "" || strings.EqualFold(s, "nan") {
		return nil
	}
	// иногда значения приходят с кавычкой в начале типа '4.90
	s = strings.TrimPrefix(s, "'")
	s = strings.Trim(s, `"`)
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	return &s
}

func toIntPtr(s string) *int {
	s = strings.TrimSpace(s)
	s = strings.TrimPrefix(s, "'")
	if s == "" || strings.EqualFold(s, "nan") {
		return nil
	}
	i, err := strconv.Atoi(s)
	if err != nil {
		return nil
	}
	return &i
}

func toInt64Ptr(s string) *int64 {
	s = strings.TrimSpace(s)
	s = strings.TrimPrefix(s, "'")
	if s == "" || strings.EqualFold(s, "nan") {
		return nil
	}
	i, err := strconv.ParseInt(s, 10, 64)
	if err != nil {
		return nil
	}
	return &i
}

func toFloatPtr(s string) *float64 {
	s = strings.TrimSpace(s)
	s = strings.TrimPrefix(s, "'")
	s = strings.ReplaceAll(s, ",", ".")
	if s == "" || strings.EqualFold(s, "nan") {
		return nil
	}
	f, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return nil
	}
	return &f
}

func toTimePtr(s string) *time.Time {
	s = strings.TrimSpace(s)
	if s == "" || strings.EqualFold(s, "nan") {
		return nil
	}
	// часто "YYYY-MM-DD HH:MM:SS"
	layouts := []string{
		"2006-01-02 15:04:05",
		time.RFC3339Nano,
		time.RFC3339,
	}
	for _, l := range layouts {
		if t, err := time.Parse(l, s); err == nil {
			tt := t.UTC()
			return &tt
		}
	}
	return nil
}

func toDatePtr(s string) *time.Time {
	// DATE (без времени)
	s = strings.TrimSpace(s)
	if s == "" || strings.EqualFold(s, "nan") {
		return nil
	}
	layouts := []string{"2006-01-02"}
	for _, l := range layouts {
		if t, err := time.Parse(l, s); err == nil {
			tt := t.UTC()
			return &tt
		}
	}
	return nil
}

// ---------- model ----------

type OrderFBO struct {
	OrderNumber        string
	ShipmentNumber     *string
	AcceptedAt         *time.Time
	ShipmentDate       *time.Time
	DeliveryDate       *time.Time
	ActualDispatchDate *time.Time
	Status             *string
	Amount             *float64
	CurrencyCode       *string
	ProductName        *string
	SKU                *int64
	Article            *string
	SellerPrice        *float64
	SellerCurrency     *string
	PaidByCustomer     *float64
	CustomerCurrency   *string
	Quantity           *int
	DeliveryCost       *float64
	RelatedShipments   *string
	BuyoutPercent      *float64
	PriceBeforePercent *float64
	DiscountRub        *float64
	DiscountPercent    *float64
	VolumetricWeight   *float64
	Promotions         *string
}

// ---------- db upsert ----------

func upsertOrders(ctx context.Context, db *sql.DB, orders []OrderFBO) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	stmt := `
INSERT INTO public.orders_fbo (
	order_number, shipment_number,
	accepted_at, shipment_date, delivery_date, actual_dispatch_date,
	status,
	amount, currency_code,
	product_name, sku, article,
	seller_price, seller_currency,
	paid_by_customer, customer_currency,
	quantity, delivery_cost, related_shipments,
	buyout_percent, price_before_percent, discount_rub, discount_percent,
	volumetric_weight, promotions
) VALUES (
	$1,$2,
	$3,$4,$5,$6,
	$7,
	$8,$9,
	$10,$11,$12,
	$13,$14,
	$15,$16,
	$17,$18,$19,
	$20,$21,$22,$23,
	$24,$25
)
ON CONFLICT (order_number) DO UPDATE SET
	shipment_number = EXCLUDED.shipment_number,
	accepted_at = EXCLUDED.accepted_at,
	shipment_date = EXCLUDED.shipment_date,
	delivery_date = EXCLUDED.delivery_date,
	actual_dispatch_date = EXCLUDED.actual_dispatch_date,
	status = EXCLUDED.status,
	amount = EXCLUDED.amount,
	currency_code = EXCLUDED.currency_code,
	product_name = EXCLUDED.product_name,
	sku = EXCLUDED.sku,
	article = EXCLUDED.article,
	seller_price = EXCLUDED.seller_price,
	seller_currency = EXCLUDED.seller_currency,
	paid_by_customer = EXCLUDED.paid_by_customer,
	customer_currency = EXCLUDED.customer_currency,
	quantity = EXCLUDED.quantity,
	delivery_cost = EXCLUDED.delivery_cost,
	related_shipments = EXCLUDED.related_shipments,
	buyout_percent = EXCLUDED.buyout_percent,
	price_before_percent = EXCLUDED.price_before_percent,
	discount_rub = EXCLUDED.discount_rub,
	discount_percent = EXCLUDED.discount_percent,
	volumetric_weight = EXCLUDED.volumetric_weight,
	promotions = EXCLUDED.promotions
`

	prep, err := tx.PrepareContext(ctx, stmt)
	if err != nil {
		return err
	}
	defer prep.Close()

	for _, o := range orders {
		_, err := prep.ExecContext(ctx,
			o.OrderNumber, o.ShipmentNumber,
			o.AcceptedAt, o.ShipmentDate, o.DeliveryDate, o.ActualDispatchDate,
			o.Status,
			o.Amount, o.CurrencyCode,
			o.ProductName, o.SKU, o.Article,
			o.SellerPrice, o.SellerCurrency,
			o.PaidByCustomer, o.CustomerCurrency,
			o.Quantity, o.DeliveryCost, o.RelatedShipments,
			o.BuyoutPercent, o.PriceBeforePercent, o.DiscountRub, o.DiscountPercent,
			o.VolumetricWeight, o.Promotions,
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

// ---------- main ----------

func main() {
	ctx := context.Background()
	_ = godotenv.Load("../.env")

	clientID := os.Getenv("OZON_CLIENT_ID")
	apiKey := os.Getenv("OZON_API_KEY")
	pgDsn := os.Getenv("PG_DSN")

	if clientID == "" || apiKey == "" || pgDsn == "" {
		fmt.Println("Need env vars: OZON_CLIENT_ID, OZON_API_KEY, PG_DSN")
		os.Exit(1)
	}

	// даты — можно управлять env’ами
	// пример: PROCESSED_FROM=2025-12-01T17:10:54.861Z
	//         PROCESSED_TO=2025-12-02T17:10:54.861Z
	fromStr := os.Getenv("PROCESSED_FROM")
	toStr := os.Getenv("PROCESSED_TO")
	if fromStr == "" || toStr == "" {
		fmt.Println("Need env vars: PROCESSED_FROM, PROCESSED_TO (RFC3339)")
		os.Exit(1)
	}
	from, err := time.Parse(time.RFC3339Nano, fromStr)
	if err != nil {
		panic(err)
	}
	to, err := time.Parse(time.RFC3339Nano, toStr)
	if err != nil {
		panic(err)
	}

	oz := &OzonClient{
		ClientID: clientID,
		APIKey:   apiKey,
		HTTP: &http.Client{
			Timeout: 120 * time.Second,
		},
	}

	// 1) create report
	code, err := oz.CreateFBOPostingsReport(ctx, from, to)
	if err != nil {
		panic(err)
	}
	fmt.Println("report code:", code)

	// 2) wait report ready and get CSV url
	fileURL, err := oz.GetReportFileURLWithRetry(ctx, code, 12, 10*time.Second)
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
	idx := make(map[string]int, len(header))
	for i, h := range header {
		idx[normHeader(h)] = i
	}

	// DEBUG: покажем заголовки
	fmt.Println("headers:")
	for i, h := range header {
		fmt.Printf("  %d: %q\n", i, normHeader(h))
	}

	var orders []OrderFBO

	for {
		rec, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			fmt.Println("csv read error:", err)
			continue
		}

		// ⚠️ Тут маппинг колонок. Если у тебя в CSV другие имена — поменяешь только эти строки.
		// Я поставил типовые названия, но Ozon может отдавать по-другому.
		orderNumber := cleanStrPtr(getField(idx, rec, "Номер заказа"))
		if orderNumber == nil {
			// иногда может называться "order_number" — попробуем фоллбек
			orderNumber = cleanStrPtr(getField(idx, rec, "order_number"))
		}
		if orderNumber == nil {
			continue
		}

		o := OrderFBO{
			OrderNumber: *orderNumber,

			ShipmentNumber:     cleanStrPtr(getField(idx, rec, "Номер отправления")),
			AcceptedAt:         toTimePtr(getField(idx, rec, "Принят в обработку")),
			ShipmentDate:       toDatePtr(getField(idx, rec, "Дата отгрузки")),
			DeliveryDate:       toDatePtr(getField(idx, rec, "Дата доставки")),
			ActualDispatchDate: toTimePtr(getField(idx, rec, "Фактическая дата передачи в доставку")),
			Status:             cleanStrPtr(getField(idx, rec, "Статус")),

			Amount:       toFloatPtr(getField(idx, rec, "Сумма")),
			CurrencyCode: cleanStrPtr(getField(idx, rec, "Код валюты отправления")),

			ProductName: cleanStrPtr(getField(idx, rec, "Название товара")),
			SKU:         toInt64Ptr(getField(idx, rec, "SKU")),
			Article:     cleanStrPtr(getField(idx, rec, "Артикул")),

			SellerPrice:    toFloatPtr(getField(idx, rec, "Ваша цена")),
			SellerCurrency: cleanStrPtr(getField(idx, rec, "Код валюты (ваша цена)")),

			PaidByCustomer:   toFloatPtr(getField(idx, rec, "Оплачено покупателем")),
			CustomerCurrency: cleanStrPtr(getField(idx, rec, "Код валюты покупателем")),

			Quantity:     toIntPtr(getField(idx, rec, "Количество")),
			DeliveryCost: toFloatPtr(getField(idx, rec, "Стоимость доставки")),

			RelatedShipments:   cleanStrPtr(getField(idx, rec, "Связанные отправления")),
			BuyoutPercent:      toFloatPtr(getField(idx, rec, "Выкуп товара до %")),
			PriceBeforePercent: toFloatPtr(getField(idx, rec, "Цена товара до %")),
			DiscountRub:        toFloatPtr(getField(idx, rec, "Скидка руб")),
			DiscountPercent:    toFloatPtr(getField(idx, rec, "Скидка %")),

			VolumetricWeight: toFloatPtr(getField(idx, rec, "Объёмный вес товаров")),
			Promotions:       cleanStrPtr(getField(idx, rec, "Акции")),
		}

		orders = append(orders, o)
	}

	fmt.Println("parsed rows:", len(orders))
	if len(orders) == 0 {
		fmt.Println("no data to insert")
		return
	}
	//for _, row := range orders {
	//	b, _ := json.MarshalIndent(row, "", "  ")
	//	fmt.Println(string(b))
	//}

	// 4) connect db
	db, err := sql.Open("pgx", pgDsn)
	if err != nil {
		panic(err)
	}
	defer db.Close()

	if err := db.PingContext(ctx); err != nil {
		panic(err)
	}

	//// 5) upsert
	if err := upsertOrders(ctx, db, orders); err != nil {
		panic(err)
	}

	fmt.Println("done")
}
