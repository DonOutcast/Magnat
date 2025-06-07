package main

import (
	"net/http"
)

type ReqCursor struct {
	Limit     int    `json:"limit"`
	NmID      uint64 `json:"nmID,omitempty"`
	UpdatedAt string `json:"updatedAt,omitempty"`
}

type ReqFilter struct {
	WithPhoto int `json:"withPhoto"`
}

type ReqSettings struct {
	Cursor ReqCursor `json:"cursor"`
	Filter ReqFilter `json:"filter"`
}

type GetProductListParams struct {
	Settings ReqSettings `json:"settings"`
}

type ProductResponseRow struct {
	Id      uint64  `json:"foreignId"`
	Sku     uint64  `json:"sku"`
	Volume  float32 `json:"volume"`
	OfferId string  `json:"offer_id"`
	Name    string  `json:"name"`
}

func getWBVolume(dimensions WBProductRowDimensions) float32 {
	var cubic float32 = (dimensions.Height * dimensions.Length * dimensions.Width) / 1000
	return cubic
}

func getProductList(w http.ResponseWriter, req *http.Request) {
	var rows []ProductResponseRow

	var sendParams GetProductListParams = GetProductListParams{}
	sendParams.Settings.Cursor.Limit = 100
	sendParams.Settings.Filter.WithPhoto = -1

	i := 0
	for i < 10 {
		var result = PostRequest[GetProductListParams, WBProductResponse]("content-api", sendParams, "/content/v2/get/cards/list", *req)

		if result.IsOk {
			if result.Data.Cursor.Total == 0 {
				break
			}
			for _, item := range result.Data.Cards {
				rows = append(rows, ProductResponseRow{
					Id:      item.NmId,
					Sku:     item.NmId,
					Volume:  getWBVolume(item.Dimensions),
					OfferId: item.VendorCode,
					Name:    item.Title,
				})
			}
			sendParams.Settings.Cursor.NmID = result.Data.Cursor.NmID
			sendParams.Settings.Cursor.UpdatedAt = result.Data.Cursor.UpdatedAt

			if result.Data.Cursor.Total < sendParams.Settings.Cursor.Limit {
				break
			}
			i++
		} else {
			break
		}
	}

	response(w, rows)
}

type WBProductRowDimensions struct {
	Height float32 `json:"height"`
	Length float32 `json:"length"`
	Width  float32 `json:"width"`
}

type WBProductRow struct {
	Dimensions WBProductRowDimensions `json:"dimensions"`
	NmId       uint64                 `json:"nmId"`
	Title      string                 `json:"title"`
	VendorCode string                 `json:"vendorCode"`
}

type WBProductResponseCursor struct {
	NmID      uint64 `json:"nmID"`
	UpdatedAt string `json:"updatedAt"`
	Total     int    `json:"total"`
}

type WBProductResponse struct {
	Cards  []WBProductRow          `json:"cards"`
	Cursor WBProductResponseCursor `json:"cursor"`
}
