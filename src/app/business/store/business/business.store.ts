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
import {
  createBusinessDetailVm,
  createBusinessListVm
} from './business.vm-builder';
import {
  createErrorBusinessRequestState,
  createLoadBusinessRequestState,
  createLoadMoreState,
  createRefreshState,
  createSuccessBusinessAppendRequestState,
  createSuccessBusinessRequestState,
  patchQueryState
} from './business.updaters';

export type BusinessSlice = {
  businessRequestState: RequestState<Business[]>;
  selectedBusinessId: number | null;
  query: BusinessFilter;
};

const initialState: BusinessSlice = {
  businessRequestState: createDefaultRequestState<Business[]>([]),
  selectedBusinessId: null,
  query: {
    top: 20,
    skip: 0,
    searchTerm: '',
    businessTypes: [],
    businessStatuses: []
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
        createBusinessDetailVm(
          store.businessRequestState(),
          store.selectedBusinessId()
        )
      )
    };
  }),
  withMethods((store) => {
    const businessService = inject(BusinessService);

    const _fetchBusinesses = rxMethod<BusinessFilter>(
      pipe(
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

    const _isBusinessInState = (id: number) => {
      const state = getState(store);
      return state.businessRequestState.data.some((b) => b.ID === id);
    };

    const _selectAndLoadBusiness = rxMethod<number>(
      pipe(
        filter((id) => {
          const isLoaded = _isBusinessInState(id);
          if (isLoaded) {
            patchState(store, { selectedBusinessId: id });
          }
          return !isLoaded;
        }),
        tap(() => patchState(store, createLoadBusinessRequestState())),
        switchMap((id) =>
          businessService.getBusiness(id).pipe(
            tapResponse({
              next: (business) =>
                patchState(
                  store,
                  createSuccessBusinessRequestState([business])
                ),
              error: () => patchState(store, createErrorBusinessRequestState())
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
      resetQuery: () => patchState(store, () => ({ query: initialState.query }))
    };
  })
);
