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
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
)

const ozonStocksEndpoint = "https://api-seller.ozon.ru/v1/analytics/stocks"

type OzonClient struct {
	ClientID string
	APIKey   string
	HTTP     *http.Client
}

type StocksRequest struct {
	Skus []int64 `json:"skus"`
}

type StocksResponse struct {
	Items []StockItem `json:"items"`
}

type StockItem struct {
	SKU     int64  `json:"sku"`
	Name    string `json:"name"`
	OfferID string `json:"offer_id"`

	WarehouseID   int64  `json:"warehouse_id"`
	WarehouseName string `json:"warehouse_name"`

	ClusterID   int64  `json:"cluster_id"`
	ClusterName string `json:"cluster_name"`

	ItemTags []string `json:"item_tags"`

	Ads              *float64 `json:"ads"`
	DaysWithoutSales *int64   `json:"days_without_sales"`
	TurnoverGrade    string   `json:"turnover_grade"`
	IDC              *int64   `json:"idc"`

	AvailableStockCount     *int64 `json:"available_stock_count"`
	ValidStockCount         *int64 `json:"valid_stock_count"`
	WaitingDocsStockCount   *int64 `json:"waiting_docs_stock_count"`
	ExpiringStockCount      *int64 `json:"expiring_stock_count"`
	TransitDefectStockCount *int64 `json:"transit_defect_stock_count"`
	StockDefectStockCount   *int64 `json:"stock_defect_stock_count"`
	ExcessStockCount        *int64 `json:"excess_stock_count"`
	OtherStockCount         *int64 `json:"other_stock_count"`
	RequestedStockCount     *int64 `json:"requested_stock_count"`
	TransitStockCount       *int64 `json:"transit_stock_count"`
	ReturnFromCustomerCount *int64 `json:"return_from_customer_stock_count"`
	ReturnToSellerCount     *int64 `json:"return_to_seller_stock_count"`

	IDCCluster              *int64   `json:"idc_cluster"`
	AdsCluster              *float64 `json:"ads_cluster"`
	TurnoverGradeCluster    string   `json:"turnover_grade_cluster"`
	DaysWithoutSalesCluster *int64   `json:"days_without_sales_cluster"`
}

func nzFloat(p *float64) float64 {
	if p == nil {
		return 0
	}
	return *p
}

func tagsToStr(tags []string) sql.NullString {
	if len(tags) == 0 {
		return sql.NullString{Valid: false}
	}
	s := strings.Join(tags, ",")
	if len(s) > 100 { // item_tag varchar(100)
		s = s[:100]
	}
	return sql.NullString{String: s, Valid: true}
}

func str50FromInt64(v int64) sql.NullString {
	if v == 0 {
		return sql.NullString{Valid: false}
	}
	s := fmt.Sprintf("%d", v)
	if len(s) > 50 {
		s = s[:50]
	}
	return sql.NullString{String: s, Valid: true}
}

func str50FromInt64Ptr(v *int64) sql.NullString {
	if v == nil || *v == 0 {
		return sql.NullString{Valid: false}
	}
	s := fmt.Sprintf("%d", *v)
	if len(s) > 50 {
		s = s[:50]
	}
	return sql.NullString{String: s, Valid: true}
}

func str50FromFloat64Ptr(v *float64) sql.NullString {
	if v == nil {
		return sql.NullString{Valid: false}
	}
	s := fmt.Sprintf("%.6f", *v) // хватит точности, и не раздуваем строку
	if len(s) > 50 {
		s = s[:50]
	}
	return sql.NullString{String: s, Valid: true}
}

func mustEnv(k string) string {
	v := os.Getenv(k)
	if v == "" {
		fmt.Println("missing env:", k)
		os.Exit(1)
	}
	return v
}

func nz(p *int64) int64 {
	if p == nil {
		return 0
	}
	return *p
}

func (c *OzonClient) FetchStocks(ctx context.Context, skus []int64) ([]StockItem, error) {
	reqBody, _ := json.Marshal(StocksRequest{Skus: skus})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, ozonStocksEndpoint, bytes.NewReader(reqBody))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Client-Id", c.ClientID)
	req.Header.Set("Api-Key", c.APIKey)

	resp, err := c.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("ozon http %d: %s", resp.StatusCode, string(raw))
	}

	var out StocksResponse
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil, fmt.Errorf("json decode error: %w, raw=%s", err, string(raw))
	}

	return out.Items, nil
}

// берём sku из products за конкретную дату
func loadSKUsForDate(ctx context.Context, db *sql.DB, exportDate time.Time) ([]int64, error) {
	rows, err := db.QueryContext(ctx, `
		SELECT DISTINCT sku
		FROM public.products
		WHERE export_date = $1
		  AND sku IS NOT NULL
		ORDER BY sku
	`, exportDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var res []int64
	for rows.Next() {
		var sku int64
		if err := rows.Scan(&sku); err != nil {
			return nil, err
		}
		if sku != 0 {
			res = append(res, sku)
		}
	}
	return res, rows.Err()
}

func upsertStocks(ctx context.Context, db *sql.DB, exportDate time.Time, items []StockItem) error {
	if len(items) == 0 {
		return nil
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	stmt, err := tx.PrepareContext(ctx, `
		INSERT INTO public.stock (
			export_date,
			sku, name, offer_id,
			warehouse_id, warehouse_name,
			cluster_id, cluster_name,
			item_tag, adv_days_without_sales, turnover_grade,
			available_stock_count, valid_stock_count, waiting_docs_stock_count, expiring_stock_count,
			transit_stock_count, transit_defect_stock_count, stock_defect_stock_count, excess_stock_count,
			other_stock_count, requested_stock_count, return_from_customer_stock_count, return_to_seller_stock_count,
			id_cluster, adv_cluster, turnover_cluster, days_without_sales_cluster
		)
		VALUES (
			$1,
			$2, $3, $4,
			$5, $6,
			$7, $8,
			$9, $10, $11,
			$12, $13, $14, $15,
			$16, $17, $18, $19,
			$20, $21, $22, $23,
			$24, $25, $26, $27
		)
		ON CONFLICT (export_date, sku, warehouse_id) DO UPDATE SET
			name = EXCLUDED.name,
			offer_id = EXCLUDED.offer_id,
			warehouse_name = EXCLUDED.warehouse_name,
			cluster_id = EXCLUDED.cluster_id,
			cluster_name = EXCLUDED.cluster_name,
			item_tag = EXCLUDED.item_tag,
			adv_days_without_sales = EXCLUDED.adv_days_without_sales,
			turnover_grade = EXCLUDED.turnover_grade,

			available_stock_count = EXCLUDED.available_stock_count,
			valid_stock_count = EXCLUDED.valid_stock_count,
			waiting_docs_stock_count = EXCLUDED.waiting_docs_stock_count,
			expiring_stock_count = EXCLUDED.expiring_stock_count,
			transit_stock_count = EXCLUDED.transit_stock_count,
			transit_defect_stock_count = EXCLUDED.transit_defect_stock_count,
			stock_defect_stock_count = EXCLUDED.stock_defect_stock_count,
			excess_stock_count = EXCLUDED.excess_stock_count,
			other_stock_count = EXCLUDED.other_stock_count,
			requested_stock_count = EXCLUDED.requested_stock_count,
			return_from_customer_stock_count = EXCLUDED.return_from_customer_stock_count,
			return_to_seller_stock_count = EXCLUDED.return_to_seller_stock_count,

			id_cluster = EXCLUDED.id_cluster,
			adv_cluster = EXCLUDED.adv_cluster,
			turnover_cluster = EXCLUDED.turnover_cluster,
			days_without_sales_cluster = EXCLUDED.days_without_sales_cluster
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, it := range items {
		// warehouse_id может быть 0? обычно нет — но проверим
		if it.SKU == 0 || it.WarehouseID == 0 {
			continue
		}

		_, err := stmt.ExecContext(ctx,
			exportDate,
			it.SKU, nullStr(it.Name), nullStr(it.OfferID),
			it.WarehouseID, nullStr(it.WarehouseName),

			// В БД cluster_id varchar(50), поэтому сохраняем как строку
			str50FromInt64(it.ClusterID),
			nullStr(it.ClusterName),

			// item_tag varchar(100): кладём item_tags как CSV
			tagsToStr(it.ItemTags),

			// adv_days_without_sales integer: кладём days_without_sales
			nz(it.DaysWithoutSales),

			nullStr(it.TurnoverGrade),

			nz(it.AvailableStockCount), nz(it.ValidStockCount), nz(it.WaitingDocsStockCount), nz(it.ExpiringStockCount),
			nz(it.TransitStockCount), nz(it.TransitDefectStockCount), nz(it.StockDefectStockCount), nz(it.ExcessStockCount),
			nz(it.OtherStockCount), nz(it.RequestedStockCount), nz(it.ReturnFromCustomerCount), nz(it.ReturnToSellerCount),

			// последние 4 поля в БД varchar(50) — кладём туда кластерные метрики строкой
			str50FromInt64Ptr(it.IDCCluster),
			str50FromFloat64Ptr(it.AdsCluster),
			nullStr(it.TurnoverGradeCluster),
			str50FromInt64Ptr(it.DaysWithoutSalesCluster),
		)

		if err != nil {
			return fmt.Errorf("insert failed sku=%d wh=%d: %w", it.SKU, it.WarehouseID, err)
		}
	}

	return tx.Commit()
}

func nullStr(s string) sql.NullString {
	s = strings.TrimSpace(s)
	if s == "" {
		return sql.NullString{Valid: false}
	}
	return sql.NullString{
		String: s,
		Valid:  true,
	}
}

func batchInt64(a []int64, size int) [][]int64 {
	if size <= 0 {
		size = 100
	}
	var out [][]int64
	for i := 0; i < len(a); i += size {
		j := i + size
		if j > len(a) {
			j = len(a)
		}
		out = append(out, a[i:j])
	}
	return out
}

func main() {
	ctx := context.Background()
	_ = godotenv.Load("../.env")

	clientID := mustEnv("OZON_CLIENT_ID")
	apiKey := mustEnv("OZON_API_KEY")
	pgDsn := mustEnv("PG_DSN")

	db, err := sql.Open("pgx", pgDsn)
	if err != nil {
		panic(err)
	}
	defer db.Close()
	if err := db.PingContext(ctx); err != nil {
		panic(err)
	}

	// export_date = сегодня UTC (можешь заменить на "today in Moscow" при желании)
	exportDate := time.Now().UTC().Truncate(24 * time.Hour)

	skus, err := loadSKUsForDate(ctx, db, exportDate)
	if err != nil {
		panic(err)
	}
	fmt.Println("skus for export_date:", exportDate.Format("2006-01-02"), "count:", len(skus))
	if len(skus) == 0 {
		fmt.Println("no skus found in products for this date")
		return
	}

	oz := &OzonClient{
		ClientID: clientID,
		APIKey:   apiKey,
		HTTP: &http.Client{
			Timeout: 90 * time.Second,
		},
	}

	totalInserted := 0

	for bi, part := range batchInt64(skus, 100) {
		fmt.Printf("batch %d: %d skus\n", bi+1, len(part))

		items, err := oz.FetchStocks(ctx, part)
		if err != nil {
			panic(err)
		}
		fmt.Println("  received items:", len(items))
		//for _, row := range rows {
		//	b, _ := json.MarshalIndent(row, "", "  ")
		//	fmt.Println(string(b))
		//}

		if len(items) > 0 {
			// debug sample
			s := items[0]
			fmt.Printf("  sample: sku=%d wh=%d avail=%d valid=%d grade=%s\n",
				s.SKU, s.WarehouseID, nz(s.AvailableStockCount), nz(s.ValidStockCount), s.TurnoverGrade)
		}

		if err := upsertStocks(ctx, db, exportDate, items); err != nil {
			panic(err)
		}
		totalInserted += len(items)
	}

	fmt.Println("done, processed items:", totalInserted)
}
