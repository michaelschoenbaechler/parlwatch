# 2. Backend hosting and stack: one modular app on an existing VPS

- Status: accepted
- Date: 2026-10-18
- Decided in: [#50](https://github.com/michaelschoenbaechler/parlwatch/issues/50)

## Context

[ADR 0001](0001-backend-shape.md) splits the backend into an always-on `serve`,
a `nightly` job and a `send` job at 08:00, with static JSON snapshots for all
reads. One person maintains it, the proof of concept is Node.js, and more
backend features will follow insights.

## Decision

- **One modular backend, no microservices.** A new workspace `apps/backend` in
  this monorepo, TypeScript on Node 24 LTS. Insights is a module
  (`src/insights/`); later features become modules or entrypoints in the same
  image. The proof of concept in `scripts/insights/` (branch
  `research/poc-findings`) is ported into it.
- **Host:** an existing VPS, as its own Docker Compose project behind the
  host's existing Traefik.
- **State:** SQLite in WAL mode, one file on a volume, backed up nightly with
  `VACUUM INTO`.
- **Snapshots:** `nightly` writes them to a shared volume; a small static file
  container serves them with cache headers and compression. No CDN.
- **Scheduling:** a scheduler container from the backend image runs
  `supercronic` with `TZ=Europe/Zurich`: `nightly` at 02:00, `send` at 08:00.
  The crontab lives in the repo.
- **Build and deploy:** GitHub Actions builds one image on `backend-v*` tags
  and pushes it to GHCR. The Compose file lives in the repo; deploys pull the
  tag and redeploy by hand.
- **URLs** under `https://parlwatch.michaelschoenbaechler.ch/api/v1`:
  - `/devices…` is the push registration shared by all features, routed to
    `serve`.
  - `/<feature>/…`, e.g. `/insights/speaking-time.json`, are static snapshots,
    routed to the file container.
  - Everything outside `/api` stays free.

## Consequences

- No database server and no extra cost; the backend shares a small host's
  CPU and memory with other apps, so jobs must stay light.
- One image to build and deploy; adding a feature never adds a service.
- If the host is down, both reads and push stop until it is back.
- Backend releases are tagged apart from the app's calendar releases.
- Payload shapes and the registration call are left to
  [#51](https://github.com/michaelschoenbaechler/parlwatch/issues/51);
  failure alerting to the ops question on the map.
