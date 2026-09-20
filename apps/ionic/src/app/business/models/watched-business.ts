import { Business, Preconsultation, Resolution, Vote } from 'swissparl';
import { odataList, odataTimestamp } from '@parlwatch/shared/common/models';
import { ParliamentKey } from '@parlwatch/shared/parliament/models';
import { LoadedBusiness } from './cantonal-business';

export type ChangeKind =
  'status' | 'decision' | 'committee' | 'step' | 'vote' | 'document' | 'debate';

export interface BusinessChange {
  kind: ChangeKind;
  /** OData date string. */
  date: string;
  /** What is needed to word the change; empty for counted kinds. */
  value: string;
}

/** Diffable facts of a business, language-neutral so a language switch is not a change. */
export interface BusinessSnapshot {
  modified: string;
  status: string;
  steps: string[];
  votes: number[];
  documents: number[];
  speeches: number;
}

export interface BusinessRef {
  parliament: ParliamentKey;
  id: number;
}

export interface BusinessHead extends BusinessRef {
  modified: string;
  status: string;
}

export interface BusinessHeads {
  heads: BusinessHead[];
  failed: boolean;
}

export interface WatchedBusiness extends BusinessRef {
  title: string;
  shortNumber: string;
  typeName: string;
  followedAt: number;
  modified: string;
  snapshot: BusinessSnapshot;
  changes: BusinessChange[];
  unseen: boolean;
}

export interface WatchCheck {
  at: number;
  ok: boolean;
}

export function isSameBusiness(a: BusinessRef, b: BusinessRef): boolean {
  return a.id === b.id && a.parliament === b.parliament;
}

export function statusKeyOf(business: LoadedBusiness): string {
  return business.cantonal
    ? business.cantonal.statusKey
    : String(business.BusinessStatus ?? '');
}

export function snapshotOf(business: LoadedBusiness): BusinessSnapshot {
  return {
    modified: modifiedOf(business),
    status: statusKeyOf(business),
    steps: stepFacts(business).map((fact) => fact.key),
    votes: voteFacts(business).map((fact) => fact.id),
    documents: documentFacts(business).map((fact) => fact.id),
    speeches: speechCount(business)
  };
}

export function modifiedOf(business: LoadedBusiness): string {
  return business.cantonal
    ? business.cantonal.source.updatedAt
    : (business.Modified ?? '');
}

export function diffBusiness(
  snapshot: BusinessSnapshot,
  business: LoadedBusiness
): BusinessChange[] {
  const changes: BusinessChange[] = [];

  const status = statusKeyOf(business);
  if (status && status !== snapshot.status) {
    changes.push({
      kind: 'status',
      date: business.BusinessStatusDate || modifiedOf(business),
      value: business.BusinessStatusText?.trim() ?? ''
    });
  }

  for (const fact of stepFacts(business)) {
    if (!snapshot.steps.includes(fact.key)) {
      changes.push({ kind: fact.kind, date: fact.date, value: fact.value });
    }
  }

  for (const vote of voteFacts(business)) {
    if (!snapshot.votes.includes(vote.id)) {
      changes.push({ kind: 'vote', date: vote.date, value: '' });
    }
  }

  for (const document of documentFacts(business)) {
    if (!snapshot.documents.includes(document.id)) {
      changes.push({ kind: 'document', date: document.date, value: '' });
    }
  }

  if (speechCount(business) > snapshot.speeches) {
    changes.push({ kind: 'debate', date: modifiedOf(business), value: '' });
  }

  return changes.sort(
    (a, b) => odataTimestamp(b.date) - odataTimestamp(a.date)
  );
}

interface StepFact {
  kind: 'decision' | 'committee' | 'step';
  key: string;
  date: string;
  value: string;
}

function stepFacts(business: LoadedBusiness): StepFact[] {
  if (business.cantonal) {
    return business.cantonal.timeline.map((step) => ({
      kind: 'step',
      key: step.key,
      date: step.date,
      value: withCouncil(step.council, step.text)
    }));
  }
  return [...resolutionFacts(business), ...preconsultationFacts(business)];
}

function resolutionFacts(business: Business): StepFact[] {
  const facts = new Map<string, StepFact>();

  for (const bill of odataList(business.Bills)) {
    for (const resolution of odataList<Resolution>(bill.Resolutions)) {
      if (!resolution.ResolutionDate || resolution.ResolutionId === undefined) {
        continue;
      }
      const key = `resolution-${resolution.ResolutionDate}-${resolution.Council ?? ''}-${resolution.ResolutionId}`;
      facts.set(key, {
        kind: 'decision',
        key,
        date: resolution.ResolutionDate,
        value: withCouncil(
          resolution.CouncilName,
          resolution.ResolutionText?.trim() ?? ''
        )
      });
    }
  }

  return [...facts.values()];
}

function preconsultationFacts(business: Business): StepFact[] {
  const facts = new Map<string, StepFact>();

  for (const row of odataList<Preconsultation>(business.Preconsultations)) {
    if (!row.PreconsultationDate || row.CommitteeNumber === undefined) continue;
    const key = `preconsultation-${row.CommitteeNumber}-${row.PreconsultationDate}`;
    facts.set(key, {
      kind: 'committee',
      key,
      date: row.PreconsultationDate,
      value: row.CommitteeName?.trim() ?? ''
    });
  }

  return [...facts.values()];
}

function withCouncil(council: string | undefined, text: string): string {
  const name = council?.trim();
  return name && text ? `${name}: ${text}` : name || text;
}

function voteFacts(business: LoadedBusiness): { id: number; date: string }[] {
  const votes: Vote[] = business.cantonal
    ? business.cantonal.votes
    : odataList<Vote>(business.Votes);
  return votes
    .filter((vote): vote is Vote & { ID: number } => vote.ID !== undefined)
    .map((vote) => ({ id: vote.ID, date: vote.VoteEnd ?? '' }));
}

function documentFacts(
  business: LoadedBusiness
): { id: number; date: string }[] {
  return (business.cantonal?.documents ?? []).map((document) => ({
    id: document.id,
    date: document.date
  }));
}

function speechCount(business: LoadedBusiness): number {
  return (business.cantonal?.speeches ?? []).reduce(
    (count, group) => count + group.speeches.length,
    0
  );
}
