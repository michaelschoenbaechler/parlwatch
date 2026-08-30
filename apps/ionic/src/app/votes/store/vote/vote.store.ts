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
  createTalliesState,
  createErrorSelectedVoteState,
  createLoadSelectedVoteState,
  createSuccessSelectedVoteState
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
  selectedVoteRequestState: RequestState<Vote | null>;
  query: VoteFilter;
};

const initialState: VoteSlice = {
  votesRequestState: createDefaultRequestState<Vote[]>([]),
  tallies: {},
  selectedVoteRequestState: createDefaultRequestState<Vote | null>(null),
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
          .filter(
            (id): id is number => id !== undefined && tallies[id] === undefined
          )
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

    const _hasBallots = (id: number) => {
      const selected = getState(store).selectedVoteRequestState.data;
      return (
        selected?.ID === id &&
        Array.isArray(selected.Votings) &&
        selected.Votings.length > 0
      );
    };

    const _selectVote = rxMethod<number>(
      pipe(
        filter((id: number) => !_hasBallots(id)),
        tap(() => patchState(store, createLoadSelectedVoteState())),
        mergeMap((id: number) =>
          voteService.getVote(id).pipe(
            tapResponse({
              next: (vote) =>
                patchState(store, createSuccessSelectedVoteState(vote)),
              error: () => patchState(store, createErrorSelectedVoteState())
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
        return createVoteDetailVm(store.selectedVoteRequestState(), filter);
      }
    };
  })
);
