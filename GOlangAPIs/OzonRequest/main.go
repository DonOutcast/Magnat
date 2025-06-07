package main

import (
    "log"
	"encoding/json"
	"net/http"
)

type ApiProductListSimple struct {
	Items  []ApiProductSimple `json:"items"`
	Total  int                `json:"total"`
	LastId string             `json:"last_id"`
}

type ApiProductSimple struct {
	ID uint64 `json:"product_id"`
}

type ProductListFilter struct {
	Visibility string `json:"visibility"`
}

type SetLastId struct {
	Filter ProductListFilter `json:"filter"`
	Limit  int               `json:"limit"`
	LastId string            `json:"last_id"`
}

func getProductList(w http.ResponseWriter, req *http.Request) {
	var ids []uint64

	var sendParams SetLastId = SetLastId{Limit: 1000, Filter: ProductListFilter{Visibility: "ALL"}}

	i := 0
	for i < 100 {
		var result = PostRequest[any, ApiGenericResult[ApiProductListSimple]](sendParams, "/v3/product/list", *req)

		if result.IsOk {
			if len(result.Data.Result.Items) == 0 {
				break
			}
			for _, item := range result.Data.Result.Items {
				ids = append(ids, item.ID)
			}
			sendParams.LastId = result.Data.Result.LastId

			if len(result.Data.Result.Items) < sendParams.Limit {
				break
			}
			i++
		} else {
			break
		}
	}

	response(w, ids)
}

func chunkBy[T any](items []T, chunkSize int) (chunks [][]T) {
	for chunkSize < len(items) {
		items, chunks = items[chunkSize:], append(chunks, items[0:chunkSize:chunkSize])
	}
	return append(chunks, items)
}

type ReqProductsInfoIds struct {
	Ids []uint64 `json:"product_id"`
}

type ApiProductInfoList struct {
	Items []any `json:"items"`
}

func getProductListInfo(w http.ResponseWriter, req *http.Request) {
	var r ReqProductsInfoIds
	json.NewDecoder(req.Body).Decode(&r)

	const limit = 1000

	var items []any

	for _, ids := range chunkBy(r.Ids, limit) {
		var sendParams ReqProductsInfoIds
		sendParams.Ids = ids
		var result = PostRequest[any, ApiProductInfoList](sendParams, "/v3/product/info/list", *req)

		if result.IsOk {
			if len(result.Data.Items) == 0 {
				break
			}
			items = append(items, result.Data.Items...)
			if len(result.Data.Items) < limit {
				break
			}
		} else {
			break
		}
	}

	response(w, items)
}

type StockRow struct {
	Sku           uint64 `json:"sku"`
	WarehouseName string `json:"warehouse_name"`
	Promised      int    `json:"promised_amount"`
	Free          int    `json:"free_to_sell_amount"`
	Reserved      int    `json:"reserved_amount"`
}

type ApiProductStock struct {
	Rows []StockRow `json:"rows"`
}

type ApiReqPagination struct {
	Limit  int `json:"limit"`
	Offset int `json:"offset"`
}

func getStockOnWarehouses(w http.ResponseWriter, req *http.Request) {
	var rows []StockRow

	var sendParams ApiReqPagination = ApiReqPagination{Limit: 1000, Offset: 0}

	i := 0
	for i < 100 {
		var result = PostRequest[any, ApiGenericResult[ApiProductStock]](sendParams, "/v2/analytics/stock_on_warehouses", *req)

		if result.IsOk {
			if len(result.Data.Result.Rows) == 0 {
				break
			}
			rows = append(rows, result.Data.Result.Rows...)

			sendParams.Offset += sendParams.Limit

			if len(result.Data.Result.Rows) < sendParams.Limit {
				break
			}

			i++
		} else {
			break
		}
	}

	response(w, rows)
}

type Warehouse struct {
	Name string `json:"name"`
}
type WarehouseRes struct {
	Warehouse Warehouse `json:"warehouse"`
}

func getWarehouses(w http.ResponseWriter, req *http.Request) {

	var warehouses []Warehouse

	var result = GetRequest[any, ApiGenericResult[[]WarehouseRes]]("/v1/supplier/available_warehouses", *req)

	if result.IsOk {
		for _, row := range result.Data.Result {
			warehouses = append(warehouses, row.Warehouse)
		}
	}

	response(w, warehouses)
}

func main() {
	http.HandleFunc("/products", getProductList)
	http.HandleFunc("/products/info", getProductListInfo)
	http.HandleFunc("/products/attributes", getProductListAttribute)
	http.HandleFunc("/products/stock", getStockOnWarehouses)
	http.HandleFunc("/products/sales", getSales)
	http.HandleFunc("/products/delivering", getDelivering)
	http.HandleFunc("/warehouses", getWarehouses)

    log.Println("Сервер запущен на http://localhost:8090")
	err := http.ListenAndServe(":8090", nil)
	if err != nil {
		log.Fatalf("Ошибка при запуске сервера: %v", err)
	}
}
