# DOX: backend/internal/nats

## Purpose

Thin Go wrapper around `github.com/nats-io/nats.go` used by the Pocketbase process. Provides a single `Client` value with `Subscribe`, `Publish`, and `Close`; configured for reconnect and short timeouts so the PB process is not blocked by NATS outages.

## Ownership

- `client.go` — sole file. Contains: `Client` struct, `Connect`, `Subscribe`, `Publish`, `Close`.

## Local Contracts

- `Connect(url string) (*Client, error)` — connects to NATS with `RetryOnFailedConnect`, `MaxReconnects(10)`, `ReconnectWait(2s)`, `Timeout(10s)`. Logs disconnect/reconnect events via `DisconnectErrHandler` / `ReconnectHandler`.
- `Subscribe(subject string, handler func(data []byte)) (*natsgo.Subscription, error)` — handler receives raw `msg.Data` bytes; the wrapper hides the `*nats.Msg` plumbing.
- `Publish(subject string, data []byte) error` — direct passthrough to `conn.Publish`.
- `Close()` — closes the underlying connection; no error returned (PB shutdown is best-effort).
- Caller contract: `internal/pocketbase.connectNATS` treats `Connect` failure as non-fatal and logs `continuing without NATS`.

## Work Guidance

- Keep the surface small. Do not re-export `*natsgo.Conn`; consumers should not depend on the underlying client.
- Do not add request/reply or JetStream APIs here unless a concrete caller needs them. New behavior should match the existing pub/sub + auto-reconnect shape.
- Handler callbacks receive raw bytes; encoding/decoding is the caller's responsibility.

## Verification

- `golangci-lint --timeout=5m` from `backend/`
- `go test ./...` from `backend/`

## Child DOX Index

None.
