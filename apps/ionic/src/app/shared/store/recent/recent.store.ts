import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withState
} from '@ngrx/signals';
import { inject } from '@angular/core';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { StorageService } from '../../services/storage.service';

/** A previously viewed entity, keyed on the id its detail page routes on. */
export interface RecentEntry {
  id: number;
  title: string;
}

export type RecentSlice = {
  entries: RecentEntry[];
  searches: string[];
};

export interface RecentStoreConfig {
  /** Name the store appears under in the devtools. */
  name: string;
  /** Storage key holding the viewed entities. */
  entriesKey: string;
  /** Storage key holding the search terms. */
  searchesKey: string;
}

/**
 * How much history is kept. Deliberately larger than what a suggestion panel
 * shows: the panel lists only the newest few, but filters over the whole
 * history once the user starts typing, so older entries stay findable.
 */
const STORED_ENTRIES = 20;
const STORED_SEARCHES = 20;

/**
 * Builds one feature's store of recently viewed entities and recent search
 * terms, persisted with Ionic Storage. Purely a convenience layer: if storage
 * fails the lists stay empty and the suggestion sections simply do not render.
 * @param config Devtools name and the storage keys this feature owns
 * @returns A root-provided signal store holding that feature's history
 */
export function createRecentStore(config: RecentStoreConfig) {
  const initialState: RecentSlice = { entries: [], searches: [] };

  return signalStore(
    { providedIn: 'root' },
    withDevtools(config.name),
    withState(initialState),
    withMethods((store) => {
      const storage = inject(StorageService);

      return {
        async load(): Promise<void> {
          const [entries, searches] = await Promise.all([
            storage.get<RecentEntry[]>(config.entriesKey, []),
            storage.get<string[]>(config.searchesKey, [])
          ]);
          patchState(store, {
            entries: entries.slice(0, STORED_ENTRIES),
            searches: searches.slice(0, STORED_SEARCHES)
          });
        },

        recordEntry(entry: RecentEntry): void {
          if (!entry.id || !entry.title) return;

          const current = store.entries();
          // Nothing to do when it is already the newest entry.
          if (current[0]?.id === entry.id) return;

          const entries = [
            entry,
            ...current.filter((existing) => existing.id !== entry.id)
          ].slice(0, STORED_ENTRIES);

          patchState(store, { entries });
          void storage.set(config.entriesKey, entries);
        },

        recordSearch(term: string): void {
          const searchTerm = term.trim();
          if (!searchTerm) return;

          const searches = [
            searchTerm,
            ...store
              .searches()
              .filter(
                (entry) => entry.toLowerCase() !== searchTerm.toLowerCase()
              )
          ].slice(0, STORED_SEARCHES);

          patchState(store, { searches });
          void storage.set(config.searchesKey, searches);
        }
      };
    }),
    withHooks({
      onInit(store) {
        void store.load();
      }
    })
  );
}

/**
 * Narrow a history list to the entries matching the current query, or return it
 * untouched when there is no query.
 * @param entries Entries to narrow
 * @param toText Reads the text an entry is matched on
 * @param query Lowercased search term the list is narrowed by
 * @returns The matching entries
 */
export function filterRecent<T>(
  entries: T[],
  toText: (entry: T) => string,
  query: string
): T[] {
  if (!query) return entries;
  return entries.filter((entry) => toText(entry).toLowerCase().includes(query));
}
