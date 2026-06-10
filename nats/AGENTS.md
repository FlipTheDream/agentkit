# DOX: nats

## Purpose

NATS server configuration shared by every compose file (`docker-compose.yml`, `docker-compose.prod.yml`, `docker-compose.deploy.yml`). Mounted read-only into the `nats` service at `/etc/nats/nats-server.conf`.

## Ownership

- `nats-server.conf` — sole file

## Local Contracts

- Client port: `4222` (used by Go backend via `NATS_URL=nats://nats:4222`)
- HTTP monitor port: `8222` (used by healthcheck `wget -qO- http://localhost:8222/healthz`)
- WebSocket port: `9222` (used by browser via `PUBLIC_NATS_WS_URL=ws://localhost:9222`)
- `max_payload: 8MB`
- JetStream enabled with persistent store at `/data/jetstream`, 256 MB memory store, 1 GB file store
- WebSocket: `no_tls: true` (TLS terminated upstream if needed)

## Work Guidance

- All three compose files mount the same `nats-server.conf`; changing a port here changes it everywhere.
- JetStream store data lives in the `nats_data` named volume. Removing the volume wipes JetStream state.
- If TLS is needed, switch to `tls { cert_file = ...; key_file = ... }` and update `PUBLIC_NATS_WS_URL` defaults accordingly.

## Verification

- `wget -qO- http://localhost:8222/healthz` (defined as the `nats` healthcheck in every compose file)
- Backend `connectNATS` log: `NATS connected to nats://nats:4222`
- Browser console: `NATS connected to ws://localhost:9222` from `lib/nats.svelte.ts`

## Child DOX Index

None.
