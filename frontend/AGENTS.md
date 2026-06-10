# DOX: frontend

## Purpose

SvelteKit 5 + TypeScript dashboard. Resolves backend URLs at runtime from `/api/config`, mounts shared clients (PocketBase SDK, NATS WebSocket), and renders a starter dashboard.

## Ownership

- `package.json` / `package-lock.json` — `agentkit-frontend`, ESM, npm scripts `dev` / `build` / `preview` / `lint` / `format`
- `svelte.config.js` — `adapter-node` for production, `csrf.checkOrigin: false` (backend has its own auth)
- `vite.config.ts` — Vite dev server on `0.0.0.0:5173` with polling watch (works inside Docker volume mounts)
- `tsconfig.json` — strict TS, extends `.svelte-kit/tsconfig.json`
- `Dockerfile` (target `dev`) — `node:20-alpine`, `npm run dev -- --host 0.0.0.0`
- `Dockerfile.prod` (target `runner`) — multi-stage `vite build`, runs `node build` on port 3000
- `src/` — client code (see `src/AGENTS.md`)

## Local Contracts

- Production adapter: `@sveltejs/adapter-node`. Image runs `node build` on port `3000` (overridable via `PORT`).
- Dev port: `5173`; production port: `3000`.
- CSRF: `kit.csrf.checkOrigin: false`. Cross-origin browser → backend calls are explicitly allowed; the backend authenticates separately.
- Vite dev: `host: '0.0.0.0'`, `usePolling: true` for file watch (required for Docker volume mounts).
- Env vars: `PUBLIC_POCKETBASE_URL`, `PUBLIC_NATS_WS_URL` are build-time fallbacks. The browser fetches live values from `/api/config`; SSR uses `INTERNAL_POCKETBASE_URL` (docker DNS, default `http://backend:8090`). `ORIGIN` is the trusted origin for production CSRF.

## Work Guidance

- Use Svelte 5 runes (`$state`, `$derived`, `$effect`) for all component state. Do not use stores.
- Add new pages under `src/routes/<path>/+page.svelte` (file-based routing). Layouts: `+layout.svelte` wrapping child routes with `{@render children()}`.
- All shared clients live in `src/lib/`. Never instantiate `PocketBase` directly in components; use `getPbFromConfig(data.config)`.
- Server-only code (anything that reads `INTERNAL_POCKETBASE_URL` or other private env) must live in `*.server.*` files. Universal modules must not import `$env/dynamic/private`.
- Formatting: Prettier (Svelte plugin). Run `npm run format` before pushing.
- Do not commit `node_modules/`, `.svelte-kit/`, `build/`, `.output/`, `.vite/`.

## Verification

- `npm run lint` (Prettier check + `svelte-check`) — CI job `lint-frontend`
- Type-check is part of `npm run lint` via `svelte-check`
- Manual: `npm run dev` and visit `http://localhost:5173`

## Child DOX Index

- `src/` — client code: `lib/` shared clients and `routes/` SvelteKit routes
