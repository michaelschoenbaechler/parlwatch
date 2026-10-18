# 1. Insights service: a small registration API, static snapshots and two scheduled jobs

- Status: accepted
- Date: 2026-10-18
- Decided in: [#49](https://github.com/michaelschoenbaechler/parlwatch/issues/49)

## Context

The first slice of insights pushes changes to followed federal businesses and
sends a daily **topic digest** at 08:00 Swiss time
([#47](https://github.com/michaelschoenbaechler/parlwatch/issues/47)). Push goes
through APNs with the device token as the only identity
([#46](https://github.com/michaelschoenbaechler/parlwatch/issues/46)), and
background fetch is too unreliable for alerts. So a server has to know each
device token and its follows: a static nightly build alone cannot do it.

Speaking time, disclosures and the list of newly submitted businesses change at
most once a night and are the same for every user.

## Decision

The server holds state: device tokens and their follows. One codebase has three
entrypoints:

- **`serve`**: always on, tiny. Only registers and unregisters a device token
  with its follows. It serves no reads.
- **`nightly`**: runs to completion. Ingests changes, writes the **static JSON
  snapshots** the app reads (speaking time, disclosures, the topic digest list
  of new businesses grouped by topic), and stores the **pending notifications**
  for the day.
- **`send`**: runs to completion at 08:00 Swiss time. Delivers pending
  notifications through APNs and marks each as sent.

Everything the app reads is a static file with cache headers; the app filters
the digest list by its own followed topics. `send` delivers only what a
finished `nightly` run produced: if that run is late or failed, nothing is
pushed that day and the changes go out with the next run.

Cantonal follows keep today's on-device check and have no push.

## Consequences

- Reads keep working while the database or `serve` is down, and cost almost
  nothing to serve on a small shared host.
- A crash or hang in ingest cannot take registration down; a failed job can be
  re-run by hand, and re-running `send` does not double-send.
- A night's notifications can be inspected before 08:00.
- Personal data is limited to device tokens and follows, held by `serve`'s
  store; what is kept and for how long is still open.
- How the jobs are triggered and where files and state live is left to
  [#50](https://github.com/michaelschoenbaechler/parlwatch/issues/50); snapshot
  shapes, versioning and the registration call to
  [#51](https://github.com/michaelschoenbaechler/parlwatch/issues/51).
