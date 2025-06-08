package main

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
)

type ApiGenericResult[T any] struct {
	Result T `json:"result"`
}

type ApiResult[T any] struct {
	IsOk      bool
	Data      T
	exception error
}
func PostRequest[T any, V any](data T, link string, userReq http.Request) ApiResult[V] {
	var result ApiResult[V]

	jsonData, err := json.Marshal(data)
	if err != nil {
		log.Printf("Ошибка при сериализации: %v", err)
		result.IsOk = false
		return result
	}

	client := http.Client{}

	req, err := http.NewRequest("POST", "https://api-seller.ozon.ru"+link, bytes.NewReader(jsonData))
	if err != nil {
		log.Printf("Ошибка при создании запроса: %v", err)
		result.IsOk = false
		return result
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Client-Id", userReq.Header.Get("Client-Id"))
	req.Header.Set("Api-Key", userReq.Header.Get("Api-Key"))

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Ошибка при выполнении запроса: %v", err)
		result.IsOk = false
		return result
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("Ответ от сервера: %s", resp.Status)
		result.IsOk = false
		return result
	}

	if err := json.NewDecoder(resp.Body).Decode(&result.Data); err != nil {
		log.Printf("Ошибка при разборе JSON-ответа: %v", err)
		result.IsOk = false
		return result
	}

	result.IsOk = true
	return result
}


func GetRequest[T any, V any](link string, userReq http.Request) ApiResult[V] {
	var result ApiResult[V]

	client := http.Client{}

	req, err := http.NewRequest("GET", "https://api-seller.ozon.ru"+link, nil)
	if err != nil {
		log.Fatal(err)
	}

	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("Client-Id", userReq.Header.Get("Client-Id"))
	req.Header.Add("Api-Key", userReq.Header.Get("Api-Key"))
	resp, err := client.Do(req)

	if err != nil {
		log.Fatal(err)
	}
	defer resp.Body.Close()

	json.NewDecoder(resp.Body).Decode(&result.Data)
	result.IsOk = true
	result.exception = nil

	return result
}

func response(w http.ResponseWriter, res any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}
