FROM golang:1.23-alpine AS dev

RUN apk add --no-cache git wget
RUN go install github.com/air-verse/air@latest

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

EXPOSE 8090

CMD ["air", "--", "-c", "cmd/server/main.go"]
