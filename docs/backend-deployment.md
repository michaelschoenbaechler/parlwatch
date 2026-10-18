# Backend deployment

The backend runs as its own Docker Compose project (`parlwatch`) on an
existing VPS, behind the host's shared Traefik
([ADR 0002](adr/0002-backend-hosting-and-stack.md)). The Compose file is
[`apps/backend/deploy/compose.yaml`](../apps/backend/deploy/compose.yaml).

## Routing

Base URL: `https://parlwatch.michaelschoenbaechler.ch/api/v1`

| Path | Router | Container | Notes |
|---|---|---|---|
| `/api/v1/devices…` | `parlwatch-devices` (priority 200) | `serve`, port 3000 | Path passed through unchanged; rate-limited to 10 requests a minute per client IP (burst 20) |
| every other `/api/v1/…` | `parlwatch-files` (priority 100) | `files` (nginx), port 80 | `/api/v1` stripped; serves the `snapshots` volume |
| everything else | none | — | Traefik answers 404 |

The host's Traefik provides:

- Docker provider with `exposedbydefault=false`, so each routed container sets
  `traefik.enable=true`.
- Entrypoint `websecure` (`:443`); `web` (`:80`) redirects to HTTPS.
- Certificate resolver `letsencrypt` (HTTP challenge).
- Host networking, so it reaches containers on the project's default network;
  no shared network is needed.

Snapshots are written to the `snapshots` volume (`parlwatch_snapshots`), with
paths relative to `/api/v1`: `insights/speaking-time.json` is served at
`/api/v1/insights/speaking-time.json`. nginx adds
`Cache-Control: no-cache` with an `ETag`, so the app revalidates each night's files, and gzips JSON.

## Placeholder state

Until `apps/backend` exists, `serve` is `traefik/whoami` on port 3000. The
volume holds `placeholder.json`, served at `/api/v1/placeholder.json`.

When the backend image ships:

1. Replace the `serve` image with the GHCR backend image. Keep the labels and
   port 3000, or update `loadbalancer.server.port`.
2. Add the scheduler service from the same image (no Traefik labels). It mounts
   `snapshots` read-write and the SQLite volume.
3. Delete `placeholder.json` from the volume.

## Deploying

Copy `compose.yaml` and `nginx.conf` to `/docker/parlwatch/` on the host, then:

```bash
docker compose -f /docker/parlwatch/compose.yaml up -d
```
