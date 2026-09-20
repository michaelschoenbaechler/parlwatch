import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { odataTimestamp } from '@parlwatch/shared/common/models';
import { StorageService } from '@parlwatch/shared/common/services';
import {
  ParliamentKey,
  toParliamentKey
} from '@parlwatch/shared/parliament/models';
import { BusinessFacade } from '../../services/business.facade';
import { LoadedBusiness } from '../../models/cantonal-business';
import {
  BusinessHead,
  diffBusiness,
  isSameBusiness,
  modifiedOf,
  snapshotOf,
  WatchCheck,
  WatchedBusiness
} from '../../models/watched-business';

export const WATCHED_BUSINESSES_KEY = 'business.watched';
export const WATCH_CHECK_KEY = 'business.watchCheck';
export const MAX_WATCHED_BUSINESSES = 30;
export const CHECK_INTERVAL_MS = 15 * 60 * 1000;

type WatchedSlice = {
  watched: WatchedBusiness[];
  lastCheck: WatchCheck | null;
  checking: boolean;
};

const initialState: WatchedSlice = {
  watched: [],
  lastCheck: null,
  checking: false
};

export const WatchedBusinessStore = signalStore(
  { providedIn: 'root' },
  withDevtools('WatchedBusinessStore'),
  withState(initialState),
  withComputed((store) => ({
    entries: computed(() =>
      [...store.watched()].sort(
        (a, b) =>
          Number(b.unseen) - Number(a.unseen) || changedAt(b) - changedAt(a)
      )
    ),
    unseenCount: computed(
      () => store.watched().filter((entry) => entry.unseen).length
    ),
    canFollow: computed(() => store.watched().length < MAX_WATCHED_BUSINESSES)
  })),
  withMethods((store) => {
    const storage = inject(StorageService);
    const facade = inject(BusinessFacade);

    let resolveReady: () => void = () => undefined;
    const ready = new Promise<void>((resolve) => (resolveReady = resolve));
    let running: Promise<void> | null = null;

    const setWatched = (watched: WatchedBusiness[]) => {
      patchState(store, { watched });
      void storage.set(WATCHED_BUSINESSES_KEY, watched);
    };

    const setLastCheck = (lastCheck: WatchCheck) => {
      patchState(store, { lastCheck, checking: false });
      void storage.set(WATCH_CHECK_KEY, lastCheck);
    };

    const patchEntry = (
      ref: WatchedBusiness,
      patch: Partial<WatchedBusiness>
    ) =>
      setWatched(
        store
          .watched()
          .map((entry) =>
            isSameBusiness(entry, ref) ? { ...entry, ...patch } : entry
          )
      );

    const find = (parliament: ParliamentKey, id: number) =>
      store
        .watched()
        .find((entry) => isSameBusiness(entry, { parliament, id }));

    const add = (entry: WatchedBusiness): boolean => {
      if (find(entry.parliament, entry.id)) return true;
      if (!store.canFollow()) return false;
      setWatched([...store.watched(), entry]);
      return true;
    };

    const inspect = async (
      entry: WatchedBusiness,
      head: BusinessHead
    ): Promise<boolean> => {
      if (
        head.modified === entry.modified &&
        head.status === entry.snapshot.status
      ) {
        return true;
      }

      let business: LoadedBusiness;
      try {
        business = await firstValueFrom(
          facade.getBusiness(entry.parliament, entry.id)
        );
      } catch {
        return false;
      }

      const current = find(entry.parliament, entry.id);
      if (!current) return true;

      const changes = diffBusiness(current.snapshot, business);
      patchEntry(
        current,
        changes.length
          ? { modified: modifiedOf(business), changes, unseen: true }
          : { modified: modifiedOf(business), snapshot: snapshotOf(business) }
      );
      return true;
    };

    const runCheck = async (): Promise<void> => {
      patchState(store, { checking: true });
      const watched = store.watched();
      if (watched.length === 0) {
        setLastCheck({ at: Date.now(), ok: true });
        return;
      }

      let ok = true;
      try {
        const { heads, failed } = await firstValueFrom(
          facade.getBusinessHeads(watched)
        );
        ok = !failed;
        for (const head of heads) {
          const entry = find(head.parliament, head.id);
          if (entry && !(await inspect(entry, head))) ok = false;
        }
      } catch {
        ok = false;
      }
      setLastCheck({ at: Date.now(), ok });
    };

    return {
      async load(): Promise<void> {
        const [watched, lastCheck] = await Promise.all([
          storage.get<WatchedBusiness[]>(WATCHED_BUSINESSES_KEY, []),
          storage.get<WatchCheck | null>(WATCH_CHECK_KEY, null)
        ]);
        patchState(store, {
          watched: watched.slice(0, MAX_WATCHED_BUSINESSES).map((entry) => ({
            ...entry,
            parliament: toParliamentKey(entry.parliament)
          })),
          lastCheck
        });
        resolveReady();
      },

      whenReady(): Promise<void> {
        return ready;
      },

      isFollowed(parliament: ParliamentKey, id: number): boolean {
        return !!find(parliament, id);
      },

      follow(parliament: ParliamentKey, business: LoadedBusiness): boolean {
        if (business.ID === undefined) return false;
        return add({
          parliament,
          id: business.ID,
          title: business.Title ?? '',
          shortNumber: business.BusinessShortNumber ?? '',
          typeName: business.BusinessTypeName ?? '',
          followedAt: Date.now(),
          modified: modifiedOf(business),
          snapshot: snapshotOf(business),
          changes: [],
          unseen: false
        });
      },

      restore(entry: WatchedBusiness): boolean {
        return add(entry);
      },

      unfollow(parliament: ParliamentKey, id: number): void {
        if (!find(parliament, id)) return;
        setWatched(
          store
            .watched()
            .filter((entry) => !isSameBusiness(entry, { parliament, id }))
        );
      },

      markSeen(
        parliament: ParliamentKey,
        id: number,
        business: LoadedBusiness
      ): void {
        const entry = find(parliament, id);
        if (!entry) return;
        patchEntry(entry, {
          title: business.Title || entry.title,
          shortNumber: business.BusinessShortNumber || entry.shortNumber,
          typeName: business.BusinessTypeName || entry.typeName,
          modified: modifiedOf(business),
          snapshot: snapshotOf(business),
          unseen: false
        });
      },

      async check({ force = false } = {}): Promise<void> {
        await ready;
        if (running) return running;

        const last = store.lastCheck();
        if (!force && last?.ok && Date.now() - last.at < CHECK_INTERVAL_MS) {
          return;
        }

        running = runCheck().finally(() => (running = null));
        return running;
      }
    };
  }),
  withHooks({
    onInit(store) {
      void store.load();
    }
  })
);

function changedAt(entry: WatchedBusiness): number {
  return entry.changes.length
    ? Math.max(...entry.changes.map((change) => odataTimestamp(change.date)))
    : entry.followedAt;
}
