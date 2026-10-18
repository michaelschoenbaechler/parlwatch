// PROTOTYPE for #55 (topic digest list, finished businesses). Throwaway.
// Fixture: real OData data (topics, businesses submitted 22./23.9.2026,
// open and finished federal businesses); the two cantonal follows are stubs.
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Business } from 'swissparl';
import { ParliamentKey } from '@parlwatch/shared/parliament/models';

export type ProtoTag = { id: number; name: string };

export type ProtoDigestBusiness = {
  id: number;
  shortNumber: string;
  typeName: string;
  submittedBy: string | null;
  title: string;
  tagIds: number[];
};

export type ProtoFollow = {
  parliament: ParliamentKey;
  id: number;
  shortNumber: string;
  typeName: string;
  title: string;
  status: string;
  finished: boolean;
  changes: string[];
  finishedAt?: string;
};

type Fixture = {
  tags: ProtoTag[];
  followedTagIds: number[];
  digests: Record<string, ProtoDigestBusiness[]>;
  active: Omit<ProtoFollow, 'parliament' | 'changes'>[];
  finished: Omit<ProtoFollow, 'parliament' | 'changes'>[];
};

export const VARIANTS = [
  { key: 'A', name: 'Tabs: Geschäfte | Themen' },
  { key: 'B', name: 'Ein Feed' },
  { key: 'C', name: 'Themen als Zeilen' },
  { key: 'D', name: 'B mit Chip «Geschäfte»' }
] as const;
export type VariantKey = (typeof VARIANTS)[number]['key'];

const CHANGES = [
  ['Neuer Status: In Kommission des Nationalrats'],
  ['Neue Abstimmung', 'Neue Wortmeldungen'],
  [],
  ['Zugewiesen an: Kommission für Wirtschaft und Abgaben'],
  []
];

const CANTONAL: ProtoFollow[] = [
  {
    parliament: 'ZH',
    id: 900001,
    shortNumber: 'KR-Nr. 212/2026',
    typeName: 'Postulat',
    title: 'Sichere Velorouten entlang der Kantonsstrassen',
    status: 'Überwiesen',
    finished: false,
    changes: ['Neuer Status: Überwiesen']
  },
  {
    parliament: 'BE',
    id: 900002,
    shortNumber: '2026.RRGR.88',
    typeName: 'Motion',
    title: 'Hausarztmedizin in Randregionen stärken',
    status: 'Eingereicht',
    finished: false,
    changes: []
  }
];

const FINISHED_AT = ['26.9.2026', '26.9.2026', '19.6.2026', '20.3.2026'];

@Injectable({ providedIn: 'root' })
export class DigestPrototypeService {
  private readonly fixture = toSignal(
    inject(HttpClient).get<Fixture>('assets/prototype-digest/fixture.json')
  );

  readonly variant = signal<VariantKey>('A');
  readonly digestDates = ['2026-09-23', '2026-09-22'];

  readonly tags = computed(() => this.fixture()?.tags ?? []);
  readonly followedTagIds = signal<number[] | null>(null);
  readonly topicIds = computed(
    () => this.followedTagIds() ?? this.fixture()?.followedTagIds ?? []
  );
  readonly followedTags = computed(() =>
    this.tags().filter((tag) => this.topicIds().includes(tag.id))
  );

  private readonly followedBusinessIds = signal<number[] | null>(null);

  readonly follows = computed<ProtoFollow[]>(() => {
    const fixture = this.fixture();
    if (!fixture) return [];
    const base: ProtoFollow[] = [
      ...fixture.active.map((b, i) => ({
        ...b,
        parliament: 'ch' as const,
        changes: CHANGES[i] ?? []
      })),
      ...CANTONAL,
      ...fixture.finished.map((b, i) => ({
        ...b,
        parliament: 'ch' as const,
        changes: [],
        finishedAt: FINISHED_AT[i]
      }))
    ];
    const extra = (this.followedBusinessIds() ?? [])
      .filter((id) => !base.some((f) => f.id === id))
      .map((id) => this.digestBusiness(id))
      .filter((b): b is ProtoDigestBusiness => !!b)
      .map((b) => ({
        parliament: 'ch' as const,
        id: b.id,
        shortNumber: b.shortNumber,
        typeName: b.typeName,
        title: b.title,
        status: 'Eingereicht',
        finished: false,
        changes: []
      }));
    const gone = this.unfollowed();
    return [...extra, ...base].filter((f) => !gone.includes(f.id));
  });

  readonly active = computed(() => this.follows().filter((f) => !f.finished));
  readonly federal = computed(() =>
    this.active().filter((f) => f.parliament === 'ch')
  );
  readonly cantonal = computed(() =>
    this.active().filter((f) => f.parliament !== 'ch')
  );
  readonly finished = computed(() => this.follows().filter((f) => f.finished));

  digest(date: string): ProtoDigestBusiness[] {
    return this.fixture()?.digests[date] ?? [];
  }

  /** The digest as the app shows it: own topics only, grouped by topic. */
  digestGroups(
    date: string
  ): { tag: ProtoTag; businesses: ProtoDigestBusiness[] }[] {
    const businesses = this.digest(date);
    return this.followedTags()
      .map((tag) => ({
        tag,
        businesses: businesses.filter((b) => b.tagIds.includes(tag.id))
      }))
      .filter((group) => group.businesses.length > 0);
  }

  digestCount(date: string): number {
    const ids = this.topicIds();
    return this.digest(date).filter((b) =>
      b.tagIds.some((t) => ids.includes(t))
    ).length;
  }

  tagName(id: number): string {
    return this.tags().find((tag) => tag.id === id)?.name ?? '';
  }

  isTopicFollowed(id: number): boolean {
    return this.topicIds().includes(id);
  }

  toggleTopic(id: number) {
    const ids = this.topicIds();
    this.followedTagIds.set(
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );
  }

  isFollowed(id: number): boolean {
    return this.follows().some((f) => f.id === id);
  }

  readonly unfollowed = signal<number[]>([]);

  toggleBusiness(id: number) {
    if (this.isFollowed(id)) {
      this.unfollowed.update((ids) => [...ids, id]);
      return;
    }
    this.unfollowed.update((ids) => ids.filter((x) => x !== id));
    this.followedBusinessIds.update((ids) => [...(ids ?? []), id]);
  }

  private digestBusiness(id: number): ProtoDigestBusiness | undefined {
    return Object.values(this.fixture()?.digests ?? {})
      .flat()
      .find((b) => b.id === id);
  }
}

export function asBusiness(
  b: {
    id: number;
    shortNumber: string;
    typeName: string;
    title: string;
    status?: string;
  },
  tagNames: string[] = []
): Business {
  return {
    ID: b.id,
    BusinessShortNumber: b.shortNumber,
    BusinessTypeName: b.typeName,
    Title: b.title,
    BusinessStatusText: b.status,
    TagNames: tagNames.join('|') || undefined
  } as Business;
}

export function formatDay(date: string): string {
  return new Date(date).toLocaleDateString('de-CH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
}
