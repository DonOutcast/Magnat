package main

import (
	"encoding/json"
	"net/http"
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
	json.NewDecoder(req.Body).Decode(&r)

	const limit = 1000

	var items []ApiProductAttributes

	for _, ids := range chunkBy(r.Ids, limit) {
		var sendParams ReqProductsAttributes
		sendParams.Filter.Visibility = "all"
		sendParams.Filter.Ids = ids
		sendParams.LastId = ""
		sendParams.Limit = limit

		var result = PostRequest[any, ApiProductListAttributes](sendParams, "/v3/products/info/attributes", *req)

		if result.IsOk {
			if len(result.Data.Result) == 0 {
				break
			}
			items = append(items, result.Data.Result...)
			sendParams.LastId = result.Data.LastId
			if len(result.Data.Result) < limit {
				break
			}
			if sendParams.LastId == "" {
				break
			}
		} else {
			break
		}
	}

	response(w, items)
}
