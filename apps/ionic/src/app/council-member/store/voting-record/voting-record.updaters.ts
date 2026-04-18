import { PartialStateUpdater } from '@ngrx/signals';
import { Voting } from 'swissparl';
import {
  onRequestError,
  onRequestLoad,
  onRequestSuccess
} from '../../../shared/models/request-state.model';
import { VotingRecordSlice } from './voting-record.store';

/**
 * Creates a state updater that sets the voting record data.
 * This replaces any existing voting record data with the provided array of voting records.
 * Typically used for initial data loading or complete refresh of voting records.
 * @param voting - Array of voting records to set as the new data
 * @returns A partial state updater function that replaces the current voting record data
 * @example
 * ```typescript
 * const votingRecords = await fetchVotingRecords(memberId);
 * patchState(store, createVotingRecordState(votingRecords));
 * ```
 */
export function createVotingRecordState(
  voting: Voting[]
): PartialStateUpdater<VotingRecordSlice> {
  return (state) => ({
    ...state,
    votingRecordRequestState: {
      ...state.votingRecordRequestState,
      data: voting
    }
  });
}

/**
 * Creates a state updater that transitions the voting record request state to success.
 * This function is called when a voting record data request has completed successfully.
 * @returns A partial state updater function that updates the request state to success
 * @example
 * ```typescript
 * patchState(store, createSuccessVotingRecordRequestState());
 * ```
 */
export function createSuccessVotingRecordRequestState(): PartialStateUpdater<VotingRecordSlice> {
  return (state) => ({
    ...state,
    votingRecordRequestState: onRequestSuccess(
      state.votingRecordRequestState,
      state.votingRecordRequestState.data
    )
  });
}

/**
 * Creates a state updater that transitions the voting record request state to loading.
 * This function is called when initiating a request to fetch voting record data.
 * @returns A partial state updater function that updates the request state to loading
 * @example
 * ```typescript
 * patchState(store, createLoadVotingRecordRequestState());
 * ```
 */
export function createLoadVotingRecordRequestState(): PartialStateUpdater<VotingRecordSlice> {
  return (state) => ({
    ...state,
    votingRecordRequestState: onRequestLoad(
      state.votingRecordRequestState,
      state.votingRecordRequestState.data
    )
  });
}

/**
 * Creates a state updater that transitions the voting record request state to error.
 * This function is called when a voting record data request has failed.
 * @returns A partial state updater function that updates the request state to error
 * @example
 * ```typescript
 * patchState(store, createErrorVotingRecordRequestState());
 * ```
 */
export function createErrorVotingRecordRequestState(): PartialStateUpdater<VotingRecordSlice> {
  return (state) => ({
    ...state,
    votingRecordRequestState: onRequestError(
      state.votingRecordRequestState,
      state.votingRecordRequestState.error
    )
  });
}
