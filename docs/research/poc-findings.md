# What public data and the proof of concept show

Findings from the speaking time proof of concept (`scripts/insights/`), checked against `ws.parlament.ch` and the Lobbywatch export of 08.10.2026. Charted in the map [Insights: first slice](https://github.com/michaelschoenbaechler/parlwatch/issues/44).

## Why insights need more than the app

The app talks to `ws.parlament.ch` and `api.openparldata.ch` directly from the
client. That is enough for browsing, but not for three features we want:

1. **Follow topics.** Users pick topics and see (and get notified about) new
   and changed businesses in them.
2. **Paid interests and voting.** Show, per council member, how their paid
   mandates relate to what they speak about and how they vote.
3. **Speech analysis.** Measure how much a member engages with a business and
   classify what their speeches argue.

All three need data joined across many requests, computed once and kept,
which a phone cannot do on every launch. Push notifications also need a
server that notices changes while the app is closed.

### What the public data already gives us

Checked against `ws.parlament.ch/odata.svc` for the Herbstsession 2026
(session 5215) with `scripts/insights/speaking-time.mjs`:

| Need | Source | Finding |
|---|---|---|
| Topics per business | `Business.TagNames` | 28 official topics, several per business (`Wirtschaft\|Umwelt\|Landwirtschaft`). Good enough for "follow a topic" without any LLM. |
| Paid mandates | `PersonInterest.Paid` | Paid yes/no per mandate. **No amounts.** |
| Occupation | `PersonOccupation` | Occupation and employer with dates. |
| Speaking time | `Transcript.Start` / `End` | Millisecond timestamps per speech. 3326 speeches in the session, none without a usable duration. Words per minute come out at about 123 in both councils, so the timestamps measure actual speech. |
| Speaker role | `Transcript.Function` | `Mit-*` member, `*` commission rapporteur, `P-*`/`1VP-*`/`2VP-*` chair, `BR-*`/`BPR-*`/`VPBR-*`/`BK-*` government. Parliamentary group speakers are **not** marked. |
| Speech → business | `SubjectBusiness` | `Transcript.IdSubject` maps to one or more businesses. |
| Votes | `Voting` | Every member's decision on every vote, with their parliamentary group. |
| Authored proposals | `BusinessRole` | Who submitted or co-signed a business. |

Findings from the proof of concept:

- **Speaking time must be compared within one council.** The Ständerat has no
  speaking time limit: a member's speech averages 264 s there against 134 s in
  the Nationalrat. A shared ranking only lists Ständerat members.
- **Only about half of the session's speaking time is members speaking for
  themselves** (4063 of 8006 minutes); rapporteurs, the chair and the Federal
  Council take the rest and must be excluded from any engagement score.
- **Disclosures are detectable.** Art. 11 Abs. 3 ParlG requires members to
  disclose their interests when speaking on an affected business. A handful of
  German and French regular expressions found 26 disclosures in the session,
  all but one of them genuine ("Ich habe keine Interessenbindung zu melden" is a
  disclosure of none). An LLM is needed to extract *which* organisation was
  named, not to find the sentence.

### Other public sources worth crawling

| Source | Adds | Access |
|---|---|---|
| Lobbywatch | See below | Weekly export (CSV, JSON, SQL), REST, GraphQL, SPARQL; CC BY-SA 4.0 |
| Zutrittsberechtigte (parlament.ch) | Which lobbyists a member gave a badge to | PDF per council, must be parsed |
| EFK Politikfinanzierung | Party and campaign financing, donors above CHF 15'000 | opendata.swiss |
| Fedlex Vernehmlassungen | Who commented on a bill before it reached parliament | Public SPARQL endpoint |
| Commission and Federal Council press releases | Early signals on decisions | RSS |

Lobbywatch, checked against the export of 08.10.2026 (now read by the proof
of concept):

- Join key: Lobbywatch's `parlament_biografie_id` is the parliament's
  `PersonNumber`; 232 of the 243 speakers of session 5215 match (the others
  are mostly Federal Councillors).
- Compensation per mandate and year (`interessenbindung_jahr.verguetung`:
  below 0 paying member, 0 unpaid, 1 paid with unknown amount, above 1 CHF per
  year). For 2026, 377 of 1097 paid mandates carry an amount.
- 738 mandates that must be declared but are missing from the official
  register, found by Lobbywatch, mostly in the commercial register.
- 139 interest groups in 14 branches; the organisation of 6939 of 7580
  mandates has a group. The broad branches (Wirtschaft has 37 groups) need a
  group-level mapping to parliament topics.
- 368 badge holders and their 2070 mandates.
- Terms (Merkblatt zu den Lobbywatch-Daten): credit Lobbywatch; share-alike
  applies when Lobbywatch is the main source, which it is for the interest
  analysis. Historical data is not CC BY-SA and needs consent. They ask to be
  told the project's start and expected end and welcome results they can
  integrate. No partnership is required, but we should contact them before
  launch.

Zefix/SHAB is left out: the open API only searches by company, not by
person, and matching people by name is error-prone and legally sensitive.
