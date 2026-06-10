# DOX: backend

## Purpose

Go backend built on Pocketbase v0.25. Extends PB with custom Go hooks, OAuth2 (Google), runtime `/api/config`, and a NATS subscriber. Single binary entry point: `cmd/server`.

## Ownership

- `cmd/server/main.go` — entry point; calls `agentpb.Bootstrap()` then `app.Start()`
- `internal/pocketbase/` — PB bootstrap, superuser, OAuth, routes, hooks, NATS wire-up
- `internal/nats/` — thin `nats.go` client wrapper
- `go.mod` / `go.sum` — module `agentkit`, Go 1.23
- `Dockerfile` (target `dev`) — `air` hot-reload, pinned to `air@v1.61.7` (newer air requires Go 1.25)
- `Dockerfile.prod` (target `runtime`) — multi-stage build, `ENTRYPOINT ["/app/server"]`, `CMD ["serve","--http=0.0.0.0:8090"]`
- `.air.toml` — air config; builds `cmd/server`, runs `serve --http=0.0.0.0:8090`
- `pb_data/` — Pocketbase SQLite (volume-mounted; ignored by git)

## Local Contracts

- Entrypoint: `main.go` → `agentpb.Bootstrap()` returns a configured `*pocketbase.PocketBase`; `app.Start()` invokes PB's CLI (`serve` is the production subcommand).
- HTTP port: `8090`, bound to `0.0.0.0` in both dev (air) and prod (Dockerfile `CMD`).
- Environment contract: `PB_*` for PB concerns, `PUBLIC_POCKETBASE_URL` / `PUBLIC_NATS_WS_URL` for runtime config served to the browser, `NATS_URL` for the Go→NATS connection, `INTERNAL_POCKETBASE_URL` is **frontend-only**.
- `internal/nats.Connect` failure is non-fatal — the PB process continues without NATS.
- `registerRoutes` must not re-register `/api/health`; PB v0.25+ owns that path.

## Work Guidance

- Extend PB via `app.OnServe().BindFunc(...)` hooks. Hooks fire on every serve; gate expensive setup behind `OnServe` once.
- New custom routes go in `registerRoutes` inside `internal/pocketbase/pocketbase.go`. Keep handlers small; factor logic into helpers.
- New OAuth providers: append to `collection.OAuth2.Providers` in `bootstrapOAuth`. Mirror the Google shape; read creds from `PB_OAUTH_<NAME>_CLIENT_ID` / `PB_OAUTH_<NAME>_CLIENT_SECRET`.
- New record hooks: `OnRecordCreate` / `OnRecordUpdate` / `OnRecordDelete` / `OnRecordView` / `*Execute` — register inside `registerHooks`.
- Use the local `envOr(key, fallback string)` helper for env reads; never log secrets.
- `Dockerfile` pins `air@v1.61.7` for Go 1.23 compatibility. Bump Go first, then air.
- `Dockerfile.prod` must keep `CMD ["serve","--http=0.0.0.0:8090"]`; running the entrypoint without a subcommand prints CLI help and exits (breaks healthcheck → restart loop in deploy).

## Verification

- `golangci-lint --timeout=5m` (CI job `lint-backend` in `.github/workflows/build.yml`)
- `go test ./...` (CI job `test-backend`)
- Container healthcheck: `wget -qO- http://localhost:8090/api/health` (defined in each compose file)

## Child DOX Index

- `internal/pocketbase/` — PB extension: bootstrap, superuser, OAuth, routes, hooks, NATS wire-up
- `internal/nats/` — Go NATS client wrapper used by the PB process
