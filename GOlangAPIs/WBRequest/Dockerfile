FROM golang:alpine

WORKDIR /build
RUN go build .
COPY WBRequest .

CMD ["./WBRequest"]