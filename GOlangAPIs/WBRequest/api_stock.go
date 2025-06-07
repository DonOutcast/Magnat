package main

import "net/http"

type WBStockRow struct {
	Discount        int    `json:"Discount"`
	Price           int    `json:"Price"`
	SCCode          string `json:"SCCode"`
	Barcode         string `json:"barcode"`
	Brand           string `json:"brand"`
	Category        string `json:"category"`
	InWayFromClient int    `json:"inWayFromClient"`
	InWayToClient   int    `json:"inWayToClient"`
	IsRealization   bool   `json:"isRealization"`
	IsSupply        bool   `json:"isSupply"`
	LastChangeDate  string `json:"lastChangeDate"`
	NmId            uint64 `json:"nmId"`
	Quantity        int    `json:"quantity"`
	QuantityFull    int    `json:"quantityFull"`
	Subject         string `json:"subject"`
	SupplierArticle string `json:"supplierArticle"`
	TechSize        string `json:"techSize"`
	WarehouseName   string `json:"warehouseName"`
}

type StockResponseRow struct {
	Id            uint64 `json:"foreignId"`
	WarehouseName string `json:"warehouse_name"`
	Promised      int    `json:"promised_amount"`
	Free          int    `json:"free_to_sell_amount"`
	Reserved      int    `json:"reserved_amount"`
}

func getStockOnWarehouses(w http.ResponseWriter, req *http.Request) {
	var rows []StockResponseRow

	var result = GetRequest[[]WBStockRow]("statistics-api", "/api/v1/supplier/stocks?dateFrom="+req.FormValue("dateFrom"), *req)

	if result.IsOk {
		for _, item := range result.Data {
			rows = append(rows, StockResponseRow{
				Id:            item.NmId,
				WarehouseName: item.WarehouseName,
				Promised:      0,
				Free:          item.Quantity,
				Reserved:      0,
			})
		}
	}

	response(w, rows)
}
