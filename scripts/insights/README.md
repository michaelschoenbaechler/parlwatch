# Insights proof of concept

Scripts that try out the nightly insights service proposed in
[ADR 0001](../../docs/adr/0001-insights-backend-service.md). They only read
public data from `ws.parlament.ch` and Lobbywatch and need nothing but Node.js.

## Speaking time

For one session: how long each council member spoke on which business, their
paid mandates on the business's topics, and the speeches in which they
disclose their interests.

Mandates come from the weekly [Lobbywatch export](https://lobbywatch.ch/datenexport/)
(CC BY-SA 4.0, credit Lobbywatch.ch). The script downloads it (4 MB) into
`--out` and reuses it for a day; `--no-lobbywatch` falls back to the official
register, which only says paid or unpaid. Lobbywatch adds the interest group
and branch of each organisation, the yearly compensation where known, and
mandates missing from the official register. Members are matched on
Lobbywatch's `parlament_biografie_id`, which is the parliament's
`PersonNumber`.

A mandate counts as touching a business when one of its interest groups maps
to one of the business's official topics (`TagNames`); see `BRANCH_TOPICS`
and `GROUP_TOPICS` in `lobbywatch.mjs`. That match is coarse: it shows where
to look, not that a member was affected.

```bash
node scripts/insights/speaking-time.mjs                  # latest session
node scripts/insights/speaking-time.mjs --session 5215   # a given session
node scripts/insights/speaking-time.mjs --top 30 --out ./insights-out
node scripts/insights/speaking-time.mjs --no-lobbywatch  # official register only
```

Writes `speaking-time-<session>.md` (report) and `.json` (all members) to
`--out` (default `insights-out/`, ignored by git). A session takes about 20
seconds.

Tests for the parsing helpers:

```bash
node --test scripts/insights/speaking-time.test.mjs scripts/insights/lobbywatch.test.mjs
```
