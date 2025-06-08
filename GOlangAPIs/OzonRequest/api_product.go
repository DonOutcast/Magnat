package main

import (
	"encoding/json"
	"net/http"
	"log"
)

type ApiProductAttributes struct {
	Id            uint64  `json:"id"`
	Height        float32 `json:"height"`
	Depth         float32 `json:"depth"`
	Width         float32 `json:"width"`
	DimensionUnit string  `json:"dimension_unit"`
}

type ApiProductListAttributes struct {
	Result []ApiProductAttributes `json:"result"`
	Total  int                    `json:"total"`
	LastId string                 `json:"last_id"`
}

type ReqProductsAttributes struct {
	Filter struct {
		Ids        []uint64 `json:"product_id"`
		Visibility string   `json:"visibility"`
	} `json:"filter"`
	Limit   int    `json:"limit"`
	LastId  string `json:"last_id"`
	SortDir string `json:"sort_dir"`
}

func getProductListAttribute(w http.ResponseWriter, req *http.Request) {
	var r ReqProductsInfoIds
	if err := json.NewDecoder(req.Body).Decode(&r); err != nil {
		log.Printf("Ошибка при декодировании тела запроса: %v", err)
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}
	log.Printf("Получен запрос на атрибуты товаров. Всего ID: %d", len(r.Ids))

	const limit = 1000
	var items []ApiProductAttributes

	for idx, ids := range chunkBy(r.Ids, limit) {
		log.Printf("Запрос %d: запрашиваем %d товаров", idx+1, len(ids))

		var sendParams ReqProductsAttributes
		sendParams.Filter.Visibility = "all"
		sendParams.Filter.Ids = ids
		sendParams.LastId = ""
		sendParams.Limit = limit

		var result = PostRequest[any, ApiProductListAttributes](sendParams, "/v3/products/info/attributes", *req)

		if result.IsOk {
			log.Printf("Запрос %d: получено %d товаров", idx+1, len(result.Data.Result))
			if len(result.Data.Result) == 0 {
				log.Println("Останов: получен пустой список товаров")
				break
			}
			items = append(items, result.Data.Result...)
			sendParams.LastId = result.Data.LastId

			if len(result.Data.Result) < limit {
				log.Println("Останов: получено меньше лимита — достигнут конец данных")
				break
			}
			if sendParams.LastId == "" {
				log.Println("Останов: отсутствует LastId — достигнут конец данных")
				break
			}
		} else {
			log.Printf("Ошибка запроса %d: %+v", idx+1, result)
			break
		}
	}

	log.Printf("Итого получено %d атрибутов товаров", len(items))
	response(w, items)
}