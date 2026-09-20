import { TestBed } from '@angular/core/testing';
import { InMemoryStorageService } from '@parlwatch/shared/parliament/testing/storage.testing';
import { StorageService } from '../../services/storage.service';
import { createRecentStore, filterRecent } from './recent.store';

const ENTRIES_KEY = 'spec.recentEntries';
const SEARCHES_KEY = 'spec.recentSearches';

describe('recent store', () => {
  let storage: InMemoryStorageService;

  async function createStore(seed: Record<string, unknown> = {}) {
    storage = new InMemoryStorageService(seed);
    TestBed.configureTestingModule({
      providers: [{ provide: StorageService, useValue: storage }]
    });
    const Store = createRecentStore({
      name: 'SpecRecentStore',
      entriesKey: ENTRIES_KEY,
      searchesKey: SEARCHES_KEY
    });
    const store = TestBed.inject(Store);
    await store.load();
    return store;
  }

  it('loads entries stored before cantons existed as federal ones', async () => {
    const store = await createStore({
      [ENTRIES_KEY]: [
        { id: 20233456, title: 'Old federal business' },
        { id: 91382, title: 'Zürich motion', parliament: 'ZH' }
      ]
    });

    expect(store.entries()).toEqual([
      { id: 20233456, title: 'Old federal business', parliament: 'ch' },
      { id: 91382, title: 'Zürich motion', parliament: 'ZH' }
    ]);
  });

  it('records the parliament with every entry', async () => {
    const store = await createStore();

    store.recordEntry({ id: 1, title: 'Federal' });
    store.recordEntry({ id: 2, title: 'Bern', parliament: 'BE' });

    expect(store.entries().map((entry) => entry.parliament)).toEqual([
      'BE',
      'ch'
    ]);
    expect(storage.values.get(ENTRIES_KEY)).toEqual(store.entries());
  });

  it('keeps a federal and a cantonal entry with the same id apart', async () => {
    const store = await createStore();

    store.recordEntry({ id: 5, title: 'Federal five', parliament: 'ch' });
    store.recordEntry({ id: 5, title: 'Zürich five', parliament: 'ZH' });
    store.recordEntry({ id: 5, title: 'Federal five', parliament: 'ch' });

    expect(store.entries().map((entry) => entry.title)).toEqual([
      'Federal five',
      'Zürich five'
    ]);
  });

  it('keeps entries from parliaments the user no longer follows', async () => {
    const store = await createStore({
      [ENTRIES_KEY]: [{ id: 3, title: 'Graubünden', parliament: 'GR' }]
    });

    store.recordEntry({ id: 4, title: 'Federal' });

    expect(store.entries().map((entry) => entry.parliament)).toEqual([
      'ch',
      'GR'
    ]);
  });

  it('ignores entries without an id or a title', async () => {
    const store = await createStore();

    store.recordEntry({ id: 0, title: 'No id' });
    store.recordEntry({ id: 1, title: '' });

    expect(store.entries()).toEqual([]);
  });

  it('narrows a history by query and leaves it alone without one', () => {
    const entries = ['Budget 2027', 'Klimaschutz'];
    expect(filterRecent(entries, (entry) => entry, 'klima')).toEqual([
      'Klimaschutz'
    ]);
    expect(filterRecent(entries, (entry) => entry, '')).toBe(entries);
  });
});
