FROM golang:1.23-alpine AS dev

RUN apk add --no-cache git wget
# Pinned: air v1.65.1+ requires Go 1.25, but we're on 1.23.
RUN go install github.com/air-verse/air@v1.61.7

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

EXPOSE 8090

CMD ["air", "-c", ".air.toml"]
