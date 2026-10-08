# 1. A nightly insights service next to the app

- Status: proposed
- Date: 2026-10-08

## Context

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
| Lobbywatch | Mandates with remuneration where known, industry (Branche), lobby groups, badge holders | Weekly JSON dump and REST API, CC BY-SA 4.0 (attribution and share-alike apply to what we publish from it) |
| Zutrittsberechtigte (parlament.ch) | Which lobbyists a member gave a badge to | PDF per council, must be parsed |
| EFK Politikfinanzierung | Party and campaign financing, donors above CHF 15'000 | opendata.swiss |
| Fedlex Vernehmlassungen | Who commented on a bill before it reached parliament | Public SPARQL endpoint |
| Commission and Federal Council press releases | Early signals on decisions | RSS |

Zefix/SHAB is left out: the open API only searches by company, not by
person, and matching people by name is error-prone and legally sensitive.

## Decision

Build a separate **insights service** that runs nightly and serves
precomputed results to the app.

- **Hosting:** a Hostinger KVM VPS (not shared hosting: we need cron, a
  long-running worker and Postgres). Postgres with `pgvector` for embeddings.
- **Nightly pipeline:**
  1. Ingest changed rows from `ws.parlament.ch` using `Modified`, plus
     openparldata, Lobbywatch (weekly) and the other sources above.
  2. Topic classification: use `TagNames` as the top level; an LLM assigns a
     fixed, versioned set of subtopics below it, and topics for cantonal
     businesses, which have no official tags. Only new or changed businesses
     are classified, through a batch API.
  3. Speech classification (LLM), per member speech:
     - stance on the motion at hand (for / against / neutral),
     - argument type (facts, costs and finances, sector or group interest,
       cantonal or regional interest, principle, procedure),
     - organisations and sectors named,
     - disclosure of interests and the organisation disclosed.
  4. Engagement per member and topic, combining: committee membership in the
     responsible committee, authored and co-signed proposals, speaking time as
     a member (normalised within the council), and motions filed.
  5. Interest analysis: map paid mandates to sectors (Lobbywatch's Branche),
     businesses to topics, and compare how far members with a paid mandate in
     a sector deviate from **their own parliamentary group** on that sector's
     votes, against group colleagues without one.
- **API:** a small read-only HTTP API for the app; push notifications through
  APNs/FCM for followed topics and watched businesses.

## Consequences

- The app gains a backend to operate, monitor and pay for (VPS plus LLM batch
  costs, which stay low because only changes are processed).
- Classification categories are versioned; changing them means a backfill.
- Results about individual members must show their method and uncertainty
  and must not claim causation. A correlation between mandates and votes is
  not evidence of being bought; wording in the app has to reflect that.
- Lobbywatch data is CC BY-SA 4.0: anything derived from it that we publish
  needs attribution and the same licence.
- `scripts/insights/speaking-time.mjs` is the seed for steps 1, 3 (disclosure
  detection) and 4 (speaking time) and can move into the service.
