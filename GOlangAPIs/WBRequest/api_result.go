package main

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"reflect"
)

type ApiResult[T any] struct {
	IsOk      bool
	Data      T
	exception error
}

func PostRequest[T any, V any](apiService string, data T, link string, userReq http.Request) ApiResult[V] {
	var result ApiResult[V]

	jsonData, err := json.Marshal(data)

	if err != nil {
		log.Fatal(err)
	}

	if reflect.TypeOf(data) == nil {
		jsonData = nil
	}

	client := http.Client{}

	req, err := http.NewRequest("POST", "https://"+apiService+".wildberries.ru"+link, bytes.NewReader(jsonData))
	if err != nil {
		log.Fatal(err)
	}

	req.Header.Add("ContentType", "application/json")
	req.Header.Add("Authorization", userReq.Header.Get("Authorization"))
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

func GetRequest[V any](apiService string, link string, userReq http.Request) ApiResult[V] {
	var result ApiResult[V]

	client := http.Client{}

	req, err := http.NewRequest("GET", "https://"+apiService+".wildberries.ru"+link, nil)
	if err != nil {
		log.Fatal(err)
	}

	req.Header.Add("ContentType", "application/json")
	req.Header.Add("Authorization", userReq.Header.Get("Authorization"))
	resp, err := client.Do(req)

	if err != nil {
		log.Fatal(err)
	}
	defer resp.Body.Close()

	json.NewDecoder(resp.Body).Decode(&result.Data)
	result.IsOk = resp.StatusCode == 200
	result.exception = nil

	return result
}

func response(w http.ResponseWriter, res any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func ping(w http.ResponseWriter, req *http.Request) {
	var result = GetRequest[any]("statistics-api", "/ping", *req)
	response(w, result.Data)
}
