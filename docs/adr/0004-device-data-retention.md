# 4. Device data: what is kept, for how long, and what users are told

- Status: accepted
- Date: 2026-10-18
- Decided in: [#62](https://github.com/michaelschoenbaechler/parlwatch/issues/62)

## Context

[ADR 0003](0003-app-backend-contract.md) has the server store, per
installation ID, a push token, a language and the followed topics and federal
businesses. The app has no accounts, and its settings page only says, in
German, that it does no tracking. The full follow state lives on the device,
and the app re-syncs on start once its last sync is older than 24 hours, so
any registration the server loses comes back the next time the app is opened.

## Decision

### What is kept

- A device registers only once it follows something **and** push is allowed.
  When its follows become empty or push permission is revoked, the app sends
  `DELETE`.
- The server keeps the latest registration and a `lastSeenAt` timestamp,
  nothing else. A `PUT` overwrites it; no history of earlier follows, tokens
  or languages is kept.

### For how long

- Deleted at once on `DELETE`, on APNs `410 Unregistered` and on
  `400 BadDeviceToken`.
- Deleted by `nightly` once it has gone 90 days without a successful `PUT`.
- SQLite backups: the last 7 nightly `VACUUM INTO` copies, on the same host,
  overwritten in rotation. No off-host copy. A deleted registration is gone
  from every backup within 7 days.

### Logs

- No access logs: nginx runs with `access_log off` (error log kept), and the
  host's Traefik access log stays off. Rate limiting keeps client IPs in
  memory only.
- `serve`, `nightly` and `send` log counts and errors, never IP addresses,
  push tokens or installation IDs.
- Docker's json-file rotation (10 MB × 3) stays as a backstop.

### What users are told

- **In the app**, in de/fr/it/en: no accounts and no tracking; with follows,
  the push token, language and follows go to the parlwatch server so it can
  notify; registrations not renewed for 90 days are deleted; parliament data
  is loaded directly from parlament.ch. It links to the privacy policy.
- **Privacy policy** at `https://parlwatch.michaelschoenbaechler.ch/privacy`
  in de/fr/it/en, kept in the repo and served by the `files` container. It
  names the controller, the contact `parlwatch@protonmail.com`, Apple (APNs)
  and the hosting provider, what is stored and these retention periods. The
  app settings and App Store Connect link to it.
- **App Store privacy label:** Identifiers → Device ID (installation ID, push
  token) and Other Data (follows, language), for App Functionality only, not
  linked to the user, not used for tracking.
- **Privacy manifest:** a `PrivacyInfo.xcprivacy` with tracking off, no
  tracking domains, and only the required-reason APIs the Capacitor plugins
  declare.

## Consequences

- Deleting is cheap: losing a registration costs at most the pushes until the
  app is next opened. Someone who only reads pushes and never opens the app
  stops getting them after 90 days.
- With no access logs, abuse of `/api/v1/devices` can only be investigated
  from counts, not from IP addresses.
- The privacy policy and label are promises to users and Apple: changing what
  is kept or logged means updating both first.
