# Insights proof of concept

Scripts that try out the nightly insights service proposed in
[ADR 0001](../../docs/adr/0001-insights-backend-service.md). They only read
public data from `ws.parlament.ch` and need nothing but Node.js.

## Speaking time

For one session: how long each council member spoke on which business, their
paid interests, and the speeches in which they disclose their interests.

```bash
node scripts/insights/speaking-time.mjs                  # latest session
node scripts/insights/speaking-time.mjs --session 5215   # a given session
node scripts/insights/speaking-time.mjs --top 30 --out ./insights-out
```

Writes `speaking-time-<session>.md` (report) and `.json` (all members) to
`--out` (default `insights-out/`, ignored by git). A session takes about 20
seconds.

Tests for the parsing helpers:

```bash
node --test scripts/insights/speaking-time.test.mjs
```
