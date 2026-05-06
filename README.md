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

### Production

```bash
# Build and run optimized images
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

## Project Structure

```
agentkit/
├── README.md
├── SKILL.md                       # AI agent skill definition
├── docker-compose.yml             # Development compose
├── docker-compose.prod.yml        # Production overrides
├── .github/workflows/build.yml    # CI/CD pipeline
├── nats/nats-server.conf          # NATS configuration
├── backend/
│   ├── Dockerfile                 # Dev build (air hot-reload)
│   ├── Dockerfile.prod            # Prod multi-stage build
│   ├── go.mod
│   ├── cmd/server/main.go         # Entry point
│   └── internal/
│       ├── pocketbase/            # PB bootstrap + hooks
│       └── nats/                  # NATS subscriber client
└── frontend/
    ├── Dockerfile                 # Dev build (Vite HMR)
    ├── Dockerfile.prod            # Prod multi-stage build
    ├── package.json
    ├── svelte.config.js
    ├── vite.config.ts
    └── src/
        ├── lib/
        │   ├── pocketbase.ts      # PB SDK client singleton
        │   └── nats.ts            # NATS WS client
        └── routes/
            ├── +layout.svelte     # Root layout
            └── +page.svelte       # Dashboard
```

## Extension Points

### Pocketbase Hooks
Define hooks in `backend/internal/pocketbase/hooks.go` to intercept record CRUD operations, auth events, and API calls.

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
