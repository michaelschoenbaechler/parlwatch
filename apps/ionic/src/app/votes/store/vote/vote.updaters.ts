import { PartialStateUpdater } from '@ngrx/signals';
import { Vote } from 'swissparl';
import {
  onRequestError,
  onRequestLoad,
  onRequestSuccess
} from '../../../shared/models/request-state.model';
import { VoteFilter } from '../../services/votes.service';
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
 * Upserts a detailed vote (with votings) into the list and optionally updates the selection.
 * Uses onRequestSuccess to mark the request as successful and set the updated list.
 * @param vote The detailed vote to upsert
 * @param selectOnLoad Whether to update selectedVoteId to this vote's ID
 * @returns Partial updater that upserts the detailed vote and optionally updates selectedVoteId
 */
export function createUpsertDetailedVoteState(
  vote: Vote,
  selectOnLoad: boolean
): PartialStateUpdater<VoteSlice> {
  return (state) => {
    const list = state.votesRequestState.data || [];
    const idx = list.findIndex((v) => v.ID === vote.ID);
    const updated =
      idx >= 0
        ? [...list.slice(0, idx), vote, ...list.slice(idx + 1)]
        : [...list, vote];

    return {
      ...state,
      votesRequestState: onRequestSuccess(state.votesRequestState, updated),
      selectedVoteId: selectOnLoad ? vote.ID : state.selectedVoteId
    };
  };
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
      skip: state.query.skip + state.query.top
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
