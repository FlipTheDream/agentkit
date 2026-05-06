package main

import (
	"log"

	agentpb "agentkit/internal/pocketbase"
)

func main() {
	app := agentpb.Bootstrap()

	log.Println("Agentkit backend bootstrap complete; handing off to PocketBase CLI")
	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
