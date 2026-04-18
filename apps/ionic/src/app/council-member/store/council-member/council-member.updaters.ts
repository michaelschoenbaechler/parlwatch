import { PartialStateUpdater } from '@ngrx/signals';
import { MemberCouncil } from 'swissparl';
import { CouncilMemberFilter } from '../../services/council-member.service';
import {
  onRequestError,
  onRequestLoad,
  onRequestSuccess
} from '../../../shared/models/request-state.model';
import { CouncilMemberState } from './council-member.store';

/**
 * Creates a state updater that transitions the council member request state to success
 * and appends new council members to the existing data array.
 * This function is typically used for "load more" scenarios where additional council members
 * are fetched and should be added to the already loaded members.
 * @param councilMembers - Array of new council members to append to the existing data
 * @returns A partial state updater function that updates the request state to success
 *          and appends the new members to the existing data array
 * @example
 * ```typescript
 * // When loading more council members (pagination)
 * patchState(store, createSuccessCouncilMemberAppendRequestState(newMembers));
 * ```
 */
export function createSuccessCouncilMemberAppendRequestState(
  councilMembers: MemberCouncil[]
): PartialStateUpdater<CouncilMemberState> {
  return (state) => ({
    ...state,
    councilMemberRequestState: onRequestSuccess(
      state.councilMemberRequestState,
      [...(state.councilMemberRequestState.data || []), ...councilMembers]
    )
  });
}

/**
 * Creates a state updater that transitions the council member request state to success
 * and replaces all existing council member data with the new data.
 * This function is typically used for initial loads or when refreshing the entire dataset.
 * @param councilMembers - Array of council members to set as the complete data
 * @returns A partial state updater function that updates the request state to success
 *          and replaces all existing data with the provided members
 * @example
 * ```typescript
 * // When initially loading council members or refreshing the entire list
 * patchState(store, createSuccessCouncilMemberRequestState(allMembers));
 * ```
 */
export function createSuccessCouncilMemberRequestState(
  councilMembers: MemberCouncil[]
): PartialStateUpdater<CouncilMemberState> {
  return (state) => ({
    ...state,
    councilMemberRequestState: onRequestSuccess(
      state.councilMemberRequestState,
      councilMembers
    )
  });
}

/**
 * Creates a state updater that transitions the council member request state to loading.
 * This function is called when initiating a request to fetch council member data.
 * @returns A partial state updater function that updates the request state to loading
 * @example
 * ```typescript
 * patchState(store, createLoadCouncilMembersRequestState());
 * ```
 */
export function createLoadCouncilMembersRequestState(): PartialStateUpdater<CouncilMemberState> {
  return (state) => ({
    ...state,
    councilMemberRequestState: onRequestLoad(
      state.councilMemberRequestState,
      state.councilMemberRequestState.data
    )
  });
}

/**
 * Creates a state updater that transitions the council member request state to error.
 * This function is called when a council member data request has failed.
 * @returns A partial state updater function that updates the request state to error
 * @example
 * ```typescript
 * patchState(store, createErrorCouncilMemberRequestState());
 * ```
 */
export function createErrorCouncilMemberRequestState(): PartialStateUpdater<CouncilMemberState> {
  return (state) => ({
    ...state,
    councilMemberRequestState: onRequestError(
      state.councilMemberRequestState,
      state.councilMemberRequestState.error
    )
  });
}

/**
 * Creates a state updater that advances the pagination offset for loading more data.
 * Increments the skip value by the current top (page size) value to prepare for
 * fetching the next batch of council members.
 * @returns A partial state updater function that updates the query skip offset
 * @example
 * ```typescript
 * patchState(store, createLoadMoreState());
 * ```
 */
export function createLoadMoreState(): PartialStateUpdater<CouncilMemberState> {
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
export function createRefreshState(): PartialStateUpdater<CouncilMemberState> {
  return (state) => ({
    ...state,
    query: {
      ...state.query,
      skip: 0
    }
  });
}

/**
 * Creates a state updater that applies new query parameters while resetting pagination.
 * This merges the provided filter parameters with the existing query state
 * and resets the skip offset to 0 to start fresh with the new filters.
 * @param query - Partial query object containing filter parameters to apply
 * @returns A partial state updater function that updates query parameters and resets pagination
 * @example
 * ```typescript
 * const filter = { canton: 'ZH', party: 'SP' };
 * patchState(store, patchQueryState(filter));
 * ```
 */
export function patchQueryState(
  query: CouncilMemberFilter
): PartialStateUpdater<CouncilMemberState> {
  return (state) => ({
    ...state,
    query: {
      ...state.query,
      ...query,
      skip: 0
    }
  });
}
