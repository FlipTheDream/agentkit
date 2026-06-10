# DOX: .github

## Purpose

GitHub Actions CI/CD for the Agentkit monorepo. Lints and tests the Go backend and the SvelteKit frontend, then builds and publishes multi-arch container images to GitHub Container Registry (ghcr.io).

## Ownership

- `workflows/build.yml` — sole workflow, named `Build and Publish`

## Local Contracts

- Triggers:
  - `push` to `main` → lint, test, build, **publish**
  - push of tag matching `v*` → lint, test, build, **publish** (with semver tags)
  - `pull_request` to `main` → lint, test, build, **no push**
- Registry: `ghcr.io`
- Image names:
  - Backend: `ghcr.io/flipthedream/agentkit/backend`
  - Frontend: `ghcr.io/flipthedream/agentkit/frontend`
- Tag strategy (both images): branch ref, PR ref, `vX.Y.Z`, `X.Y.Z`, `X.Y`, and `latest` (only on the default branch).
- Platforms: `linux/amd64,linux/arm64`
- Build context for backend: `./backend`, Dockerfile: `./backend/Dockerfile.prod`
- Build context for frontend: `./frontend`, Dockerfile: `./frontend/Dockerfile.prod`
- Permissions: PR builds skip `docker/login-action`; push builds use `secrets.GITHUB_TOKEN` with `packages: write`.

## Jobs

- `lint-backend` — `golangci-lint-action@v6` with `working-directory: backend`, `--timeout=5m`
- `test-backend` — `go test ./...` in `backend/`
- `lint-frontend` — Node 20, `npm ci`, `npx svelte-kit sync`, `npm run lint` in `frontend/`
- `build-backend` — depends on `lint-backend` + `test-backend`; uses `Dockerfile.prod`; multi-arch; publishes on non-PR
- `build-frontend` — depends on `lint-frontend`; uses `Dockerfile.prod`; multi-arch; publishes on non-PR

## Work Guidance

- Add new services by appending a new `build-<service>` job. The job must depend on the matching lint job and reference the service's `Dockerfile.prod` plus the ghcr.io image path.
- Cache: `cache-from: type=gha` / `cache-to: type=gha,mode=max` — keep these on new jobs to reuse layers.
- The workflow publishes on every push to `main` AND on every `v*` tag. The `latest` tag is gated to the default branch only.
- Do not commit secrets. CI uses `secrets.GITHUB_TOKEN` (auto-provisioned) for ghcr.io; no additional secrets required for the existing images.

## Verification

- Workflow itself: open a PR or push to `main`; all five jobs must pass before a merge.
- A new image is verified by running `docker compose -f docker-compose.deploy.yml up -d` and curling `/api/health` and `/api/config`.

## Child DOX Index

None.
