# 2. LLM classification of businesses, speeches and mandates

- Status: idea (brainstorming, nothing built)
- Date: 2026-10-08
- Builds on: [ADR 0001](0001-insights-backend-service.md)

This records the ideas from a brainstorming session on how the insights
service of ADR 0001 could use a large language model. It is a design sketch to
think with, not a plan to build yet.

## Context

The proof of concept (`scripts/insights/`) joins speeches, businesses and
mandates without any LLM. It showed where rules work and where they stop:

- **Rules are enough** for speaking time, speaker roles (`Transcript.Function`)
  and for *finding* disclosures of interests: a handful of German and French
  regular expressions found 26 in the Herbstsession 2026, 25 of them genuine.
- **Rules are too coarse** for deciding whether a mandate touches a business.
  Matching Lobbywatch branches to the official `TagNames` flagged 417 speeches
  "with a paid mandate on the topic and no disclosure"; mapping the interest
  groups of the broad branches by hand cut that to 305, but a bank mandate
  still "touches" every finance bill, whatever the bill does.
- **Rules cannot read** what a speech argues, which proposal it supports, or
  which organisation a disclosure names.

## Ideas

### 1. One shared topic taxonomy

Businesses, organisations and user interests are classified into the same
taxonomy, so they can be joined.

- Use the codebook of the **Comparative Agendas Project (CAP)**: about 20 major
  topics and a little over 200 subtopics, already used for Switzerland.
  Validated by political scientists, comparable with research, and we do not
  have to defend categories we made up.
- The 28 official `TagNames` stay the top level shown in the app; CAP
  subtopics sit below them.
- The taxonomy carries a version. Changing it means reclassifying everything
  classified under the old version.
- **Following a topic in free text** ("alles zu Velowegen"): the LLM maps the
  user's words to taxonomy subtopics once. No embedding model and no vector
  database are needed, which keeps the VPS small. (This would replace the
  `pgvector` idea in ADR 0001.)

### 2. Classify once, join in code

The LLM is not asked "does X's mandate touch business Y?" for every pair.
Instead:

1. **Organisations** with a paid mandate of a current member (about 1100) are
   classified into the taxonomy once, and again only when the weekly
   Lobbywatch export changes them.
2. **Businesses** are classified into the taxonomy once, when they are new or
   changed.
3. **Code joins** the two. Every match is explainable: "the mandate is
   subtopic A, the business is subtopic A".
4. Only for these candidates does the LLM judge **direct affectedness** in the
   sense of Art. 11 Abs. 3 ParlG, in three levels:
   - *direct*: the organisation is regulated, funded or burdened by this
     business specifically;
   - *indirect*: its branch is affected, the organisation not in particular;
   - *none*.

   It answers with a reason and a verbatim quote from the business text
   (submitted text of a proposal, summary of the Federal Council's message).
   That is a few hundred pairs per session, not tens of thousands.

### 3. Speech classification per debate

One request holds all speeches on one business in one council on one day. The
longest debate of the Herbstsession 2026 (Inklusions-Initiative, about 446
minutes) is roughly 80,000 tokens, well within a 1M-token context window.

Per debate rather than per speech, because a stance only makes sense in
context: "I support minority Glarner" needs the list of proposals, which is in
the chair's speeches. The proof of concept filters the chair out; here those
speeches are passed as context, not classified.

Fields per speech, returned through structured outputs (a JSON schema):

| Field | Values | Source |
|---|---|---|
| Role | member, parliamentary group speaker, rapporteur, Federal Council | `Function` from the data; the LLM only spots group speakers ("au nom du groupe…"), which the data does not mark |
| Supported proposal | majority, minority I/II/…, individual proposal, Federal Council, unclear | LLM |
| Argument types (several, one primary) | effect/facts, costs/finances, economy/competition, affected group or branch, canton/region, principle/values (federalism, sovereignty, liberty, solidarity), law/constitution, procedure/tactics, personal experience | LLM |
| Organisations named | name, matched to Lobbywatch organisations | LLM extracts, code matches |
| Disclosure | yes / no / "no interests", plus the organisation named | regex finds the sentence, LLM reads the organisation |
| Evidence quote per field | verbatim excerpt from the speech | LLM |

**Evidence quotes are the main safeguard.** Code checks that each quote occurs
verbatim in the speech and drops the classification if it does not. That
catches invented reasons, and every label shown in the app is backed by a
sentence the member actually said. (The API's built-in citations cannot be
combined with structured outputs, hence the check in code.)

Speeches are in German, French and Italian. Labels are language-neutral enums;
quotes stay in the original language.

Optional, later: the quality of justification, e.g. with the Discourse Quality
Index, which was applied to Swiss parliamentary debates among others.

### 4. Compare what members say with how they vote

`Voting` holds every member's vote. If the LLM identifies the proposal a
speech supports, code can join it to the vote on that proposal:

- **"Speaks for it, votes against it"** becomes a fact that can be checked,
  with no judgement by the LLM.
- It is **free quality control**: where most speeches and votes disagree, the
  classification is usually wrong.

Not verified yet: whether the vote data names the proposals (majority,
minority, article) clearly enough for this join. The idea depends on it.

### 5. Quality: no test set, no feature

- **A hand-labelled test set** of 200 to 300 speeches from several sessions and
  all three languages, labelled independently by two people. Their agreement
  is measured; the LLM has to agree with them at least as well as they agree
  with each other before a field goes into the app.
- **Free labels** from the data itself: disclosures from the regular
  expressions, roles from `Function`, stances from the votes.
- **Every result is stored with its provenance**: model, prompt version,
  taxonomy version and a hash of the input text. When one of them changes,
  exactly the affected results are reclassified.

### 6. Nightly pipeline

```
Night 1:  fetch new and changed speeches (Modified)
          → group into debates → submit a batch to the LLM API
Night 2:  collect batch results (usually done within an hour, guaranteed within 24 h)
          → check schema and evidence quotes → store
          → join mandates and businesses (code) → submit candidates for the affectedness check (next batch)
          → review queue for sensitive cases → API for the app
```

- The batch API halves the price; results arrive asynchronously, which suits
  a nightly job.
- Prompt caching: keep the system prompt and taxonomy byte-identical across
  requests and submit the speeches of one debate together.
- Automatic fallback to another model after a refusal is not available in
  batches. Refused requests (`stop_reason: "refusal"`) are retried
  individually; rare for parliamentary speeches, but the pipeline has to
  handle them.

### 7. Model choice and cost

Rough estimate per session, with batch pricing (half of list price), list
prices as of October 2026 for the current Claude generation.

Assumptions: 3326 speeches, about 2350 of them classified (the chair is
context only); about 8000 minutes of speech, about 1.5M tokens of text; with
system prompt, taxonomy and business text about 3.5M input tokens; about 1M
output tokens including thinking at low effort. To be confirmed with token
counting on a real session.

| Model class | List price input / output per 1M tokens | Per session (batch) |
|---|---|---|
| Opus (largest) | $4 / $20 | ~$17 |
| Sonnet (mid) | $2 / $10 | ~$9 |
| Haiku (small) | $0.10 / $0.50 | < $1 |

Prompt caching lowers this further. Organisations and businesses cost next to
nothing. A backfill to 2015 (about 45 sessions) would cost about $800 once
with the largest model.

The amounts are small whichever model is used, so the choice should follow
quality: start with the largest model, then measure on the test set whether a
smaller one holds up per field. Reading the organisation out of a disclosure is
easy; telling argument types apart is not. Different models per field are
possible.

### 8. What goes into the app

- **First:** following topics, speaking time (per council, members only),
  disclosures, and speech versus vote.
- **Later, after review and after talking to Lobbywatch:** affectedness of
  mandates.
- "No disclosure despite direct affectedness" is published **only after a
  human has reviewed it**, and worded as a missing note, never as a breach:
  Art. 11 Abs. 3 ParlG only requires the note when a member is directly
  affected, and it may have been given in committee or in an earlier speech.
- **Right of reply:** Lobbywatch has members authorise their data (the
  `autorisiert_datum` field in its export). A similar step for sensitive
  statements would be fair and protects the app.
- Everything built mainly on Lobbywatch data is published under CC BY-SA 4.0
  with attribution (see ADR 0001).

## Open questions

1. **Law.** Political opinions are sensitive personal data under the Swiss
   Data Protection Act (nDSG), and automated assessment of council members
   may count as high-risk profiling. That members act in a public role helps;
   it still needs a legal check before launch.
2. **Vote data.** Can votes be joined to the proposal a speech supports
   (idea 4)?
3. **Lobbywatch.** Contact them before launch: they ask to be told about
   projects, welcome results they can integrate, and must consent to any use
   of historical data. Mandates in the public export are current only, so
   older sessions are matched against today's mandates until then.
4. **Timing.** How soon after a session day are transcripts published and
   final? This decides when the nightly job can classify them.
5. **Cantonal parliaments.** Businesses from openparldata can be classified
   the same way (they have no official topics, so the LLM adds the most there).
   Whether cantonal speeches are available at all is not checked.
6. **Group speakers.** Is LLM detection reliable enough to separate group
   speakers from members speaking for themselves in engagement scores?

## Consequences if pursued

- The insights service gets an LLM stage with its own versioning, test set
  and review queue; the review queue needs a person.
- LLM cost is minor; the real cost is building and maintaining the test set.
- Wording in the app and a legal check become prerequisites for publishing
  anything about individual members.
