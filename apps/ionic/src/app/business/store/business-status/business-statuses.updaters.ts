import { PartialStateUpdater } from '@ngrx/signals';
import { BusinessStatus } from 'swissparl';
import {
  onRequestError,
  onRequestLoad,
  onRequestSuccess
} from '../../../shared/models/request-state.model';
import { BusinessStatusesSlice } from './business-statuses.store';

/**
 * Creates a state updater that transitions the business statuses request state to loading.
 * This is typically used when initiating a new request to fetch business statuses.
 * @returns A partial state updater function that updates the request state to loading
 * @example
 * ```typescript
 * patchState(store, createLoadBusinessStatusesRequestState());
 * ```
 */
export function createLoadBusinessStatusesRequestState(): PartialStateUpdater<BusinessStatusesSlice> {
  return (state) => ({
    ...state,
    businessStatusesRequestState: onRequestLoad(
      state.businessStatusesRequestState,
      state.businessStatusesRequestState.data
    )
  });
}

/**
 * Creates a state updater that transitions the business statuses request state to success
 * and replaces all existing business statuses data with the new data.
 * This is typically used for initial loads or when refreshing the entire dataset.
 * @param statuses - Array of business statuses to set as the complete data
 * @returns A partial state updater function that updates the request state to success
 *          and sets the new statuses as the complete data
 * @example
 * ```typescript
 * // When loading business statuses for the first time or refreshing
 * patchState(store, createSuccessBusinessStatusesRequestState(newStatuses));
 * ```
 */
export function createSuccessBusinessStatusesRequestState(
  statuses: BusinessStatus[]
): PartialStateUpdater<BusinessStatusesSlice> {
  return (state) => ({
    ...state,
    businessStatusesRequestState: onRequestSuccess(
      state.businessStatusesRequestState,
      statuses
    )
  });
}

/**
 * Creates a state updater that transitions the business statuses request state to error.
 * This is typically used when a request fails, allowing the application to handle the error gracefully.
 * @returns A partial state updater function that updates the request state to error
 * @example
 * ```typescript
 * // When a request to fetch business statuses fails
 * patchState(store, createErrorBusinessStatusesRequestState());
 * ```
 */
export function createErrorBusinessStatusesRequestState(): PartialStateUpdater<BusinessStatusesSlice> {
  return (state) => ({
    ...state,
    businessStatusesRequestState: onRequestError(
      state.businessStatusesRequestState
    )
  });
}
