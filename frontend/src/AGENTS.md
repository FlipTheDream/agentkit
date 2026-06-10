# DOX: frontend/src

## Purpose

Client code. Owns the shared library clients (config loader, PocketBase SDK singleton, NATS WebSocket) and the SvelteKit file-based routes. The runtime config is resolved here and forwarded to all child routes via `data.config`.

## Ownership

- `app.html` — SvelteKit shell
- `app.css` — global styles (CSS custom properties for theming)
- `lib/config.ts` — `AppConfig` type, `fallbackConfig()`, `fetchConfig()`
- `lib/pocketbase.ts` — `getPbFromConfig(config)` singleton factory
- `lib/nats.svelte.ts` — runes-backed NATS WS connection (`nc`, `connected`, `error`), browser-only
- `routes/+layout.server.ts` — server-side load; reads `INTERNAL_POCKETBASE_URL`
- `routes/+layout.ts` — universal load; SSR inherits, browser re-fetches `/api/config`
- `routes/+layout.svelte` — root layout: header with API/NATS status indicators, mount point
- `routes/+page.svelte` — dashboard hero + 3 stack cards (Pocketbase, SvelteKit 5, NATS), sends `agentkit.heartbeat` every 5 s

## Local Contracts

- `AppConfig` shape: `{ pocketbaseUrl: string; natsWsUrl: string }`. Always both fields, always strings.
- `fetchConfig(endpoint, fetch)` always falls back to `fallbackConfig()` on error; never throws to callers. Build-time defaults come from `$env/dynamic/public`.
- `getPbFromConfig(config)` is idempotent: returns a singleton, updates `baseUrl` only if it drifted. Always call with `autoCancellation(false)` set.
- NATS connection is browser-only: `connectNats` is a no-op when `$app/environment.browser` is false. `nats.ws` is dynamically imported inside the function so SSR does not pull in WebSocket globals.
- Load chain: `+layout.server.ts` (private env) → `+layout.ts` (universal, may re-fetch) → all child routes receive `data.config`. Never re-resolve env inside child routes.
- Components must use `let { data, children } = $props()`; never destructure state. Use `$derived` for computed, `$effect` only for true side effects (DOM, third-party non-reactive APIs).

## Work Guidance

- Add a new shared client in `lib/` and export a factory that takes the resolved `AppConfig`. Never import a client at module top-level from a `*.svelte.ts` file that may be evaluated during SSR if the client uses browser-only globals.
- Add new routes as `src/routes/<path>/+page.svelte`. Layouts: `+layout.svelte` files at any depth, invoked via `{@render children()}`.
- Server-only modules (anything reading `$env/dynamic/private`) must use the `.server.ts` suffix. Universal modules must not import from `$env/dynamic/private` — SvelteKit will fail the build.
- The dashboard is the canonical example: it consumes `data.config` for live URLs and renders stack-card links. New pages should follow the same pattern.
- `+layout.svelte` owns the PB and NATS singleton lifecycle (`onMount` connects, returns teardown). Avoid reconnecting elsewhere; reuse the singletons.

## Verification

- `npm run lint` (Prettier + `svelte-check`) from `frontend/`
- `svelte-check` enforces type safety across `*.svelte`, `*.svelte.ts`, `*.ts`
- Manual: `npm run dev` — health pill turns green when backend `/api/health` returns 200; NATS pill turns green when `connectNats` succeeds

## Child DOX Index

None. `lib/` (shared clients) and `routes/` (file-based pages) are sub-areas of the same contract; they do not warrant separate docs.
