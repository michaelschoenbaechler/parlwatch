import { PartialStateUpdater } from '@ngrx/signals';
import { BusinessType } from 'swissparl';
import {
  onRequestError,
  onRequestLoad,
  onRequestSuccess
} from '../../../shared/models/request-state.model';
import { BusinessTypesState } from './business-types.store';

/**
 * Creates a state updater that transitions the business types request state to loading.
 * This is typically used when initiating a new request to fetch business types.
 * @returns A partial state updater function that updates the request state to loading
 * @example
 * ```typescript
 * patchState(store, createLoadBusinessTypesRequestState());
 * ```
 */
export function createLoadBusinessTypesRequestState(): PartialStateUpdater<BusinessTypesState> {
  return (state) => ({
    ...state,
    businessTypesRequestState: onRequestLoad(
      state.businessTypesRequestState,
      state.businessTypesRequestState.data
    )
  });
}

/**
 * Creates a state updater that transitions the business types request state to success
 * and replaces all existing business types data with the new data.
 * This is typically used for initial loads or when refreshing the entire dataset.
 * @param types - Array of business types to set as the complete data
 * @returns A partial state updater function that updates the request state to success
 *          and sets the new types as the complete data
 * @example
 * ```typescript
 * // When loading business types for the first time or refreshing
 * patchState(store, createSuccessBusinessTypesRequestState(newTypes));
 *         ```
 */
export function createSuccessBusinessTypesRequestState(
  types: BusinessType[]
): PartialStateUpdater<BusinessTypesState> {
  return (state) => ({
    ...state,
    businessTypesRequestState: onRequestSuccess(
      state.businessTypesRequestState,
      types
    )
  });
}

/**
 * Creates a state updater that transitions the business types request state to error.
 * This is typically used when a request fails, allowing the application to handle the error gracefully.
 * @returns A partial state updater function that updates the request state to error
 * @example
 * ```typescript
 * // When a request to fetch business types fails
 * patchState(store, createErrorBusinessTypesRequestState());
 * ```
 */
export function createErrorBusinessTypesRequestState(): PartialStateUpdater<BusinessTypesState> {
  return (state) => ({
    ...state,
    businessTypesRequestState: onRequestError(state.businessTypesRequestState)
  });
}
