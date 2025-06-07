package main

import (
    "log"
	"net/http"
)

type CompanyType struct {
	Id                       uint64   `json:"id"`
	PaymentType              string   `json:"paymentType"`
	Title                    string   `json:"title"`
	State                    string   `json:"state"`
	AdvObjectType            string   `json:"advObjectType"`
	FromDate                 string   `json:"fromDate"`
	ToDate                   string   `json:"toDate"`
	DailyBudget              uint64   `json:"dailyBudget"`
	Placement                []string `json:"placement"`
	Budget                   uint64   `json:"budget"`
	CreatedAt                string   `json:"createdAt"`
	UpdatedAt                string   `json:"updatedAt"`
	ProductAutopilotStrategy string   `json:"productAutopilotStrategy"`
	ProductCampaignMode      string   `json:"productCampaignMode"`
}

func getCompanies(w http.ResponseWriter, req *http.Request) {
	var ids []CompanyType

	var result = GetRequest[any, ApiGenericList[CompanyType]]("/api/client/campaign", *req)

	if result.IsOk {
		ids = result.Data.List
	}

	response(w, ids)
}

func getSearchPromoCompanies(w http.ResponseWriter, req *http.Request) {
	var ids []CompanyType

	var result = GetRequest[any, ApiGenericProducts[CompanyType]]("/api/client/campaign/search_promo/v2/products", *req)

	if result.IsOk {
		ids = result.Data.Products
	}

	response(w, ids)
}

func chunkBy[T any](items []T, chunkSize int) (chunks [][]T) {
	for chunkSize < len(items) {
		items, chunks = items[chunkSize:], append(chunks, items[0:chunkSize:chunkSize])
	}
	return append(chunks, items)
}

func main() {
	http.HandleFunc("/companies", getCompanies)
	http.HandleFunc("/companies/search_promo", getSearchPromoCompanies)
    log.Println("Сервер запущен на http://localhost:8092")
	err := http.ListenAndServe(":8092", nil)
	if err != nil {
		log.Fatalf("Ошибка при запуске сервера: %v", err)
	}
}
