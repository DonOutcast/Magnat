FROM golang:alpine

WORKDIR /build

COPY . .
RUN go build .
EXPOSE 8090
CMD ["./OzonRequest"]