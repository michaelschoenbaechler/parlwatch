import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Business } from 'swissparl';
import { StorageService } from '@parlwatch/shared/common/services';
import { InMemoryStorageService } from '@parlwatch/shared/parliament/testing';
import zhAffairDetail from '@parlwatch/shared/open-parl-data/testing/fixtures/zh-affair-detail.json';
import { OpdAffair } from '@parlwatch/shared/open-parl-data/models';
import { BusinessFacade } from '../../services/business.facade';
import { toLoadedBusiness } from '../../services/cantonal-business.service';
import { LoadedBusiness } from '../../models/cantonal-business';
import {
  BusinessHead,
  snapshotOf,
  WatchedBusiness
} from '../../models/watched-business';
import {
  CHECK_INTERVAL_MS,
  MAX_WATCHED_BUSINESSES,
  WATCH_CHECK_KEY,
  WATCHED_BUSINESSES_KEY,
  WatchedBusinessStore
} from './watched.store';

const federalA: LoadedBusiness = {
  ID: 20233456,
  Title: 'Federal motion',
  BusinessShortNumber: '23.3456',
  BusinessTypeName: 'Motion',
  BusinessStatus: 202,
  BusinessStatusText: 'Eingereicht',
  BusinessStatusDate: '/Date(1700000000000)/',
  Modified: '/Date(1700000000000)/',
  Bills: [
    {
      Resolutions: {
        results: [
          {
            ResolutionDate: '/Date(1700000000000)/',
            ResolutionId: 66,
            ResolutionText: 'Zuweisung an die Kommission',
            Council: 1,
            CouncilName: 'Nationalrat'
          }
        ]
      }
    }
  ],
  Preconsultations: [
    {
      CommitteeNumber: 10,
      CommitteeName: 'WAK-N',
      PreconsultationDate: '/Date(1700100000000)/'
    }
  ],
  Votes: [{ ID: 1, VoteEnd: '/Date(1700200000000)/' }]
} as unknown as LoadedBusiness;

const federalB: LoadedBusiness = {
  ...federalA,
  BusinessStatus: 229,
  BusinessStatusText: 'Erledigt',
  BusinessStatusDate: '/Date(1710000000000)/',
  Modified: '/Date(1710000000000)/',
  Bills: [
    {
      Resolutions: {
        results: [
          ...(federalA.Bills?.[0].Resolutions as unknown as { results: [] })
            .results,
          {
            ResolutionDate: '/Date(1709000000000)/',
            ResolutionId: 1,
            ResolutionText: 'Annahme',
            Council: 1,
            CouncilName: 'Nationalrat'
          },
          {
            ResolutionDate: '/Date(1709000000000)/',
            ResolutionId: 1,
            ResolutionText: 'Annahme',
            Council: 1,
            CouncilName: 'Nationalrat'
          }
        ]
      }
    }
  ],
  Preconsultations: [
    ...(federalA.Preconsultations ?? []),
    {
      CommitteeNumber: 23,
      CommitteeName: 'WAK-S',
      PreconsultationDate: '/Date(1708000000000)/'
    }
  ],
  Votes: [
    ...(federalA.Votes ?? []),
    { ID: 2, VoteEnd: '/Date(1709500000000)/' },
    { ID: 3, VoteEnd: '/Date(1709600000000)/' }
  ]
} as unknown as LoadedBusiness;

const zhAffair = zhAffairDetail as unknown as OpdAffair;
const cantonalA = toLoadedBusiness(zhAffair, [], 'ZH', 'de');
const cantonalB = toLoadedBusiness(
  {
    ...zhAffair,
    updated_at: '2026-10-01T01:00:00',
    state_name: { de: 'Erledigt' },
    events: {
      data: [
        ...(zhAffair.events as { data: unknown[] }).data,
        {
          id: 999,
          date: '2026-09-30T00:00:00',
          position: 9,
          title_harmonized: { de: 'Beschluss: Annahme' },
          actor: { de: 'Kantonsrat' }
        }
      ]
    },
    docs: {
      data: [
        ...(zhAffair.docs as { data: unknown[] }).data,
        { id: 777, url: 'https://files/new', date: '2026-09-29T00:00:00' }
      ]
    }
  } as OpdAffair,
  [
    {
      id: 1,
      person_id: 5,
      text_content: { de: 'Votum' },
      person: { data: [{ fullname: 'Rednerin' }] }
    }
  ],
  'ZH',
  'de'
);

function headOf(business: LoadedBusiness, parliament = 'ch'): BusinessHead {
  const snapshot = snapshotOf(business);
  return {
    parliament: parliament as BusinessHead['parliament'],
    id: business.ID as number,
    modified: snapshot.modified,
    status: snapshot.status
  };
}

describe('WatchedBusinessStore', () => {
  let storage: InMemoryStorageService;
  let facade: jasmine.SpyObj<BusinessFacade>;

  async function createStore(seed: Record<string, unknown> = {}) {
    storage = new InMemoryStorageService(seed);
    facade = jasmine.createSpyObj<BusinessFacade>('BusinessFacade', [
      'getBusinessHeads',
      'getBusiness'
    ]);
    facade.getBusinessHeads.and.returnValue(of({ heads: [], failed: false }));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: StorageService, useValue: storage },
        { provide: BusinessFacade, useValue: facade }
      ]
    });
    const store = TestBed.inject(WatchedBusinessStore);
    await store.whenReady();
    return store;
  }

  function answerWith(
    heads: BusinessHead[],
    business: LoadedBusiness,
    failed = false
  ) {
    facade.getBusinessHeads.and.returnValue(of({ heads, failed }));
    facade.getBusiness.and.returnValue(of(business));
  }

  describe('following', () => {
    it('follows a business from its loaded detail and persists it', async () => {
      const store = await createStore();

      expect(store.follow('ch', federalA)).toBeTrue();

      expect(store.isFollowed('ch', 20233456)).toBeTrue();
      expect(store.entries().length).toBe(1);
      expect(store.entries()[0].snapshot).toEqual({
        modified: '/Date(1700000000000)/',
        status: '202',
        steps: [
          'resolution-/Date(1700000000000)/-1-66',
          'preconsultation-10-/Date(1700100000000)/'
        ],
        votes: [1],
        documents: [],
        speeches: 0
      });
      expect(storage.values.get(WATCHED_BUSINESSES_KEY)).toEqual(
        store.entries()
      );
    });

    it('keeps a federal and a cantonal business with the same id apart', async () => {
      const store = await createStore();

      store.follow('ch', { ...federalA, ID: 91382 });
      store.follow('ZH', cantonalA);
      store.unfollow('ch', 91382);

      expect(store.isFollowed('ch', 91382)).toBeFalse();
      expect(store.isFollowed('ZH', 91382)).toBeTrue();
    });

    it('refuses to follow beyond the cap', async () => {
      const store = await createStore();

      for (let id = 1; id <= MAX_WATCHED_BUSINESSES; id++) {
        expect(store.follow('ch', { ...federalA, ID: id })).toBeTrue();
      }

      expect(store.follow('ch', { ...federalA, ID: 99 })).toBeFalse();
      expect(store.canFollow()).toBeFalse();
      expect(store.entries().length).toBe(MAX_WATCHED_BUSINESSES);
    });

    it('restores an entry after unfollowing it', async () => {
      const store = await createStore();
      store.follow('ZH', cantonalA);
      const [entry] = store.entries();

      store.unfollow('ZH', 91382);
      expect(store.entries()).toEqual([]);

      store.restore(entry);
      expect(store.entries()).toEqual([entry]);
    });

    it('loads what was stored, federal by default', async () => {
      const stored: WatchedBusiness = {
        parliament: undefined as unknown as 'ch',
        id: 1,
        title: 'Stored',
        shortNumber: '',
        typeName: '',
        followedAt: 1,
        modified: '',
        snapshot: snapshotOf(federalA),
        changes: [],
        unseen: true
      };
      const store = await createStore({
        [WATCHED_BUSINESSES_KEY]: [stored],
        [WATCH_CHECK_KEY]: { at: 5, ok: false }
      });

      expect(store.entries()).toEqual([{ ...stored, parliament: 'ch' }]);
      expect(store.unseenCount()).toBe(1);
      expect(store.lastCheck()).toEqual({ at: 5, ok: false });
    });
  });

  describe('ordering', () => {
    it('lists unseen businesses first, newest change first, then the rest by last change', async () => {
      const entry = (
        id: number,
        followedAt: number,
        unseen: boolean,
        changeDate?: string
      ): WatchedBusiness => ({
        parliament: 'ch',
        id,
        title: String(id),
        shortNumber: '',
        typeName: '',
        followedAt,
        modified: '',
        snapshot: snapshotOf(federalA),
        changes: changeDate
          ? [{ kind: 'vote', date: changeDate, value: '' }]
          : [],
        unseen
      });
      const store = await createStore({
        [WATCHED_BUSINESSES_KEY]: [
          entry(1, 100, false),
          entry(2, 50, true, '/Date(1000)/'),
          entry(3, 20, false, '/Date(300)/'),
          entry(4, 10, true, '/Date(2000)/')
        ]
      });

      expect(store.entries().map((e) => e.id)).toEqual([4, 2, 3, 1]);
    });
  });

  describe('check', () => {
    it('leaves everything alone when the head has not moved', async () => {
      const store = await createStore();
      store.follow('ch', federalA);
      answerWith([headOf(federalA)], federalB);

      await store.check();

      expect(facade.getBusinessHeads.calls.mostRecent().args[0]).toEqual(
        store.entries()
      );
      expect(facade.getBusiness).not.toHaveBeenCalled();
      expect(store.unseenCount()).toBe(0);
      expect(store.lastCheck()?.ok).toBeTrue();
    });

    it('words every kind of federal change against the snapshot', async () => {
      const store = await createStore();
      store.follow('ch', federalA);
      answerWith([headOf(federalB)], federalB);

      await store.check();

      const [entry] = store.entries();
      expect(entry.unseen).toBeTrue();
      expect(entry.modified).toBe('/Date(1710000000000)/');
      expect(entry.changes).toEqual([
        {
          kind: 'status',
          date: '/Date(1710000000000)/',
          value: 'Erledigt'
        },
        { kind: 'vote', date: '/Date(1709600000000)/', value: '' },
        { kind: 'vote', date: '/Date(1709500000000)/', value: '' },
        {
          kind: 'decision',
          date: '/Date(1709000000000)/',
          value: 'Nationalrat: Annahme'
        },
        {
          kind: 'committee',
          date: '/Date(1708000000000)/',
          value: 'WAK-S'
        }
      ]);
      expect(store.unseenCount()).toBe(1);
      expect(storage.values.get(WATCHED_BUSINESSES_KEY)).toEqual(
        store.entries()
      );
    });

    it('words every kind of cantonal change against the snapshot', async () => {
      const store = await createStore();
      store.follow('ZH', cantonalA);
      answerWith([headOf(cantonalB, 'ZH')], cantonalB);

      await store.check();

      const [entry] = store.entries();
      expect(entry.unseen).toBeTrue();
      expect(entry.changes.map((change) => change.kind)).toEqual([
        'status',
        'debate',
        'step',
        'document'
      ]);
      expect(entry.changes[0].value).toBe('Erledigt');
      expect(entry.changes[2].value).toBe('Kantonsrat: Beschluss: Annahme');
    });

    it('diffs against what the user saw, so a second check reports everything since', async () => {
      const store = await createStore();
      store.follow('ch', federalA);
      answerWith([headOf(federalB)], federalB);
      await store.check({ force: true });

      const later = {
        ...federalB,
        Modified: '/Date(1720000000000)/',
        Votes: [
          ...(federalB.Votes ?? []),
          { ID: 4, VoteEnd: '/Date(1719000000000)/' }
        ]
      } as LoadedBusiness;
      answerWith([headOf(later)], later);
      await store.check({ force: true });

      const [entry] = store.entries();
      expect(entry.changes.filter((c) => c.kind === 'vote').length).toBe(3);
      expect(entry.snapshot).toEqual(snapshotOf(federalA));
    });

    it('advances silently when the timestamp moved but nothing recognisable changed', async () => {
      const store = await createStore();
      store.follow('ch', federalA);
      const touched = {
        ...federalA,
        Modified: '/Date(1705000000000)/',
        Title: 'Typo fixed'
      } as LoadedBusiness;
      answerWith([headOf(touched)], touched);

      await store.check();

      const [entry] = store.entries();
      expect(facade.getBusiness).toHaveBeenCalled();
      expect(entry.unseen).toBeFalse();
      expect(entry.changes).toEqual([]);
      expect(entry.modified).toBe('/Date(1705000000000)/');
      expect(entry.snapshot.modified).toBe('/Date(1705000000000)/');
    });

    it('leaves an entry untouched when its head request failed and records the failure', async () => {
      const store = await createStore();
      store.follow('ch', federalA);
      store.follow('ZH', cantonalA);
      answerWith([headOf(cantonalB, 'ZH')], cantonalB, true);

      await store.check();

      const federal = store.entries().find((e) => e.parliament === 'ch');
      const cantonal = store.entries().find((e) => e.parliament === 'ZH');
      expect(federal?.unseen).toBeFalse();
      expect(federal?.snapshot).toEqual(snapshotOf(federalA));
      expect(cantonal?.unseen).toBeTrue();
      expect(store.lastCheck()?.ok).toBeFalse();
      expect(storage.values.get(WATCH_CHECK_KEY)).toEqual(store.lastCheck());
    });

    it('records a failed check when the detail cannot be loaded', async () => {
      const store = await createStore();
      store.follow('ch', federalA);
      facade.getBusinessHeads.and.returnValue(
        of({ heads: [headOf(federalB)], failed: false })
      );
      facade.getBusiness.and.returnValue(throwError(() => new Error('down')));

      await store.check();

      expect(store.entries()[0].unseen).toBeFalse();
      expect(store.lastCheck()?.ok).toBeFalse();
    });

    it('is throttled after a successful check unless forced', async () => {
      const store = await createStore({
        [WATCH_CHECK_KEY]: { at: Date.now() - CHECK_INTERVAL_MS / 2, ok: true }
      });
      store.follow('ch', federalA);

      await store.check();
      expect(facade.getBusinessHeads).not.toHaveBeenCalled();

      await store.check({ force: true });
      expect(facade.getBusinessHeads).toHaveBeenCalledTimes(1);
    });

    it('checks again once the interval has passed or the last check failed', async () => {
      let store = await createStore({
        [WATCH_CHECK_KEY]: { at: Date.now() - CHECK_INTERVAL_MS - 1, ok: true }
      });
      store.follow('ch', federalA);
      await store.check();
      expect(facade.getBusinessHeads).toHaveBeenCalledTimes(1);

      store = await createStore({
        [WATCH_CHECK_KEY]: { at: Date.now(), ok: false }
      });
      store.follow('ch', federalA);
      await store.check();
      expect(facade.getBusinessHeads).toHaveBeenCalledTimes(1);
    });
  });

  describe('markSeen', () => {
    it('clears the unseen flag, keeps the change lines and snapshots what was shown', async () => {
      const store = await createStore();
      store.follow('ch', federalA);
      answerWith([headOf(federalB)], federalB);
      await store.check();

      store.markSeen('ch', 20233456, {
        ...federalB,
        Title: 'Renamed'
      } as Business);

      const [entry] = store.entries();
      expect(entry.unseen).toBeFalse();
      expect(entry.changes.length).toBe(5);
      expect(entry.title).toBe('Renamed');
      expect(entry.snapshot).toEqual(snapshotOf(federalB));
      expect(store.unseenCount()).toBe(0);

      answerWith([headOf(federalB)], federalB);
      await store.check({ force: true });
      expect(facade.getBusiness).toHaveBeenCalledTimes(1);
    });
  });
});
