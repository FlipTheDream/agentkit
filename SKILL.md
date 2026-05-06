---
name: agentkit
description: Fullstack development framework with Pocketbase (Go), SvelteKit 5, and NATS. Scaffold new apps, extend the backend with Go hooks, build Svelte 5 dashboard pages, manage Docker-based dev/prod environments. Use for building realtime, authenticated fullstack applications.
---

# Agentkit Skill

Build fullstack applications from this starter framework. Pocketbase provides auth, database, and realtime SSE. SvelteKit 5 with runes powers the dashboard frontend. NATS handles cross-service messaging over WebSockets.

## When to Use

- Scaffolding a new authenticated fullstack application
- Adding backend API endpoints or Pocketbase hooks in Go
- Building dashboard pages with SvelteKit 5
- Setting up OAuth2 (Google) authentication
- Adding realtime features via SSE or NATS pub/sub
- Deploying with Docker Compose to production

## Project Philosophy

Backend logic belongs in Go (Pocketbase hooks and API routes). Frontend UI is SvelteKit 5 using runes (`$state`, `$derived`, `$effect`) — not stores. NATS handles cross-service communication, not user-facing realtime (use Pocketbase SSE subscriptions for that).

## Directory Conventions

```
agentkit/
├── backend/
│   ├── cmd/server/main.go              # Go entry point — bootstrap PB + NATS
│   ├── internal/pocketbase/            # PB config, hooks, route registration
│   └── internal/nats/                  # NATS subscriber setup
├── frontend/
│   └── src/
│       ├── lib/                        # Shared clients (PB SDK, NATS WS)
│       └── routes/                     # SvelteKit file-based routes
│           ├── +layout.svelte          # Root layout shell
│           └── (route)/+page.svelte    # Pages with Svelte 5 runes
├── nats/nats-server.conf               # NATS server config
├── docker-compose.yml                  # Dev with hot-reload
├── docker-compose.prod.yml             # Prod self-build
├── docker-compose.deploy.yml           # Deploy from ghcr.io images
└── .github/workflows/build.yml         # CI/CD → ghcr.io on version tags
```

## Scaffolding New Routes

SvelteKit uses file-based routing. To add a new page:

```
frontend/src/routes/dashboard/+page.svelte   → /dashboard
frontend/src/routes/dashboard/users/+page.svelte → /dashboard/users
```

Layouts wrap child routes:

```svelte
<!-- frontend/src/routes/dashboard/+layout.svelte -->
<script>
  let { children } = $props();
</script>

<nav>Dashboard Navigation</nav>
{@render children()}
```

## Svelte 5 Runes (Not Stores)

Use runes for all component state:

```svelte
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);

  $effect(() => {
    console.log('count changed:', count);
  });
</script>

<button onclick={() => count++}>Count: {count} ({doubled})</button>
```

## Pocketbase Extension

### Bootstrapping

```go
// backend/cmd/server/main.go
package main

import (
    "log"
    "os"

    agentpb "agentkit/internal/pocketbase"
)

func main() {
    app := agentpb.Bootstrap()
    if err := app.Start(); err != nil {
        log.Fatal(err)
    }
}
```

### Registering Custom Routes

Add routes in `backend/internal/pocketbase/pocketbase.go`:

```go
func registerRoutes(app core.App) {
    app.OnServe().BindFunc(func(se *core.ServeEvent) error {
        se.Router.GET("/api/custom", func(e *core.RequestEvent) error {
            return e.JSON(200, map[string]string{"message": "hello"})
        })
        return se.Next()
    })
}
```

### Database Hooks

Hooks intercept record create, update, delete, and view operations:

```go
app.OnRecordCreate("todos").BindFunc(func(e *core.RecordEvent) error {
    // validate or transform before create
    return e.Next()
})
```

Available hooks: `OnRecordCreate`, `OnRecordUpdate`, `OnRecordDelete`, `OnRecordView`, `OnRecordCreateExecute`, `OnRecordUpdateExecute`, `OnRecordDeleteExecute`.

### OAuth2 Configuration

OAuth2 providers are configured per auth collection in Pocketbase v0.25+. Google OAuth is set up during bootstrap on the `users` collection.

Environment variables:

```
PB_OAUTH_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
PB_OAUTH_GOOGLE_CLIENT_SECRET=GOCSPX-xxx
```

The OAuth2 redirect URL is `http://localhost:8090/api/oauth2-redirect`.

To add more providers (GitHub, etc.), add them to the `OAuth2.Providers` slice on the auth collection:

```go
collection.OAuth2.Providers = append(collection.OAuth2.Providers, core.OAuth2ProviderConfig{
    Name:         "github",
    ClientId:     os.Getenv("PB_OAUTH_GITHUB_CLIENT_ID"),
    ClientSecret: os.Getenv("PB_OAUTH_GITHUB_CLIENT_SECRET"),
    DisplayName:  "GitHub",
})
```

## NATS Subjects

Subject hierarchy conventions:

| Subject | Direction | Purpose |
|---------|-----------|---------|
| `agentkit.heartbeat` | Frontend → NATS | Service health from browser |
| `agentkit.events.<name>` | Any → NATS | Application events |
| `agentkit.cmd.<service>` | Any → NATS | Service commands |

### Subscribing (Go)

```go
nc.Subscribe("agentkit.heartbeat", func(msg *nats.Msg) {
    log.Printf("received heartbeat: %s", string(msg.Data))
})
```

### Publishing (Browser via WebSocket)

```ts
import { publish } from '$lib/nats';
publish('agentkit.heartbeat', JSON.stringify({ ts: Date.now() }));
```

## Docker Conventions

### Development
```bash
docker compose up --build
```

Backend uses `air` for Go hot-reload (rebuilds on file change). Frontend uses Vite dev server with HMR. Source code is volume-mounted — changes on host reflect immediately.

### Production (self-build)
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

Multi-stage Docker builds produce minimal Alpine images. No hot-reload, no development-only volumes. Frontend served on `:3000`, backend on `:8090`.

### Deploy (pre-built images)
```bash
docker compose -f docker-compose.deploy.yml up -d
```

Pulls pre-built images from `ghcr.io/flipthedream/agentkit/`. Images are built by CI when a version tag (`v*`) is pushed to the repo.

### Adding New Services
1. Add a `Dockerfile` (and `Dockerfile.prod`) in the service directory
2. Add service definition to `docker-compose.yml` (dev) and `docker-compose.prod.yml`
3. Add the ghcr.io image to `docker-compose.deploy.yml`
4. If it depends on other services, use `condition: service_healthy`

## Pocketbase JavaScript SDK

The client is initialized as a singleton:

```ts
// frontend/src/lib/pocketbase.ts
import PocketBase from 'pocketbase';

export const pb = new PocketBase(import.meta.env.PUBLIC_POCKETBASE_URL);
```

Use in any Svelte component:

```svelte
<script>
  import { pb } from '$lib/pocketbase';
  import { onMount } from 'svelte';

  let records = $state([]);

  $effect(() => {
    pb.collection('todos').getList(1, 50).then(r => records = r.items);
  });
</script>
```

Auth helpers:
```ts
pb.authStore.isValid           // true if authenticated
pb.authStore.model             // current user record
pb.collection('users').authWithOAuth2({ provider: 'google' })
pb.authStore.clear()           // logout
```

Realtime subscriptions (SSE):
```ts
pb.collection('todos').subscribe('*', (e) => {
  // e.action: 'create' | 'update' | 'delete'
  // e.record: the affected record
});
```

## Testing

Backend tests live alongside code as `*_test.go` files. Use `httptest` for API testing:

```go
func TestHealthEndpoint(t *testing.T) {
    req := httptest.NewRequest("GET", "/api/health", nil)
    // ...
}
```

Frontend tests use Playwright. Run with:
```bash
npx playwright test
```

CI validates both on every push and pull request via GitHub Actions. Docker images are built and published to ghcr.io only when a version tag (`v*`) is pushed.

## Environment Variable Reference

| Variable | Where | Purpose |
|----------|-------|---------|
| `PB_OAUTH_GOOGLE_CLIENT_ID` | Docker compose | Google OAuth2 client ID |
| `PB_OAUTH_GOOGLE_CLIENT_SECRET` | Docker compose | Google OAuth2 client secret |
| `PB_ADMIN_EMAIL` | Docker compose | Default admin account email |
| `PB_ADMIN_PASSWORD` | Docker compose | Default admin account password |
| `NATS_URL` | Backend container | NATS connection string |
| `PUBLIC_POCKETBASE_URL` | Frontend build | Pocketbase API URL (client-side) |
| `PUBLIC_NATS_WS_URL` | Frontend build | NATS WebSocket URL (client-side) |
| `ORIGIN` | Frontend prod container | Trusted origin for CSRF protection |
