// PROTOTYPE for #48 (where speaking time and disclosures appear). Throwaway.
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

export type ProtoBusiness = {
  id: number;
  shortNumber: string;
  title: string;
};

export type ProtoDisclosure = {
  transcriptId: number;
  date: string;
  business: ProtoBusiness | null;
  text: string;
};

export type ProtoMember = {
  personNumber: number;
  name: string;
  parlGroup: string;
  canton: string;
  council: 'N' | 'S';
  seconds: number;
  speeches: number;
  businesses: (ProtoBusiness & { seconds: number })[];
  disclosures: ProtoDisclosure[];
};

type Fixture = {
  generatedAt: string;
  provisional: boolean;
  members: ProtoMember[];
};

export const VARIANTS = [
  { key: 'A', name: 'Member profile' },
  { key: 'B', name: 'On the business' },
  { key: 'C', name: 'Ranking' }
] as const;
export type VariantKey = (typeof VARIANTS)[number]['key'];

export const councilName = (council: 'N' | 'S') =>
  council === 'N' ? 'Nationalrat' : 'Ständerat';

export const formatDuration = (seconds: number) => {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} Min.`;
  return `${Math.floor(minutes / 60)} Std. ${minutes % 60} Min.`;
};

@Injectable({ providedIn: 'root' })
export class InsightsPrototypeService {
  private readonly fixture = toSignal(
    inject(HttpClient).get<Fixture>('assets/prototype-insights/fixture.json')
  );

  readonly variant = signal<VariantKey>(
    (new URLSearchParams(location.search).get('variant') as VariantKey) ?? 'B'
  );

  readonly generatedAt = computed(() => this.fixture()?.generatedAt ?? '');
  readonly provisional = computed(() => this.fixture()?.provisional ?? false);
  readonly members = computed(() => this.fixture()?.members ?? []);

  ranking(council: 'N' | 'S') {
    return this.members()
      .filter((m) => m.council === council)
      .sort((a, b) => b.seconds - a.seconds);
  }

  member(personNumber: number) {
    const member = this.members().find((m) => m.personNumber === personNumber);
    if (!member) return null;
    const ranking = this.ranking(member.council);
    const median = ranking[Math.floor(ranking.length / 2)]?.seconds ?? 0;
    return {
      ...member,
      rank: ranking.indexOf(member) + 1,
      of: ranking.length,
      median,
      max: ranking[0]?.seconds ?? 0,
      council: member.council
    };
  }

  business(id: number) {
    const speakers = this.members()
      .map((m) => ({
        member: m,
        seconds: m.businesses.find((b) => b.id === id)?.seconds ?? 0,
        disclosures: m.disclosures.filter((d) => d.business?.id === id)
      }))
      .filter((s) => s.seconds > 0 || s.disclosures.length > 0)
      .sort((a, b) => b.seconds - a.seconds);
    return {
      N: speakers.filter((s) => s.member.council === 'N'),
      S: speakers.filter((s) => s.member.council === 'S')
    };
  }

  disclosures() {
    return this.members()
      .flatMap((m) => m.disclosures.map((d) => ({ member: m, ...d })))
      .sort((a, b) => b.date.localeCompare(a.date));
  }
}
