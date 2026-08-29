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
import { switchMap, mergeMap } from 'rxjs/operators';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { Vote } from 'swissparl';
import { tapResponse } from '@ngrx/operators';
import {
  createDefaultRequestState,
  RequestState
} from '../../../shared/models/request-state.model';
import { VoteFilter, VoteService } from '../../services/votes.service';
import { talliesByVote, VoteTally } from '../../models/vote-decision';
import {
  createErrorVotesRequestState,
  createLoadMoreState,
  createLoadVotesRequestState,
  createRefreshState,
  createSuccessVotesAppendRequestState,
  createSuccessVotesRequestState,
  patchQueryState,
  createUpsertDetailedVoteState,
  createTalliesState
} from './vote.updaters';
import {
  createVoteDetailVm,
  createVoteListVm,
  VotingDecisionFilter
} from './vote.vm-builder';

export type VoteSlice = {
  votesRequestState: RequestState<Vote[]>;
  /** Per-vote decision counts, loaded in batches for the whole visible list. */
  tallies: Record<number, VoteTally>;
  selectedVoteId: number | null;
  query: VoteFilter;
};

const initialState: VoteSlice = {
  votesRequestState: createDefaultRequestState<Vote[]>([]),
  tallies: {},
  selectedVoteId: null,
  query: {
    top: 10,
    skip: 0,
    searchTerm: ''
  }
};

/** Caps the OR-filter length of a batched tally request. */
const MAX_TALLY_BATCH = 25;

export const VoteStore = signalStore(
  { providedIn: 'root' },
  withDevtools('VoteStore'),
  withState(initialState),
  withComputed((store) => {
    return {
      votesListViewModel: computed(() =>
        createVoteListVm(store.votesRequestState(), store.query())
      ),
      /** Votes on screen whose tally has not been loaded yet. */
      pendingTallyIds: computed(() => {
        const tallies = store.tallies();
        return (store.votesRequestState().data ?? [])
          .map((vote) => vote.ID)
          .filter((id) => id !== undefined && tallies[id] === undefined)
          .slice(0, MAX_TALLY_BATCH);
      })
    };
  }),
  withMethods((store) => {
    const voteService = inject(VoteService);

    const _fetchVotes = rxMethod<VoteFilter>(
      pipe(
        tap(() => patchState(store, createLoadVotesRequestState())),
        switchMap((query) =>
          voteService.getVotes(query).pipe(
            tapResponse({
              next: (votes) => {
                const updaterFn =
                  (query.skip ?? 0) === 0
                    ? createSuccessVotesRequestState(votes)
                    : createSuccessVotesAppendRequestState(votes);
                patchState(store, updaterFn);
              },
              error: () => patchState(store, createErrorVotesRequestState())
            })
          )
        )
      )
    );

    _fetchVotes(store.query);

    // One request per page of votes instead of one per card: the list only
    // needs counts, and `Vote?$expand=Votings` costs ~257 KB per vote.
    const _fetchTallies = rxMethod<number[]>(
      pipe(
        filter((voteIds: number[]) => voteIds.length > 0),
        switchMap((voteIds) =>
          voteService.getVoteTallies(voteIds).pipe(
            tapResponse({
              next: (votings) =>
                patchState(
                  store,
                  createTalliesState(talliesByVote(voteIds, votings))
                ),
              error: () => patchState(store, createErrorVotesRequestState())
            })
          )
        )
      )
    );

    _fetchTallies(store.pendingTallyIds);

    // Only the detail page needs the individual ballots; the list works off
    // the batched tallies above.
    const _selectVote = rxMethod<number>(
      pipe(
        tap((id: number) => {
          const state = getState(store);
          const existing = state.votesRequestState.data.find(
            (v) => v.ID === id
          );
          if (existing?.Votings?.length) {
            patchState(store, { selectedVoteId: id });
          }
        }),
        // Only fetch if not present or missing Votings
        filter((id: number) => {
          const state = getState(store);
          const existing = state.votesRequestState.data.find(
            (v) => v.ID === id
          );
          return (
            !existing || !(existing.Votings && existing.Votings.length > 0)
          );
        }),
        mergeMap((id: number) =>
          voteService.getVote(id).pipe(
            tapResponse({
              next: (vote) => {
                patchState(store, createUpsertDetailedVoteState(vote, true));
              },
              error: () => patchState(store, createErrorVotesRequestState())
            })
          )
        )
      )
    );

    return {
      reloadVotes: _fetchVotes,
      selectVote: _selectVote,
      loadMore: () => patchState(store, createLoadMoreState()),
      refresh: () => patchState(store, createRefreshState()),
      updateQuery: (query: VoteFilter) =>
        patchState(store, patchQueryState(query)),
      resetQuery: () =>
        patchState(store, () => ({ query: initialState.query })),
      voteDetailViewModel(filter: VotingDecisionFilter) {
        return createVoteDetailVm(
          store.votesRequestState(),
          store.selectedVoteId(),
          filter
        );
      }
    };
  })
);
