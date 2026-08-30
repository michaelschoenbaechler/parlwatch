import { PartialStateUpdater } from '@ngrx/signals';
import { Vote } from 'swissparl';
import {
  onRequestError,
  onRequestLoad,
  onRequestSuccess
} from '../../../shared/models/request-state.model';
import { VoteFilter } from '../../services/votes.service';
import { VoteTally } from '../../models/vote-decision';
import { VoteSlice } from '.';

/**
 * Sets the votes request state to loading while preserving current data.
 * @returns Partial updater to set loading state
 */
export function createLoadVotesRequestState(): PartialStateUpdater<VoteSlice> {
  return (state) => ({
    ...state,
    votesRequestState: onRequestLoad(
      state.votesRequestState,
      state.votesRequestState.data
    )
  });
}

/**
 * Appends fetched votes to the existing list and marks request as successful.
 * @param votes New votes to append
 * @returns Partial updater to append data and mark success
 */
export function createSuccessVotesAppendRequestState(
  votes: Vote[]
): PartialStateUpdater<VoteSlice> {
  return (state) => ({
    ...state,
    votesRequestState: onRequestSuccess(state.votesRequestState, [
      ...(state.votesRequestState.data || []),
      ...votes
    ])
  });
}

/**
 * Replaces the vote list with freshly fetched votes and marks request as successful.
 * @param votes New votes to set
 * @returns Partial updater to replace data and mark success
 */
export function createSuccessVotesRequestState(
  votes: Vote[]
): PartialStateUpdater<VoteSlice> {
  return (state) => ({
    ...state,
    votesRequestState: onRequestSuccess(state.votesRequestState, votes)
  });
}

/**
 * Marks the selected-vote request as loading.
 * @param id The vote being loaded
 * @returns Partial updater setting the detail request to loading
 */
export function createLoadSelectedVoteState(
  id: number
): PartialStateUpdater<VoteSlice> {
  return (state) => {
    const previous = state.selectedVoteRequestState.data ?? null;
    return {
      ...state,
      selectedVoteRequestState: {
        ...onRequestLoad(state.selectedVoteRequestState),
        data: previous?.ID === id ? previous : null
      }
    };
  };
}

/**
 * Stores the fully loaded vote (with its ballots) the detail page shows.
 * @param vote The vote as returned by the detail endpoint
 * @returns Partial updater setting the detail request to success
 */
export function createSuccessSelectedVoteState(
  vote: Vote
): PartialStateUpdater<VoteSlice> {
  return (state) => ({
    ...state,
    selectedVoteRequestState: onRequestSuccess(
      state.selectedVoteRequestState,
      vote
    )
  });
}

/**
 * Marks the selected-vote request as failed.
 * @returns Partial updater setting the detail request to error
 */
export function createErrorSelectedVoteState(): PartialStateUpdater<VoteSlice> {
  return (state) => ({
    ...state,
    selectedVoteRequestState: onRequestError(state.selectedVoteRequestState)
  });
}

/**
 * Sets the votes request state to error.
 * @returns Partial updater to set error state
 */
export function createErrorVotesRequestState(): PartialStateUpdater<VoteSlice> {
  return (state) => ({
    ...state,
    votesRequestState: onRequestError(state.votesRequestState)
  });
}

/**
 * Advances pagination by increasing skip by top.
 * @returns Partial updater to increase skip
 */
export function createLoadMoreState(): PartialStateUpdater<VoteSlice> {
  return (state) => ({
    ...state,
    query: {
      ...state.query,
      skip: (state.query.skip ?? 0) + state.query.top
    }
  });
}

/**
 * Resets pagination to the first page.
 * @returns Partial updater to reset skip
 */
export function createRefreshState(): PartialStateUpdater<VoteSlice> {
  return (state) => ({
    ...state,
    query: {
      ...state.query,
      skip: 0
    }
  });
}

/**
 * Applies query changes, clears current list, and resets pagination.
 * @param query The new vote filter
 * @returns Partial updater to apply query and clear data
 */
export function patchQueryState(
  query: VoteFilter
): PartialStateUpdater<VoteSlice> {
  return (state) => ({
    ...state,
    votesRequestState: {
      ...state.votesRequestState,
      data: []
    },
    query: {
      ...state.query,
      ...query,
      skip: 0
    }
  });
}

/**
 * Merges a batch of freshly computed tallies into the store.
 * @param tallies Tallies keyed by vote id
 * @returns Partial updater that adds the tallies
 */
export function createTalliesState(
  tallies: Record<number, VoteTally>
): PartialStateUpdater<VoteSlice> {
  return (state) => ({
    ...state,
    tallies: { ...state.tallies, ...tallies }
  });
}
