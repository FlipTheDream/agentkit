# DOX: backend/internal/pocketbase

## Purpose

Pocketbase extension layer. Owns the `Bootstrap()` factory consumed by `cmd/server`, plus the superuser, OAuth2, custom routes, record hooks, and the NATS connection that the PB process needs at startup.

## Ownership

- `pocketbase.go` — sole file. Contains: `Bootstrap`, `envOr`, `bootstrapSuperuser`, `bootstrapOAuth`, `registerRoutes`, `registerHooks`, `connectNATS`.

## Local Contracts

- `Bootstrap()` returns a `*pocketbase.PocketBase` ready for `app.Start()`. Order matters: `migratecmd.MustRegister` → superuser → OAuth → routes → hooks → NATS.
- `migratecmd` runs with `Automigrate: true`; PB v0.25 migrations are auto-applied.
- Superuser is created on first serve if missing. Reads `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD` (defaults: `admin@agentkit.local` / `agentkit123`).
- Google OAuth2 is auto-enabled on the `users` auth collection when `PB_OAUTH_GOOGLE_CLIENT_ID` and `PB_OAUTH_GOOGLE_CLIENT_SECRET` are set. Skipped silently otherwise.
- Routes registered under `/api`:
  - `GET /api/hello` — sanity payload `{app, status, time}`.
  - `GET /api/config` — runtime config `{pocketbaseUrl, natsWsUrl}` from `PUBLIC_POCKETBASE_URL` / `PUBLIC_NATS_WS_URL`.
  - `GET /api/health` — **not registered here**; owned by PB v0.25+.
- NATS: connects to `NATS_URL` (default `nats://localhost:4222`), subscribes to `agentkit.heartbeat` and logs the payload. Connection failure is non-fatal.

## Work Guidance

- Add new custom routes in `registerRoutes`. Use `se.Router.GET/POST/...`; return errors via `e.JSON` or call `e.Next()`.
- Add record hooks in `registerHooks` using `app.OnRecord<Op>("collection").BindFunc(...)`. The `*Execute` variants run after the default action.
- Adding OAuth providers: append to `collection.OAuth2.Providers` inside `bootstrapOAuth`. Mirror the Google provider shape; read creds from matching `PB_OAUTH_*` env vars.
- `/api/config` must read only `PUBLIC_*` env vars (browser-facing). `INTERNAL_*` vars are frontend-only.
- Never log credentials or OAuth client secrets. Use the `envOr` helper for env reads with sensible defaults.
- Don't re-register `/api/health`; doing so panics on a pattern conflict in PB v0.25+.

## Verification

- `golangci-lint --timeout=5m` from `backend/`
- `go test ./...` from `backend/`
- Manual: `curl localhost:8090/api/hello` and `curl localhost:8090/api/config` should return JSON

## Child DOX Index

None. Sub-areas (superuser, OAuth, routes, hooks, NATS) live inside this one file; no durable boundary warrants a child doc.
