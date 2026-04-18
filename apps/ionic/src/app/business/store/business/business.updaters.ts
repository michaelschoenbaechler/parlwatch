import { PartialStateUpdater } from '@ngrx/signals';
import { Business } from 'swissparl';
import {
  onRequestError,
  onRequestLoad,
  onRequestSuccess
} from '../../../shared/models/request-state.model';
import { BusinessFilter } from '../../services/business.service';
import { BusinessSlice } from './business.store';

/**
 * Creates a state updater that transitions the business request state to loading.
 * This is typically used when initiating a new request to fetch businesses.
 * @returns A partial state updater function that updates the request state to loading
 * @example
 * ```typescript
 * patchState(store, createLoadBusinessRequestState());
 * ```
 */
export function createLoadBusinessRequestState(): PartialStateUpdater<BusinessSlice> {
  return (state) => ({
    ...state,
    businessRequestState: onRequestLoad(
      state.businessRequestState,
      state.businessRequestState.data
    )
  });
}

/**
 * Creates a state updater that transitions the business request state to success
 * and appends new businesses to the existing data array.
 * This is typically used for "load more" scenarios where additional businesses
 * are fetched and should be added to the already loaded businesses.
 * @param businesses - Array of new businesses to append to the existing data
 * @returns A partial state updater function that updates the request state to success
 *          and appends the new businesses to the existing data array
 * @example
 * ```typescript
 * // When loading more businesses (pagination)
 * patchState(store, createSuccessBusinessAppendRequestState(newBusinesses));
 * ```
 */
export function createSuccessBusinessAppendRequestState(
  businesses: Business[]
): PartialStateUpdater<BusinessSlice> {
  return (state) => ({
    ...state,
    businessRequestState: onRequestSuccess(state.businessRequestState, [
      ...(state.businessRequestState.data || []),
      ...businesses
    ])
  });
}

/**
 * Creates a state updater that transitions the business request state to success
 * and replaces all existing business data with the new data.
 * This is typically used for initial loads or when refreshing the entire dataset.
 * @param businesses - Array of businesses to set as the complete data
 * @returns A partial state updater function that updates the request state to success
 *          and replaces all existing data with the provided businesses
 * @example
 * ```typescript
 * // When initially loading businesses or refreshing the entire list
 * patchState(store, createSuccessBusinessRequestState(allBusinesses));
 * ```
 */
export function createSuccessBusinessRequestState(
  businesses: Business[]
): PartialStateUpdater<BusinessSlice> {
  return (state) => ({
    ...state,
    businessRequestState: onRequestSuccess(
      state.businessRequestState,
      businesses
    )
  });
}

/**
 * Creates a state updater that transitions the business request state to an error state.
 * This is typically used when a request fails, allowing the application to handle the error gracefully.
 * @returns A partial state updater function that updates the request state to error
 * @example
 * ```typescript
 * patchState(store, createErrorBusinessRequestState());
 * ```
 */
export function createErrorBusinessRequestState(): PartialStateUpdater<BusinessSlice> {
  return (state) => ({
    ...state,
    businessRequestState: onRequestError(state.businessRequestState)
  });
}

/**
 * Creates a state updater that advances the pagination offset for loading more data.
 * Increments the skip value by the current top (page size) value to prepare for
 * fetching the next batch of businesses.
 * @returns A partial state updater function that updates the query skip offset
 * @example
 * ```typescript
 * patchState(store, createLoadMoreState());
 * ```
 */
export function createLoadMoreState(): PartialStateUpdater<BusinessSlice> {
  return (state) => ({
    ...state,
    query: {
      ...state.query,
      skip: state.query.skip + state.query.top
    }
  });
}

/**
 * Creates a state updater that resets the pagination offset to zero.
 * This is typically used when refreshing the data or applying new filters
 * to start from the beginning of the result set.
 * @returns A partial state updater function that resets the query skip to 0
 * @example
 * ```typescript
 * patchState(store, createRefreshState());
 * ```
 */
export function createRefreshState(): PartialStateUpdater<BusinessSlice> {
  return (state) => ({
    ...state,
    query: {
      ...state.query,
      skip: 0
    }
  });
}

/**
 * Patches the query state with new filter criteria and resets the skip offset.
 * This is useful for applying new filters while ensuring the results start from the beginning.
 * @param query The new filter criteria to apply
 * @returns A partial state updater function that updates the query state
 * @example
 * ```typescript
 * patchState(store, patchQueryState({ searchTerm: 'new term' }));
 * ```
 */
export function patchQueryState(
  query: BusinessFilter
): PartialStateUpdater<BusinessSlice> {
  return (state) => ({
    ...state,
    businessRequestState: {
      ...state.businessRequestState,
      data: []
    },
    query: {
      ...state.query,
      ...query,
      skip: 0
    }
  });
}
