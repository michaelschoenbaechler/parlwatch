import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { StorageService } from '../../shared/services/storage.service';
import {
  CANTONS,
  CantonKey,
  FEDERAL_PARLIAMENT_KEY,
  isCantonKey,
  ParliamentKey,
  toParliamentKey
} from '../models/parliament.model';

export interface SwitcherEntry {
  key: ParliamentKey;
  label: string;
}

export type ParliamentSlice = {
  cantonsOfInterest: CantonKey[];
  activeParliament: ParliamentKey;
  hintDismissed: boolean;
};

export const CANTONS_OF_INTEREST_KEY = 'parliament.cantonsOfInterest';
export const ACTIVE_PARLIAMENT_KEY = 'parliament.activeParliament';
export const HINT_DISMISSED_KEY = 'parliament.hintDismissed';

const initialState: ParliamentSlice = {
  cantonsOfInterest: [],
  activeParliament: FEDERAL_PARLIAMENT_KEY,
  hintDismissed: false
};

export const ParliamentStore = signalStore(
  { providedIn: 'root' },
  withDevtools('ParliamentStore'),
  withState(initialState),
  withComputed((store) => ({
    isCantonalEnabled: computed(() => store.cantonsOfInterest().length > 0),

    switcherEntries: computed<SwitcherEntry[]>(() => [
      { key: FEDERAL_PARLIAMENT_KEY, label: 'Bund' },
      ...store.cantonsOfInterest().map((key) => ({ key, label: key }))
    ]),

    showHint: computed(
      () => !store.hintDismissed() && store.cantonsOfInterest().length === 0
    )
  })),
  withMethods((store) => {
    const storage = inject(StorageService);

    let resolveReady: () => void = () => undefined;
    const ready = new Promise<void>((resolve) => (resolveReady = resolve));
    let loaded = false;
    let pendingActive: ParliamentKey | null = null;

    const validActive = (
      active: ParliamentKey,
      cantons: CantonKey[]
    ): ParliamentKey =>
      active === FEDERAL_PARLIAMENT_KEY || cantons.includes(active as CantonKey)
        ? active
        : FEDERAL_PARLIAMENT_KEY;

    const persist = (state: ParliamentSlice) => {
      void storage.set(CANTONS_OF_INTEREST_KEY, state.cantonsOfInterest);
      void storage.set(ACTIVE_PARLIAMENT_KEY, state.activeParliament);
      void storage.set(HINT_DISMISSED_KEY, state.hintDismissed);
    };

    const setCantonsOfInterest = (keys: CantonKey[]): void => {
      const cantonsOfInterest = CANTONS.map((canton) => canton.key).filter(
        (key) => keys.includes(key)
      );

      patchState(store, (state) => {
        const next = {
          ...state,
          cantonsOfInterest,
          activeParliament: validActive(
            state.activeParliament,
            cantonsOfInterest
          )
        };
        persist(next);
        return next;
      });
    };

    return {
      async load(): Promise<void> {
        const [storedCantons, storedActive, hintDismissed] = await Promise.all([
          storage.get<unknown[]>(CANTONS_OF_INTEREST_KEY, []),
          storage.get<unknown>(ACTIVE_PARLIAMENT_KEY, FEDERAL_PARLIAMENT_KEY),
          storage.get<boolean>(HINT_DISMISSED_KEY, false)
        ]);

        const cantonsOfInterest = storedCantons.filter(isCantonKey);

        const next = {
          cantonsOfInterest,
          activeParliament: validActive(
            pendingActive ?? toParliamentKey(storedActive),
            cantonsOfInterest
          ),
          hintDismissed: hintDismissed === true
        };
        patchState(store, next);
        loaded = true;
        if (pendingActive !== null) persist(next);
        pendingActive = null;
        resolveReady();
      },

      whenReady(): Promise<void> {
        return ready;
      },

      setCantonsOfInterest,

      toggleCanton(key: CantonKey): void {
        const current = store.cantonsOfInterest();
        setCantonsOfInterest(
          current.includes(key)
            ? current.filter((existing) => existing !== key)
            : [...current, key]
        );
      },

      setActiveParliament(key: ParliamentKey): void {
        if (!loaded) {
          pendingActive = key;
          return;
        }

        const activeParliament = validActive(key, store.cantonsOfInterest());
        if (activeParliament !== key) return;
        if (store.activeParliament() === activeParliament) return;

        patchState(store, (state) => {
          const next = { ...state, activeParliament };
          persist(next);
          return next;
        });
      },

      dismissHint(): void {
        patchState(store, (state) => {
          const next = { ...state, hintDismissed: true };
          persist(next);
          return next;
        });
      }
    };
  }),
  withHooks({
    onInit(store) {
      void store.load();
    }
  })
);
