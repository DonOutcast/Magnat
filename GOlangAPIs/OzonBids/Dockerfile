FROM golang:alpine

WORKDIR /build

COPY . .
RUN go build .
EXPOSE 8092
CMD ["./OzonBids"]