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
import {
  createErrorVotesRequestState,
  createLoadMoreState,
  createLoadVotesRequestState,
  createRefreshState,
  createSuccessVotesAppendRequestState,
  createSuccessVotesRequestState,
  patchQueryState,
  createUpsertDetailedVoteState
} from './vote.updaters';
import {
  createVoteDetailVm,
  createVoteListVm,
  VotingDecisionFilter
} from './vote.vm-builder';

export type VoteSlice = {
  votesRequestState: RequestState<Vote[]>;
  selectedVoteId: number | null;
  query: VoteFilter;
};

const initialState: VoteSlice = {
  votesRequestState: createDefaultRequestState<Vote[]>([]),
  selectedVoteId: null,
  query: {
    top: 10,
    skip: 0,
    searchTerm: ''
  }
};

export const VoteStore = signalStore(
  { providedIn: 'root' },
  withDevtools('VoteStore'),
  withState(initialState),
  withComputed((store) => {
    return {
      votesListViewModel: computed(() =>
        createVoteListVm(store.votesRequestState(), store.query())
      )
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

    const _ensureVoteDetail = (options: { selectOnLoad: boolean }) =>
      pipe(
        tap((id: number) => {
          const state = getState(store);
          const existing = state.votesRequestState.data.find(
            (v) => v.ID === id
          );
          if (options.selectOnLoad && existing?.Votings?.length) {
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
                patchState(
                  store,
                  createUpsertDetailedVoteState(vote, options.selectOnLoad)
                );
              },
              error: () => patchState(store, createErrorVotesRequestState())
            })
          )
        )
      );

    return {
      reloadVotes: _fetchVotes,
      selectVote: rxMethod<number>(_ensureVoteDetail({ selectOnLoad: true })),
      loadVoting: rxMethod<number>(_ensureVoteDetail({ selectOnLoad: false })),
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
