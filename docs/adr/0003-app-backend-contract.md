# 3. Contract between the app and the backend

- Status: accepted
- Date: 2026-10-18
- Decided in: [#51](https://github.com/michaelschoenbaechler/parlwatch/issues/51)
- Speaking time decided in: [#48](https://github.com/michaelschoenbaechler/parlwatch/issues/48)

## Context

[ADR 0001](0001-backend-shape.md) has the app read static snapshots and
register for push with `serve`; [ADR 0002](0002-backend-hosting-and-stack.md)
puts both under `https://parlwatch.michaelschoenbaechler.ch/api/v1`. The app
has its own language setting (de, fr, it, en), identifies topics by numeric tag
`ID`, and keeps cantonal follows on the device.

## Decision

### Registration

- A device is keyed by an **installation ID**: a UUID the app generates once
  and keeps. The APNs token is a field, so rotation is an update and tokens
  stay out of URLs.
- `PUT /api/v1/devices/{installationId}` carries the whole state:
  `{ token, language, topics: [tagId…], businesses: [businessId…] }`.
  Only federal business IDs are sent. `DELETE` on the same path unregisters.
- The app sends it after every follow change, when the token or language
  changes, and on start when the last successful sync is older than 24 hours.
  A failed call is retried on the next start.
- The server drops a device when APNs answers `410 Unregistered`.
- No auth. Installation IDs must be UUIDs, topics must be known tag IDs, at
  most 28 topics and 100 businesses, and Traefik rate-limits `/api/v1/devices`.

### Push

- The server words each push in the registered language and falls back like
  the app does when a business title is missing in that language.
- Custom data routes the tap: `{ kind: 'business', id }` opens the business,
  `{ kind: 'businesses' }` (the summary for more than 3 changed businesses)
  opens the following list, `{ kind: 'digest', date }` opens that day's topic
  digest list. No badge.

### Snapshots

- Topic digest: `/api/v1/insights/digest/{YYYY-MM-DD}.json`, one file per day
  shared by all users:
  `{ date, generatedAt, businesses: [{ id, shortNumber, tagIds, submittedAt, title: { de, fr, it } }] }`.
  The app filters by its own topics and groups by topic; details still load
  from OData. Days with nothing new have no file. Files are kept 30 days.
- Speaking time: `/api/v1/insights/speaking-time/{businessId}.json`, one file
  per federal business debated in the current legislature:
  `{ businessId, since, generatedAt, provisional, councils: { N: [member…], S: [member…] } }`
  with `member = { personNumber, name, parlGroup, canton, seconds }`.
  `since` is the first day of the legislature (`2023-12-04`). Only members
  speaking for themselves count (`Function` `Mit-*`); a speech on an agenda
  item covering several businesses is split evenly between them. Each list
  is sorted by `seconds`, longest first, and a council nobody spoke in is an
  empty list. A business without member speeches in the legislature has no
  file, and the app hides the card.
- Every snapshot carries `generatedAt`, and `provisional: true` where its
  numbers rest on sessions that are not final yet.
- Served with `Cache-Control: no-cache` and an `ETag`.
- The version lives in the path. Additive fields keep `/v1`; a breaking change
  publishes `/v2` next to `/v1` until old app versions are gone.

## Consequences

- The server can never drift from the device: each sync replaces the whole
  follow set.
- A language switch in the app resends the registration.
- Speaking time is only shown on the business page, so it is cut per
  business. Rankings across a council would need another file.
- Detected disclosures are not part of the contract; they were dropped from
  the first slice in [#48](https://github.com/michaelschoenbaechler/parlwatch/issues/48).
- How long a device registration is kept is decided in [ADR 0004](0004-device-data-retention.md).
