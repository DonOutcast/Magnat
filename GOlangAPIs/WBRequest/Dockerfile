FROM golang:alpine

WORKDIR /build
COPY . .
RUN go build .

CMD ["./WBRequest"]