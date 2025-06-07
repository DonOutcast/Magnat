package main

import (
    "log"
	"net/http"
)

func main() {
	http.HandleFunc("/ping", ping)
	http.HandleFunc("/products", getProductList)
	http.HandleFunc("/products/stock", getStockOnWarehouses)
	http.HandleFunc("/products/sales", getSales)
	http.HandleFunc("/warehouses", getWarehouses)
    log.Println("Сервер запущен на http://localhost:8091")

	err := http.ListenAndServe(":8091", nil)
	if err != nil {
		log.Fatalf("Ошибка при запуске сервера: %v", err)
	}
}
