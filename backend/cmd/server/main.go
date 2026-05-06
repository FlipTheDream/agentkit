package main

import (
	"log"
	"os"

	agentpb "agentkit/internal/pocketbase"
)

func main() {
	app := agentpb.Bootstrap()

	addr := "0.0.0.0:8090"
	if port := os.Getenv("PORT"); port != "" {
		addr = "0.0.0.0:" + port
	}

	log.Printf("Agentkit backend starting on %s", addr)
	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
