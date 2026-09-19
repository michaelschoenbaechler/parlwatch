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

/** One entry of the parliament switcher on the list pages. */
export interface SwitcherEntry {
  key: ParliamentKey;
  /** Short label: "Bund" for the federal parliament, the abbreviation for a canton. */
  label: string;
}

export type ParliamentSlice = {
  /** The cantons the user follows, in the order the settings list shows them. */
  cantonsOfInterest: CantonKey[];
  /** The parliament the list pages show. Always `ch` or a canton of interest. */
  activeParliament: ParliamentKey;
  /** Whether the "you can now follow your canton" hint was dismissed. */
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

/**
 * Which parliaments the user follows and which one the list pages show.
 *
 * The cantons of interest are the only switch for the whole cantonal feature:
 * while the list is empty the app looks and behaves exactly as it did before
 * cantons existed. Both values survive restarts through Ionic Storage.
 */
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

    /** Shown until the user either dismisses it or picks a canton. */
    showHint: computed(
      () => !store.hintDismissed() && store.cantonsOfInterest().length === 0
    )
  })),
  withMethods((store) => {
    const storage = inject(StorageService);

    let resolveReady: () => void = () => undefined;
    const ready = new Promise<void>((resolve) => (resolveReady = resolve));
    let loaded = false;
    /**
     * A parliament activated before storage was read, as happens when the
     * app cold-starts on a list page. Applied on top of the stored value
     * once it is known, instead of being overwritten by it.
     */
    let pendingActive: ParliamentKey | null = null;

    /**
     * Keep the active parliament valid: it must be `ch` or a canton the user
     * still follows, otherwise the switcher would point at a dead entry.
     * @param active The requested parliament
     * @param cantons The cantons of interest
     * @returns The parliament to make active
     */
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
      // Settings order is the canton list's order, whatever order the user
      // ticked the boxes in.
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

        // Storage is trusted no further than a deep link: unknown keys are
        // dropped rather than allowed to break the switcher.
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

      /**
       * Wait for the persisted state, so a redirect to the active parliament
       * does not race the storage read on a cold start.
       * @returns Resolves once `load` has run
       */
      whenReady(): Promise<void> {
        return ready;
      },

      /**
       * Replace the cantons of interest. Removing the active canton sends the
       * list pages back to the federal parliament.
       */
      setCantonsOfInterest,

      /**
       * Add or remove one canton.
       * @param key The canton that was tapped
       */
      toggleCanton(key: CantonKey): void {
        const current = store.cantonsOfInterest();
        setCantonsOfInterest(
          current.includes(key)
            ? current.filter((existing) => existing !== key)
            : [...current, key]
        );
      },

      /**
       * Make a parliament the one the list pages show. Ignored for a canton
       * the user does not follow, so a deep link cannot add a switcher entry.
       * @param key The parliament to activate
       */
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
