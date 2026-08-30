import {
  getState,
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { filter, pipe, tap } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { tapResponse } from '@ngrx/operators';
import { Business } from 'swissparl';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import {
  createDefaultRequestState,
  RequestState
} from '../../../shared/models/request-state.model';
import {
  BusinessFilter,
  BusinessService
} from '../../services/business.service';
import { SessionStore } from '../session/session.store';
import {
  createBusinessDetailVm,
  createBusinessListVm
} from './business.vm-builder';
import {
  createApplyDefaultSessionState,
  createErrorBusinessRequestState,
  createErrorSelectedBusinessState,
  createLoadSelectedBusinessState,
  createSuccessSelectedBusinessState,
  createLoadBusinessRequestState,
  createLoadMoreState,
  createRefreshState,
  createSuccessBusinessAppendRequestState,
  createSuccessBusinessRequestState,
  patchQueryState
} from './business.updaters';

export type BusinessSlice = {
  businessRequestState: RequestState<Business[]>;
  /**
   * The business shown on the detail page. Kept separate from the list: the
   * list is fetched with a `$select` for the card fields only, so its rows
   * cannot serve the detail page, and a list refresh must not clobber it.
   */
  selectedBusinessRequestState: RequestState<Business | null>;
  query: BusinessFilter;
};

const initialState: BusinessSlice = {
  businessRequestState: createDefaultRequestState<Business[]>([]),
  selectedBusinessRequestState: createDefaultRequestState<Business | null>(
    null
  ),
  query: {
    top: 20,
    skip: 0,
    searchTerm: '',
    businessTypes: [],
    businessStatuses: [],
    tagIds: [],
    // Left undefined until SessionStore resolves the session to default to,
    // so the list issues one scoped request instead of an unscoped one first.
    sessionId: undefined
  }
};

export const BusinessStore = signalStore(
  { providedIn: 'root' },
  withDevtools('BusinessStore'),
  withState(initialState),
  withComputed((store) => {
    return {
      businessListViewModel: computed(() =>
        createBusinessListVm(store.businessRequestState(), store.query())
      ),
      businessDetailViewModel: computed(() =>
        createBusinessDetailVm(store.selectedBusinessRequestState())
      )
    };
  }),
  withMethods((store) => {
    const businessService = inject(BusinessService);

    const sessionStore = inject(SessionStore);

    const _fetchBusinesses = rxMethod<BusinessFilter>(
      pipe(
        // Wait for the default session; undefined means "not resolved yet".
        filter((query) => query.sessionId !== undefined),
        tap(() => patchState(store, createLoadBusinessRequestState())),
        switchMap((query) =>
          businessService.getBusinesses(query).pipe(
            tapResponse({
              next: (businesses) => {
                const updaterFn =
                  query.skip === 0
                    ? createSuccessBusinessRequestState(businesses)
                    : createSuccessBusinessAppendRequestState(businesses);
                return patchState(store, updaterFn);
              },
              error: () => patchState(store, createErrorBusinessRequestState())
            })
          )
        )
      )
    );

    _fetchBusinesses(store.query);

    // Scope the list to the most recent session once it is known. On failure
    // SessionStore reports null, which means "all sessions" and keeps the list
    // usable rather than stuck on its spinner.
    const _applyDefaultSession = rxMethod<number | null | undefined>(
      pipe(
        filter(
          (sessionId): sessionId is number | null =>
            sessionId !== undefined &&
            getState(store).query.sessionId === undefined
        ),
        tap((sessionId) =>
          patchState(store, createApplyDefaultSessionState(sessionId))
        )
      )
    );

    _applyDefaultSession(sessionStore.defaultSessionId);

    // Always fetches: list rows only carry the card fields, so they can never
    // stand in for the detail page's full text and expanded votes.
    const _selectAndLoadBusiness = rxMethod<number>(
      pipe(
        tap((id) => patchState(store, createLoadSelectedBusinessState(id))),
        switchMap((id) =>
          businessService.getBusiness(id).pipe(
            tapResponse({
              next: (business) =>
                patchState(store, createSuccessSelectedBusinessState(business)),
              error: () => patchState(store, createErrorSelectedBusinessState())
            })
          )
        )
      )
    );

    return {
      reloadBusinesses: _fetchBusinesses,
      selectBusiness: _selectAndLoadBusiness,
      loadMore: () => patchState(store, createLoadMoreState()),
      refresh: () => patchState(store, createRefreshState()),
      updateQuery: (query: BusinessFilter) =>
        patchState(store, patchQueryState(query)),
      resetQuery: () =>
        patchState(store, (state) => ({
          query: { ...initialState.query, sessionId: state.query.sessionId }
        }))
    };
  })
);
