package main

import (
	"encoding/json"
	"net/http"
	"log"
)

type ReqOrderFilter struct {
	Since  string `json:"since"`
	To     string `json:"to"`
	Status string `json:"status"`
}

type ReqOrderWith struct {
	AnalyticsData bool `json:"analytics_data"`
	FinancialData bool `json:"financial_data"`
}

type ApiReqOrder struct {
	Dir    string         `json:"dir"`
	Filter ReqOrderFilter `json:"filter"`
	Limit  int            `json:"limit"`
	Offset int            `json:"offset"`
	With   ReqOrderWith   `json:"with"`
}

type ResOrderProduct struct {
	Sku uint64 `json:"sku"`
	Qty int    `json:"quantity"`
}

type ResAnalyticsData struct {
	WarehouseName string `json:"warehouse_name"`
	WarehouseId   uint64 `json:"warehouse_id"`
}

type ResOrderList struct {
	CreatedAt string            `json:"created_at"`
	Status    string            `json:"status"`
	Products  []ResOrderProduct `json:"products"`
	Warehouse ResAnalyticsData  `json:"analytics_data"`
}

type ResponseOrderList struct {
	CreatedAt     string `json:"created_at"`
	Sku           uint64 `json:"sku"`
	Qty           int    `json:"qty"`
	WarehouseName string `json:"warehouse"`
}

type ReqOrder struct {
	Since string `json:"since"`
	To    string `json:"to"`
}

type ResponseOrderDeliveryList struct {
	Sku           uint64 `json:"sku"`
	Qty           int    `json:"qty"`
	WarehouseName string `json:"warehouse"`
}

func getSales(w http.ResponseWriter, req *http.Request) {
	var r ReqOrder
	if err := json.NewDecoder(req.Body).Decode(&r); err != nil {
		log.Printf("Ошибка при декодировании тела запроса: %v", err)
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}
	log.Printf("Запрос на getSales: от %s до %s", r.Since, r.To)

	var orders []ResponseOrderList
	sendParams := ApiReqOrder{
		Dir: "asc",
		Filter: ReqOrderFilter{
			Since:  r.Since,
			To:     r.To,
			Status: "",
		},
		Limit:  1000,
		Offset: 0,
		With: ReqOrderWith{
			AnalyticsData: true,
			FinancialData: false,
		},
	}

	for i := 0; i < 100; i++ {
		log.Printf("Итерация %d, Offset: %d", i, sendParams.Offset)
		result := PostRequest[any, ApiGenericResult[[]ResOrderList]](sendParams, "/v2/posting/fbo/list", *req)

		if !result.IsOk {
			log.Printf("Ошибка в запросе: %+v", result)
			break
		}

		if len(result.Data.Result) == 0 {
			log.Println("Результаты закончились, выход из цикла")
			break
		}

		for _, order := range result.Data.Result {
			if order.Status != "cancelled" {
				for _, product := range order.Products {
					orders = append(orders, ResponseOrderList{
						CreatedAt:     order.CreatedAt,
						Sku:           product.Sku,
						Qty:           product.Qty,
						WarehouseName: order.Warehouse.WarehouseName,
					})
				}
			}
		}
		sendParams.Offset += sendParams.Limit
	}

	log.Printf("Получено %d заказов", len(orders))
	response(w, orders)
}



func getDelivering(w http.ResponseWriter, req *http.Request) {
	var r ReqOrder
	if err := json.NewDecoder(req.Body).Decode(&r); err != nil {
		log.Printf("Ошибка при декодировании тела запроса: %v", err)
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}
	log.Printf("Запрос на getDelivering: от %s до %s", r.Since, r.To)

	var orders []ResponseOrderList
	sendParams := ApiReqOrder{
		Dir: "asc",
		Filter: ReqOrderFilter{
			Since:  r.Since,
			To:     r.To,
			Status: "",
		},
		Limit:  1000,
		Offset: 0,
		With: ReqOrderWith{
			AnalyticsData: true,
			FinancialData: false,
		},
	}

	for i := 0; i < 100; i++ {
		log.Printf("Итерация %d, Offset: %d", i, sendParams.Offset)
		result := PostRequest[any, ApiGenericResult[[]ResOrderList]](sendParams, "/v2/posting/fbo/list", *req)

		if !result.IsOk {
			log.Printf("Ошибка в запросе: %+v", result)
			break
		}

		if len(result.Data.Result) == 0 {
			log.Println("Результаты закончились, выход из цикла")
			break
		}

		for _, order := range result.Data.Result {
			if order.Status == "delivering" {
				for _, product := range order.Products {
					orders = append(orders, ResponseOrderList{
						Sku:           product.Sku,
						Qty:           product.Qty,
						WarehouseName: order.Warehouse.WarehouseName,
					})
				}
			}
		}
		sendParams.Offset += sendParams.Limit
	}

	log.Printf("Получено %d доставляемых заказов", len(orders))
	response(w, orders)
}
