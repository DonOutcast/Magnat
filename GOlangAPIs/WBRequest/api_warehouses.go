package main

import "net/http"

type WBWarehousesSalesRow struct {
	Address      string  `json:"address"`
	CargoType    int     `json:"cargoType"`
	City         string  `json:"city"`
	DeliveryType int     `json:"deliveryType"`
	Id           uint64  `json:"id"`
	Latitude     float64 `json:"latitude"`
	Longitude    float64 `json:"longitude"`
	Name         string  `json:"name"`
	Selected     bool    `json:"selected"`
}

type WarehousesResponseRow struct {
	Id   uint64 `json:"id"`
	Name string `json:"name"`
}

func getWarehouses(w http.ResponseWriter, req *http.Request) {
	var rows []WarehousesResponseRow

	var result = GetRequest[[]WBWarehousesSalesRow]("marketplace-api", "/api/v3/offices", *req)

	if result.IsOk {
		for _, item := range result.Data {
			rows = append(rows, WarehousesResponseRow{
				Id:   item.Id,
				Name: item.Name,
			})
		}
	}

	response(w, rows)
}
