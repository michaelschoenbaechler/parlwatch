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
import { tapResponse } from '@ngrx/operators';
import {
  createDefaultRequestState,
  RequestState
} from '../../../shared/common/models/request-state.model';
import {
  FEDERAL_PARLIAMENT_KEY,
  ParliamentKey
} from '../../../shared/parliament/models/parliament.model';
import { VoteFilter, VoteService } from '../../services/votes.service';
import { VoteFacade } from '../../services/votes.facade';
import { LoadedVote } from '../../models/loaded-vote';
import {
  talliesByVote,
  VoteTally
} from '../../../shared/common/models/vote-decision';
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
  votesRequestState: RequestState<LoadedVote[]>;
  tallies: Record<number, VoteTally>;
  selectedVoteRequestState: RequestState<LoadedVote | null>;
  query: VoteFilter;
};

const initialState: VoteSlice = {
  votesRequestState: createDefaultRequestState<LoadedVote[]>([]),
  tallies: {},
  selectedVoteRequestState: createDefaultRequestState<LoadedVote | null>(null),
  query: {
    parliament: FEDERAL_PARLIAMENT_KEY,
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
          .filter((vote) => vote.tally === undefined)
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
    const voteFacade = inject(VoteFacade);

    const _fetchVotes = rxMethod<VoteFilter>(
      pipe(
        tap(() => patchState(store, createLoadVotesRequestState())),
        switchMap((query) =>
          voteFacade.getVotes(query).pipe(
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

    const _fetchTallies = rxMethod<number[]>(
      pipe(
        filter((voteIds: number[]) => voteIds.length > 0),
        mergeMap((voteIds) =>
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

    const _selectVote = rxMethod<{ parliament: ParliamentKey; id: number }>(
      pipe(
        filter(({ id }) => !_hasBallots(id)),
        tap(({ id }) => patchState(store, createLoadSelectedVoteState(id))),
        mergeMap(({ parliament, id }) =>
          voteFacade.getVote(parliament, id).pipe(
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
      /**
       * Load the tallies for votes that are not part of the list — the votes a
       * business carries on its detail page. Already-known ids are dropped so
       * a revisit costs nothing, and the rest go out in batches the OR-filter
       * can carry.
       * @param voteIds Votes whose decision counts should be fetched
       */
      loadTallies: (voteIds: number[]) => {
        const tallies = getState(store).tallies;
        const missing = voteIds.filter((id) => tallies[id] === undefined);

        for (let i = 0; i < missing.length; i += MAX_TALLY_BATCH) {
          _fetchTallies(missing.slice(i, i + MAX_TALLY_BATCH));
        }
      },
      loadMore: () => patchState(store, createLoadMoreState()),
      refresh: () => patchState(store, createRefreshState()),
      updateQuery: (query: VoteFilter) =>
        patchState(store, patchQueryState(query)),
      resetQuery: () =>
        patchState(store, (state) => ({
          query: { ...initialState.query, parliament: state.query.parliament }
        })),
      setParliament(parliament: ParliamentKey) {
        patchState(store, (state) => {
          if (state.query.parliament === parliament) return {};
          return {
            votesRequestState: { ...state.votesRequestState, data: [] },
            query: { ...initialState.query, parliament }
          };
        });
      },
      voteDetailViewModel(filter: VotingDecisionFilter) {
        return createVoteDetailVm(store.selectedVoteRequestState(), filter);
      }
    };
  })
);
