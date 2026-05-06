# Agentkit

[![CI/CD](https://github.com/FlipTheDream/agentkit/actions/workflows/build.yml/badge.svg)](https://github.com/FlipTheDream/agentkit/actions/workflows/build.yml)
[![Go Version](https://img.shields.io/badge/Go-1.23-00ADD8?logo=go)](https://go.dev/)
[![Svelte](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte)](https://svelte.dev/)
[![Pocketbase](https://img.shields.io/badge/Pocketbase-v0.25-9C27B0)](https://pocketbase.io/)
[![NATS](https://img.shields.io/badge/NATS-2.10-27A0D3?logo=natsdotio)](https://nats.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://docs.docker.com/compose/)

A reusable fullstack development framework for agentic development workflows, built with Pocketbase (Go), SvelteKit 5, and NATS.

## Architecture

```
┌──────────────────┐    ┌──────────────────────┐    ┌────────────────┐
│   SvelteKit 5    │    │      Pocketbase       │    │     NATS       │
│   :5173 (dev)    │    │      :8090            │    │   :4222        │
│   :3000 (prod)   │◄──►│                      │◄──►│   :9222 (WS)   │
│                  │    │   Go extended         │    │                │
│   PB SDK JS      │    │   OAuth2 (Google)     │    │   Pub/Sub      │
│   NATS WS        │    │   SSE subscriptions   │    │   Realtime     │
└──────────────────┘    └─────────┬────────────┘    └────────────────┘
                                  │
                            SQLite (pb_data)
```

## Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Backend | Pocketbase (Go) | Auth, DB, realtime API, file storage |
| Frontend | SvelteKit 5 (runes) | Modern reactive dashboard |
| Messaging | NATS (WebSocket) | Cross-service realtime events |
| Container | Docker Compose | Dev + production orchestration |
| CI/CD | GitHub Actions | Lint, test, build, push to ghcr.io |

## Quick Start

### Prerequisites
- Docker and Docker Compose v2

### Development

```bash
# Start all services with hot-reload
docker compose up --build

# Backend: Go with Air hot-reload on :8090
# Frontend: Vite dev server with HMR on :5173
# NATS: Server with WebSocket on :9222
```

Open [http://localhost:5173](http://localhost:5173) to see the dashboard.

### Production (self-build)

```bash
# Build multi-stage optimized images locally
docker compose -f docker-compose.prod.yml up --build -d

# Frontend served on :3000, backend on :8090
```

### Deploy (pre-built images)

```bash
# Pull pre-built images from ghcr.io
docker compose -f docker-compose.deploy.yml up -d

# Uses the latest :latest image (updated on every push to main)
# Frontend on :3000, backend on :8090
```

## Runtime Configuration

Frontend URLs (Pocketbase API, NATS WebSocket) are resolved at **runtime**
from the backend's `/api/config` endpoint. This means a single published
image can be deployed to any environment — per-deployment URLs are set as
environment variables on the **backend** container, not baked into the
frontend at build time.

```
PUBLIC_POCKETBASE_URL   → returned by /api/config, used by browser
PUBLIC_NATS_WS_URL      → returned by /api/config, used by browser
INTERNAL_POCKETBASE_URL → used by the frontend SSR layer to call the
                          backend via docker internal DNS
```

The frontend falls back to build-time defaults only if `/api/config`
fails (keeps local dev and tests working without the backend running).

## Release Workflow

Images are built and published to GitHub Container Registry:

- **Every push to `main`** → publishes `:main` and `:latest` (multi-arch).
- **Version tag `v*`** → publishes `:vX.Y.Z`, `:X.Y`, and updates `:latest`.
- **Pull requests** → build only (no push), for validation.

```bash
git tag v0.1.2
git push origin v0.1.2
```

| Image | Registry Path |
|-------|---------------|
| Backend | `ghcr.io/flipthedream/agentkit/backend:v0.1.2` |
| Frontend | `ghcr.io/flipthedream/agentkit/frontend:v0.1.2` |

## Project Structure

```
agentkit/
├── README.md
├── SKILL.md                       # AI agent skill definition
├── docker-compose.yml             # Development compose
├── docker-compose.prod.yml        # Production self-build overrides
├── docker-compose.deploy.yml      # Deploy pre-built ghcr.io images
├── .github/workflows/build.yml    # CI/CD pipeline
├── nats/nats-server.conf          # NATS configuration
├── backend/
│   ├── Dockerfile                 # Dev build (air hot-reload)
│   ├── Dockerfile.prod            # Prod multi-stage build
│   ├── go.mod
│   ├── cmd/server/main.go         # Entry point
│   └── internal/
│       ├── pocketbase/            # PB bootstrap + hooks + /api/config
│       └── nats/                  # NATS subscriber client
└── frontend/
    ├── Dockerfile                 # Dev build (Vite HMR)
    ├── Dockerfile.prod            # Prod multi-stage build
    ├── package.json
    ├── svelte.config.js
    ├── vite.config.ts
    └── src/
        ├── lib/
        │   ├── config.ts          # Runtime config loader (SSR + browser)
        │   ├── pocketbase.ts      # PB SDK client factory
        │   └── nats.ts            # NATS WS client
        └── routes/
            ├── +layout.ts         # Universal load → resolves /api/config
            ├── +layout.svelte     # Root layout
            └── +page.svelte       # Dashboard
```

## Extension Points

### Pocketbase Hooks
Define hooks in `backend/internal/pocketbase/` to intercept record CRUD operations, auth events, and API calls.

### OAuth2 Providers
Configure providers via `PB_OAUTH_GOOGLE_CLIENT_ID` and `PB_OAUTH_GOOGLE_CLIENT_SECRET` environment variables. Additional providers can be added in `backend/internal/pocketbase/pocketbase.go`.

### NATS Subjects
Standard subject hierarchy:

| Pattern | Purpose |
|---------|---------|
| `agentkit.>` | All events |
| `agentkit.heartbeat` | Service health |
| `agentkit.events.*` | Application events |

### SvelteKit Pages
Add new routes under `frontend/src/routes/`. SvelteKit file-based routing maps directory structure to URLs.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PB_OAUTH_GOOGLE_CLIENT_ID` | No | - | Google OAuth2 client ID |
| `PB_OAUTH_GOOGLE_CLIENT_SECRET` | No | - | Google OAuth2 client secret |
| `PB_ADMIN_EMAIL` | No | admin@agentkit.local | Admin panel email |
| `PB_ADMIN_PASSWORD` | No | agentkit123 | Admin panel password |
| `PUBLIC_POCKETBASE_URL` | No | http://localhost:8090 | Public URL the browser uses to reach Pocketbase; served to frontend via `/api/config` |
| `PUBLIC_NATS_WS_URL` | No | ws://localhost:9222 | Public URL the browser uses for NATS WebSocket |
| `INTERNAL_POCKETBASE_URL` | No | http://backend:8090 | Internal docker-network URL the frontend SSR layer uses to call the backend |
| `NATS_URL` | No | nats://nats:4222 | Backend → NATS server URL |
| `ORIGIN` | No | http://localhost:3000 | SvelteKit adapter-node trusted origin |

## Troubleshooting

### Backend container restarts / `/api/health` fails on deploy

The published `:latest` image must have `/app/server serve --http=0.0.0.0:8090`
as its command. Running `/app/server` without a subcommand makes PocketBase
print CLI help and exit (causing the healthcheck to fail and the container
to loop under `restart: unless-stopped`).

Verify with:
```bash
docker image inspect ghcr.io/flipthedream/agentkit/backend:latest \
  --format '{{json .Config.Cmd}} {{json .Config.Entrypoint}}'
```
Expected: `["serve","--http=0.0.0.0:8090"] ["/app/server"]`.

If the image is stale, push any commit to `main` (or cut a new tag) to
trigger a rebuild — the workflow now publishes on every main push.

### Frontend shows "offline" for API status

If the frontend is inside Docker, SSR calls go to
`INTERNAL_POCKETBASE_URL` (default `http://backend:8090`). Make sure the
backend service is named `backend` in your compose file, or override this
env var accordingly.
