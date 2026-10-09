# When are transcripts final, and can `Modified` drive incremental ingest?

Research for [#45](https://github.com/michaelschoenbaechler/parlwatch/issues/45).
It informs
[Running service or static nightly build?](https://github.com/michaelschoenbaechler/parlwatch/issues/49).
Measured against the live `https://ws.parlament.ch/odata.svc` on 2026-10-09,
one week after the Herbstsession 2026 (5215) ended on 2026-10-02.

## Answer

- **Transcripts are published during the session and change for weeks after
  it.** The legal process has speakers correct their text within three working
  days. The API then keeps a session in `draft` and marks it `final` about
  3 to 7 weeks after the session ends. Even after that, whole meeting days are
  republished months or years later.
- **The status lives on `Meeting.PublicationStatus` (`draft` / `final`),
  not on `Transcript`.** This is the signal to use for "is this number
  settled".
- **`Modified` can be filtered and works as a "maybe changed" cursor for
  `Transcript`, `Business`, `Subject`, `Meeting` and `PersonInterest`.** It is
  not a "content changed" signal: 72 % of all transcripts have a 2026
  timestamp. **It does not work for `SubjectBusiness`, and `Vote`/`Voting`
  have no `Modified` field at all.**
- **Consequence for the nightly job:** it can run incrementally, as long as it
  (a) pulls by `Modified` with an overlap window, (b) hashes the text and only
  reclassifies rows whose content changed, (c) fetches `SubjectBusiness` by
  `IdSubject` and votes by `IdSession`, never by `Modified`, and (d) labels
  speaking time and disclosures as provisional while the meeting is `draft`.

## Publication timeline

### Legal basis

ParlVV ([SR 171.115](https://www.fedlex.admin.ch/eli/cc/2003/512/de), as of
2025-12-01):

- Art. 1 Abs. 2: the Amtliches Bulletin is "fortlaufend in elektronischer Form
  veröffentlicht"; a printed edition follows each session.
- Art. 2: speakers receive their transcript and may make formal corrections;
  material corrections are not allowed. Without corrections within **three
  working days** of receipt, the text counts as approved.

The Parlamentsdienste
([Aufgaben und Arbeitsweise des Amtlichen Bulletins](https://www.parlament.ch/de/ratsbetrieb/amtliches-bulletin/amtliches-bulletin-erklärt))
say that speeches are transcribed immediately and that the texts are
published promptly and updated continuously. They name no delay and no
"final" date. The [open data page](https://www.parlament.ch/de/%C3%BCber-das-parlament/fakten-und-zahlen/open-data-web-services)
documents neither update frequency nor what `Modified` means.

### What the API shows

`Meeting` has `PublicationStatus` and `Modified`
([`$metadata`](https://ws.parlament.ch/odata.svc/$metadata)). All 34 meetings
of 5215 are `draft`. Each `Meeting` row was created on its session day, for
example NR meeting 1 on 2026-09-14 with `Modified` 20:53. So the meeting, and
with it the transcript, appears the same day.

Every earlier session is `final`. The last `Meeting.Modified` (normally the
flip to `final`) falls this many days after the session's `EndDate`:

| Session | End | min | median | max |
|---|---|---|---|---|
| 5214 Sommersession 2026 | 2026-06-19 | 20 | 30 | 34 |
| 5213 Sondersession 2026 | 2026-04-30 | 13 | 17 | 19 |
| 5212 Frühjahrssession 2026 | 2026-03-20 | 19 | 27 | 30 |
| 5211 Wintersession 2025 | 2025-12-19 | 38 | 45 | 50 |
| 5210 Herbstsession 2025 | 2025-09-26 | 24 | 47 | 49 |
| 5209 Sommersession 2025 | 2025-06-20 | 25 | 35 | 234 |
| 5207 Frühjahrssession 2025 | 2025-03-21 | 19 | 35 | 395 |
| 5206 Wintersession 2024 | 2024-12-20 | 16 | 40 | 45 |

For 5214 the Ständerat days were finalised on 07-09 to 07-16 and the
Nationalrat days on 07-17 to 07-23: Ständerat first, then the Nationalrat,
one meeting day after another.

`Transcript.Modified` only holds the last write, so it cannot show when a
speech *first* appeared. For 5215, every row has been rewritten 3 to 23 days
after its session day (per-day `Modified` between 09-26 and 10-09). On
2026-10-09, rows were still being rewritten, but two snapshots taken four
minutes apart showed no change.

### Rewrites after `final`

Transcripts of final sessions keep getting new `Modified` values, one whole
subject or meeting day at a time:

- 5214 (final since July): rows rewritten on 07-29, 09-16, 09-18, 09-23,
  10-01 and 10-02.
- 5210 (Herbstsession 2025): rows rewritten in 2025-11, 2025-12, 2026-03,
  2026-04, 2026-06, 2026-09 and 2026-10.
- On 2026-10-02 alone, 8640 DE transcripts from 19 sessions were rewritten,
  back to session 5017. They carry 8057 distinct timestamps (rows were written
  one by one, not in a single bulk `UPDATE`).
- `Transcript` count with `Modified gt 2026-01-01`: 251,345 of 350,775 DE
  rows. `Business`: 16,026 of 68,813.

The API keeps no history, so we cannot see whether these rewrites change
`Text`, `Start` or `End`. A rewrite bumps `Subject.Modified` in step with
`Transcript.Modified` (same timestamp to the millisecond), which suggests the
whole subject is re-exported.

## Can `Modified` drive incremental ingest?

### Filtering works

- `$filter=Language eq 'DE' and Modified gt datetime'2026-10-08T00:00:00'`
  works on `Transcript` (1852 rows), `Business` (229) and `SubjectBusiness`,
  and also with `$orderby=Modified,ID`.
- Use `/$count` for counting. `$inlinecount=allpages` with such a filter
  returns a server error (`EntityCommandExecutionException`).
- **Timezone:** `Modified` is Swiss local time serialised as if it were UTC.
  At 19:19 UTC the newest row read `/Date(1791575416377)/` =
  "2026-10-09T19:50:16Z", which is still in the future in UTC. The filter
  literal is compared in the same local frame. `Transcript.Start` is a real
  UTC instant: it matches `StartTimeWithTimezone`. Store the raw `Modified`
  value as the cursor and compare in local time. Use an overlap (e.g. re-read
  the last 24 h) to survive the DST fall-back hour and rows that commit late.

### Per entity

| Entity | `Modified`? | Usable as a cursor? |
|---|---|---|
| `Transcript` | yes | Yes, as "maybe changed". Rewrites are frequent, so hash `Text`/`Start`/`End` and reprocess only real changes. |
| `Subject`, `Meeting` | yes | Yes. `Meeting` also carries `PublicationStatus`. |
| `Business` | yes | Yes. In all 876 businesses debated in 5215, `Modified ≥ BusinessStatusDate`, so status changes bump it. |
| `SubjectBusiness` | yes | **No.** 427 of 973 links for 5215 subjects have a `Modified` from before the session (back to 2015). The value tracks the business's agenda record, not the creation of the link. Fetch by `IdSubject` of new or changed transcripts, as `speaking-time.mjs` already does. |
| `Vote`, `Voting` | **no** | Filtering by `Modified` raises an error. Fetch by `IdSession` (or `VoteEnd`) for open sessions. Votes are there on the day: the last 5215 vote has `VoteEnd` on 2026-10-02. |
| `PersonInterest` | yes | It works, but the table is small (1994 DE rows), so refetch it fully every night. That also catches deletions. |

`Modified` never shows **deletions**. A row that vanishes leaves no trace in a
`Modified gt …` query. For transcripts of draft meetings, re-reading by
`IdSession` reconciles them.

## Recommendations for the nightly job

1. Keep a per-entity cursor on the raw `Modified` value. Each night, query
   `Modified gt cursor − 24h` for `Transcript`, `Subject`, `Meeting` and
   `Business`.
2. For each changed transcript, compare a hash of `Text`, `Start`, `End` and
   `Function`. Recompute speaking time on any change. Run the LLM speech
   classification only when `Text` changed, so bulk republishing does not
   drive batch costs up.
3. Fetch `SubjectBusiness` by `IdSubject` for every new or changed subject,
   and votes by `IdSession` while a session is `draft`.
4. As long as any `Meeting` of a session is `draft`, fully re-sync that
   session's transcripts nightly. This is cheap (about 4k rows) and catches
   deletions.
5. In the app, show speaking time and disclosures as **provisional** until
   the session's meetings are `final`, which is typically 3 to 7 weeks after
   the session ends. After that, changes are rare but not impossible.
6. Open question, worth a cheap experiment: do `draft` → `final` and the later
   rewrites actually change `Text`, `Start` or `End`? Snapshot 5215 nightly
   (ID, `Modified`, hash of `Text`, `Start`, `End`) until it is final, and
   diff the snapshots. That measures how stale provisional numbers really are.
