package main

import "net/http"

type WBSalesRow struct {
	DiscountPercent int    `json:"discountPercent"`
	FinishedPrice   int    `json:"finishedPrice"`
	IncomeID        uint64 `json:"incomeID"`
	NmId            uint64 `json:"nmId"`
	PriceWithDisc   int    `json:"priceWithDisc"`
	TotalPrice      int    `json:"totalPrice"`
	Spp             int    `json:"spp"`
	IsCancel        bool   `json:"isCancel"`
	IsRealization   bool   `json:"isRealization"`
	IsSupply        bool   `json:"isSupply"`
	Barcode         string `json:"barcode"`
	Brand           string `json:"brand"`
	CancelDate      string `json:"cancelDate"`
	Category        string `json:"category"`
	CountryName     string `json:"countryName"`
	Date            string `json:"date"`
	GNumber         string `json:"gNumber"`
	LastChangeDate  string `json:"lastChangeDate"`
	OblastOkrugName string `json:"oblastOkrugName"`
	OrderType       string `json:"orderType"`
	RegionName      string `json:"regionName"`
	Srid            string `json:"srid"`
	Sticker         string `json:"sticker"`
	Subject         string `json:"subject"`
	SupplierArticle string `json:"supplierArticle"`
	TechSize        string `json:"techSize"`
	WarehouseName   string `json:"warehouseName"`
}

type SalesResponseRow struct {
	CreatedAt     string `json:"created_at"`
	Sku           uint64 `json:"foreignId"`
	Qty           int    `json:"qty"`
	WarehouseName string `json:"warehouse"`
}

func getSales(w http.ResponseWriter, req *http.Request) {
	var rows []SalesResponseRow

	var result = GetRequest[[]WBSalesRow]("statistics-api", "/api/v1/supplier/orders?dateFrom="+req.FormValue("dateFrom"), *req)

	if result.IsOk {
		for _, item := range result.Data {
			rows = append(rows, SalesResponseRow{
				CreatedAt:     item.Date,
				Sku:           item.NmId,
				Qty:           1,
				WarehouseName: item.WarehouseName,
			})
		}
	}

	response(w, rows)
}
