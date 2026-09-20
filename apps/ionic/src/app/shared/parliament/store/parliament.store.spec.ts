import { TestBed } from '@angular/core/testing';
import { StorageService } from '../../services/storage.service';
import { InMemoryStorageService } from '../testing/storage.testing';
import {
  ACTIVE_PARLIAMENT_KEY,
  CANTONS_OF_INTEREST_KEY,
  HINT_DISMISSED_KEY,
  ParliamentStore
} from './parliament.store';

describe('ParliamentStore', () => {
  let storage: InMemoryStorageService;

  async function createStore(seed: Record<string, unknown> = {}) {
    storage = new InMemoryStorageService(seed);
    TestBed.configureTestingModule({
      providers: [{ provide: StorageService, useValue: storage }]
    });
    const store = TestBed.inject(ParliamentStore);
    await store.whenReady();
    return store;
  }

  it('starts federal-only until a canton is picked', async () => {
    const store = await createStore();

    expect(store.isCantonalEnabled()).toBeFalse();
    expect(store.activeParliament()).toBe('ch');
    expect(store.switcherEntries()).toEqual([{ key: 'ch', label: 'Bund' }]);
    expect(store.showHint()).toBeTrue();
  });

  it('enables the feature with the first canton of interest, in settings order', async () => {
    const store = await createStore();

    store.toggleCanton('ZH');
    store.toggleCanton('BE');

    expect(store.isCantonalEnabled()).toBeTrue();
    expect(store.cantonsOfInterest()).toEqual(['BE', 'ZH']);
    expect(store.switcherEntries().map((entry) => entry.key)).toEqual([
      'ch',
      'BE',
      'ZH'
    ]);
    expect(store.showHint()).toBeFalse();
  });

  it('follows at most four cantons', async () => {
    const store = await createStore();

    for (const key of ['ZH', 'BE', 'LU', 'AG', 'SG'] as const) {
      store.toggleCanton(key);
    }

    expect(store.cantonsOfInterest()).toEqual(['AG', 'BE', 'LU', 'ZH']);
    expect(store.canAddCanton()).toBeFalse();
  });

  it('caps a longer selection found in storage', async () => {
    const store = await createStore({
      [CANTONS_OF_INTEREST_KEY]: ['ZH', 'BE', 'LU', 'AG', 'SG', 'TG']
    });

    expect(store.cantonsOfInterest().length).toBe(4);
  });

  it('activates only a canton of interest', async () => {
    const store = await createStore();
    store.setCantonsOfInterest(['ZH']);

    store.setActiveParliament('BE');
    expect(store.activeParliament()).toBe('ch');

    store.setActiveParliament('ZH');
    expect(store.activeParliament()).toBe('ZH');
  });

  it('falls back to the federal parliament when the active canton is removed', async () => {
    const store = await createStore();
    store.setCantonsOfInterest(['BE', 'ZH']);
    store.setActiveParliament('ZH');

    store.toggleCanton('ZH');

    expect(store.activeParliament()).toBe('ch');
    expect(store.cantonsOfInterest()).toEqual(['BE']);
  });

  it('keeps the active canton when another one is removed', async () => {
    const store = await createStore();
    store.setCantonsOfInterest(['BE', 'ZH']);
    store.setActiveParliament('ZH');

    store.toggleCanton('BE');

    expect(store.activeParliament()).toBe('ZH');
  });

  it('persists cantons, active parliament and the dismissed hint', async () => {
    const store = await createStore();

    store.setCantonsOfInterest(['LU']);
    store.setActiveParliament('LU');
    store.dismissHint();

    expect(storage.values.get(CANTONS_OF_INTEREST_KEY)).toEqual(['LU']);
    expect(storage.values.get(ACTIVE_PARLIAMENT_KEY)).toBe('LU');
    expect(storage.values.get(HINT_DISMISSED_KEY)).toBeTrue();
  });

  it('restores its state from storage on the next start', async () => {
    const store = await createStore({
      [CANTONS_OF_INTEREST_KEY]: ['AG', 'ZH'],
      [ACTIVE_PARLIAMENT_KEY]: 'ZH',
      [HINT_DISMISSED_KEY]: true
    });

    expect(store.cantonsOfInterest()).toEqual(['AG', 'ZH']);
    expect(store.activeParliament()).toBe('ZH');
    expect(store.showHint()).toBeFalse();
  });

  it('drops unknown keys and a stale active parliament found in storage', async () => {
    const store = await createStore({
      [CANTONS_OF_INTEREST_KEY]: ['ZH', 'XX', 42],
      [ACTIVE_PARLIAMENT_KEY]: 'BE'
    });

    expect(store.cantonsOfInterest()).toEqual(['ZH']);
    expect(store.activeParliament()).toBe('ch');
  });
});
