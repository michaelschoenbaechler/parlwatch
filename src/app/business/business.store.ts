import {
  getState,
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState
} from '@ngrx/signals';
import { Business, BusinessStatus, BusinessType } from 'swissparl';
import { computed, inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { BusinessFilter, BusinessService } from './services/business.service';
import { filter, pipe, switchMap, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { tapResponse } from '@ngrx/operators';
import * as _ from 'lodash';

type BusinessState = {
  businesses: Business[];
  businessTypes: BusinessType[];
  businessStatuses: BusinessStatus[];
  selectedBusinessId: number | null;
  hasNoContent: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  hasFilterError: boolean;
  hasError: boolean;
  query: BusinessFilter;
};

const initialState: BusinessState = {
  businesses: [],
  businessTypes: [],
  businessStatuses: [],
  selectedBusinessId: null,
  hasNoContent: false,
  isLoading: false,
  isLoadingMore: false,
  isRefreshing: false,
  hasError: false,
  hasFilterError: false,
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
  withState(initialState),
  withComputed(({ businesses, selectedBusinessId }) => ({
    selectedBusiness: computed(() =>
      businesses().find((b) => b.ID === selectedBusinessId())
    )
  })),
  withMethods((store, businessService = inject(BusinessService)) => ({
    loadBusinesses: rxMethod<BusinessFilter>(
      pipe(
        tap((query) =>
          patchState(store, (state) => ({
            isLoading: state.businesses.length === 0,
            hasError: false,
            hasNoContent: false
          }))
        ),
        switchMap((query) =>
          businessService.getBusinesses(query).pipe(
            tapResponse({
              next: (businesses) =>
                patchState(store, (state) => ({
                  businesses: state.isRefreshing
                    ? businesses
                    : [...state.businesses, ...businesses],
                  hasNoContent: businesses.length === 0
                })),
              error: () => patchState(store, { hasError: true }),
              finalize: () =>
                patchState(store, {
                  isLoading: false,
                  isLoadingMore: false,
                  isRefreshing: false
                })
            })
          )
        )
      )
    ),

    loadMore: () => {
      patchState(store, (state) => ({
        isLoadingMore: true,
        query: {
          ...state.query,
          skip: state.query.skip + state.query.top
        }
      }));
    },

    refresh: () => {
      patchState(store, (state) => ({
        isRefreshing: true,
        query: {
          ...state.query,
          skip: 0
        }
      }));
    },

    updateQuery: (query: BusinessFilter) => {
      patchState(store, (state) => ({
        businesses: [],
        query: { ...state.query, ...query }
      }));
    },

    resetQuery: () => {
      patchState(store, () => ({
        query: initialState.query
      }));
    },

    selectBusiness: rxMethod<number>(
      pipe(
        filter((id) => {
          const state = getState(store);
          const isLoaded = state.businesses.find((b) => b.ID === id);

          if (isLoaded) {
            patchState(store, { selectedBusinessId: id });
          }

          return !isLoaded;
        }),
        tap(() =>
          patchState(store, {
            isLoading: true,
            hasError: false
          })
        ),
        switchMap((id) =>
          businessService.getBusiness(id).pipe(
            tapResponse({
              next: (business) =>
                patchState(store, {
                  businesses: [business],
                  selectedBusinessId: business.ID
                }),
              error: () => patchState(store, { hasError: true }),
              finalize: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),

    loadBusinessStates: rxMethod(
      pipe(
        tap(() =>
          patchState(store, {
            hasFilterError: false
          })
        ),
        switchMap(() =>
          businessService.getBusinessStatus().pipe(
            map((businessStates) =>
              _.uniqBy(businessStates, 'BusinessStatusId')
            ), // TODO move _.uniqBy to service
            tapResponse({
              next: (businessStatuses) =>
                patchState(store, { businessStatuses }),
              error: () => patchState(store, { hasFilterError: true })
            })
          )
        )
      )
    ),

    loadBusinessTypes: rxMethod(
      pipe(
        tap(() =>
          patchState(store, {
            hasFilterError: false
          })
        ),
        switchMap(() =>
          businessService.getBusinessTypes().pipe(
            tapResponse({
              next: (businessTypes) => patchState(store, { businessTypes }),
              error: () => patchState(store, { hasFilterError: true })
            })
          )
        )
      )
    )
  })),

  withHooks({
    onInit: ({ loadBusinesses, loadBusinessStates, loadBusinessTypes }) => {
      loadBusinessStates(null);
      loadBusinessTypes(null);
    }
  })
);
