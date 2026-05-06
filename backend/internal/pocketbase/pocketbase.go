package pocketbase

import (
	"log"
	"os"
	"time"

	"agentkit/internal/nats"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
)

func Bootstrap() *pocketbase.PocketBase {
	app := pocketbase.New()

	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		Automigrate: true,
	})

	bootstrapSuperuser(app)
	bootstrapOAuth(app)
	registerRoutes(app)
	registerHooks(app)
	connectNATS(app)

	return app
}

func bootstrapSuperuser(app *pocketbase.PocketBase) {
	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		email := os.Getenv("PB_ADMIN_EMAIL")
		password := os.Getenv("PB_ADMIN_PASSWORD")
		if email == "" {
			email = "admin@agentkit.local"
		}
		if password == "" {
			password = "agentkit123"
		}

		existing, _ := app.FindAuthRecordByEmail(core.CollectionNameSuperusers, email)
		if existing == nil {
			collection, err := app.FindCollectionByNameOrId(core.CollectionNameSuperusers)
			if err != nil {
				log.Printf("failed to find superusers collection: %v", err)
				return se.Next()
			}

			record := core.NewRecord(collection)
			record.SetEmail(email)
			record.SetVerified(true)
			record.SetPassword(password)

			if err := app.Save(record); err != nil {
				log.Printf("failed to create superuser: %v", err)
			} else {
				log.Printf("created superuser account: %s", email)
			}
		}

		return se.Next()
	})
}

func bootstrapOAuth(app *pocketbase.PocketBase) {
	googleClientID := os.Getenv("PB_OAUTH_GOOGLE_CLIENT_ID")
	googleClientSecret := os.Getenv("PB_OAUTH_GOOGLE_CLIENT_SECRET")

	if googleClientID == "" || googleClientSecret == "" {
		log.Println("Google OAuth not configured (set PB_OAUTH_GOOGLE_CLIENT_ID and PB_OAUTH_GOOGLE_CLIENT_SECRET)")
		return
	}

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		collection, err := app.FindCollectionByNameOrId("users")
		if err != nil {
			log.Printf("users collection not found: %v", err)
			return se.Next()
		}

		collection.OAuth2.Enabled = true

		provider := core.OAuth2ProviderConfig{
			Name:         "google",
			ClientId:     googleClientID,
			ClientSecret: googleClientSecret,
			DisplayName:  "Google",
		}

		collection.OAuth2.Providers = []core.OAuth2ProviderConfig{provider}

		if err := app.Save(collection); err != nil {
			log.Printf("failed to enable OAuth2: %v", err)
		} else {
			log.Println("Google OAuth2 enabled on users collection")
		}

		return se.Next()
	})
}

func registerRoutes(app *pocketbase.PocketBase) {
	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		se.Router.GET("/api/hello", func(e *core.RequestEvent) error {
			return e.JSON(200, map[string]any{
				"app":    "Agentkit",
				"status": "ok",
				"time":   time.Now().UTC().Format(time.RFC3339),
			})
		})

		se.Router.GET("/api/health", func(e *core.RequestEvent) error {
			return e.JSON(200, map[string]any{
				"status": "healthy",
			})
		})

		return se.Next()
	})
}

func registerHooks(app *pocketbase.PocketBase) {
	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		log.Println("Agentkit hooks initialized")
		return se.Next()
	})
}

func connectNATS(app *pocketbase.PocketBase) {
	natsURL := os.Getenv("NATS_URL")
	if natsURL == "" {
		natsURL = "nats://localhost:4222"
	}

	nc, err := nats.Connect(natsURL)
	if err != nil {
		log.Printf("NATS connection failed: %v (continuing without NATS)", err)
		return
	}

	log.Printf("NATS connected to %s", natsURL)
	_, err = nc.Subscribe("agentkit.heartbeat", func(data []byte) {
		log.Printf("received heartbeat: %s", string(data))
	})
	if err != nil {
		log.Printf("NATS subscribe error: %v", err)
	}
	if err != nil {
		log.Printf("NATS subscribe error: %v", err)
	}
}
