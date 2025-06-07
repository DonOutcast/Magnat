package main

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"reflect"
)

type ApiGenericProducts[T any] struct {
	Products []T `json:"products"`
	Total    int `json:"total"`
}

type ApiGenericList[T any] struct {
	List []T `json:"list"`
}

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
		log.Fatal(err)
	}

	if reflect.TypeOf(data) == nil {
		jsonData = nil
	}

	client := http.Client{}

	req, err := http.NewRequest("POST", "https://api-performance.ozon.ru"+link, bytes.NewReader(jsonData))
	if err != nil {
		log.Fatal(err)
	}

	req.Header.Add("ContentType", "application/json")
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

func GetRequest[T any, V any](link string, userReq http.Request) ApiResult[V] {
	var result ApiResult[V]

	client := http.Client{}

	req, err := http.NewRequest("GET", "https://api-performance.ozon.ru"+link, nil)
	if err != nil {
		log.Fatal(err)
	}

	req.Header.Add("ContentType", "application/json")
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
