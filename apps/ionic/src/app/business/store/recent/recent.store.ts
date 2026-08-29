import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withState
} from '@ngrx/signals';
import { inject } from '@angular/core';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { StorageService } from '../../../shared/services/storage.service';

export interface RecentBusiness {
  id: number;
  title: string;
}

export type RecentSlice = {
  businesses: RecentBusiness[];
  searches: string[];
};

const STORAGE_KEY_BUSINESSES = 'business.recentBusinesses';
const STORAGE_KEY_SEARCHES = 'business.recentSearches';

/**
 * How much history is kept. Deliberately larger than what the suggestion panel
 * shows: the panel lists only the newest few, but filters over the whole
 * history once the user starts typing, so older entries stay findable.
 */
const STORED_BUSINESSES = 20;
const STORED_SEARCHES = 20;

const initialState: RecentSlice = { businesses: [], searches: [] };

/**
 * Recently viewed businesses and recent search terms, persisted with Ionic
 * Storage. Purely a convenience layer: if storage fails the lists stay empty
 * and the suggestion sections simply do not render.
 */
export const RecentStore = signalStore(
  { providedIn: 'root' },
  withDevtools('RecentStore'),
  withState(initialState),
  withMethods((store) => {
    const storage = inject(StorageService);

    return {
      async load(): Promise<void> {
        const [businesses, searches] = await Promise.all([
          storage.get<RecentBusiness[]>(STORAGE_KEY_BUSINESSES, []),
          storage.get<string[]>(STORAGE_KEY_SEARCHES, [])
        ]);
        patchState(store, {
          businesses: businesses.slice(0, STORED_BUSINESSES),
          searches: searches.slice(0, STORED_SEARCHES)
        });
      },

      recordBusiness(business: RecentBusiness): void {
        if (!business.id || !business.title) return;

        const current = store.businesses();
        // Nothing to do when it is already the newest entry.
        if (current[0]?.id === business.id) return;

        const businesses = [
          business,
          ...current.filter((entry) => entry.id !== business.id)
        ].slice(0, STORED_BUSINESSES);

        patchState(store, { businesses });
        void storage.set(STORAGE_KEY_BUSINESSES, businesses);
      },

      recordSearch(term: string): void {
        const searchTerm = term.trim();
        if (!searchTerm) return;

        const searches = [
          searchTerm,
          ...store
            .searches()
            .filter((entry) => entry.toLowerCase() !== searchTerm.toLowerCase())
        ].slice(0, STORED_SEARCHES);

        patchState(store, { searches });
        void storage.set(STORAGE_KEY_SEARCHES, searches);
      }
    };
  }),
  withHooks({
    onInit(store) {
      void store.load();
    }
  })
);
