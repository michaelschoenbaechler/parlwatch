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
import { switchMap } from 'rxjs/operators';
import { MemberCouncil, Voting } from 'swissparl';
import { tapResponse } from '@ngrx/operators';
import {
  CouncilMemberFilter,
  CouncilMemberService
} from './services/council-member.service';

type CouncilMemberState = {
  councilMembers: MemberCouncil[];
  selectedCouncilMemberVotingRecord: Voting[];
  selectedCouncilMemberId: number | null;
  hasNoContent: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  isLoadingVotingRecord: boolean;
  hasError: boolean;
  query: CouncilMemberFilter;
};

const initialState: CouncilMemberState = {
  councilMembers: [],
  selectedCouncilMemberVotingRecord: [],
  selectedCouncilMemberId: null,
  hasNoContent: false,
  isLoading: false,
  isLoadingMore: false,
  isRefreshing: false,
  isLoadingVotingRecord: false,
  hasError: false,
  query: {
    top: 20,
    skip: 0,
    searchTerm: '',
    council: [],
    showInactive: false
  }
};

export const CouncilMemberStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(
    ({
      councilMembers,
      selectedCouncilMemberId,
      selectedCouncilMemberVotingRecord
    }) => ({
      selectedCouncilMember: computed(() =>
        councilMembers().find((cm) => cm.ID === selectedCouncilMemberId())
      ),
      hasVotingRecord: computed(
        () => selectedCouncilMemberVotingRecord().length > 0
      )
    })
  ),
  withMethods((store, councilMemberService = inject(CouncilMemberService)) => ({
    loadCouncilMembers: rxMethod<CouncilMemberFilter>(
      pipe(
        tap(() =>
          patchState(store, (state) => ({
            isLoading: state.councilMembers.length === 0,
            hasError: false,
            hasNoContent: false
          }))
        ),
        switchMap((query) =>
          councilMemberService.getMembers(query).pipe(
            tapResponse({
              next: (councilMembers) =>
                patchState(store, (state) => ({
                  councilMembers: state.isRefreshing
                    ? councilMembers
                    : [...state.councilMembers, ...councilMembers],
                  hasNoContent: councilMembers.length === 0
                })),
              error: () => patchState(store, { hasError: true }),
              finalize: () =>
                patchState(store, {
                  isLoading: false,
                  isLoadingMore: false,
                  isRefreshing: false
                })
            })
          )
        )
      )
    ),

    loadMore: () => {
      patchState(store, (state) => ({
        isLoadingMore: true,
        query: {
          ...state.query,
          skip: state.query.skip + state.query.top
        }
      }));
    },

    refresh: () => {
      patchState(store, (state) => ({
        isRefreshing: true,
        query: {
          ...state.query,
          skip: 0
        }
      }));
    },

    updateQuery: (query: CouncilMemberFilter) => {
      patchState(store, (state) => ({
        councilMembers: [],
        query: { ...state.query, ...query }
      }));
    },

    resetQuery: () => {
      patchState(store, () => ({
        query: initialState.query
      }));
    },

    selectCouncilMember: rxMethod<number>(
      pipe(
        filter((id) => {
          const state = getState(store);
          const isLoaded = state.councilMembers.find((b) => b.ID === id);

          if (isLoaded) {
            patchState(store, { selectedCouncilMemberId: id });
          }

          return !isLoaded;
        }),
        tap(() =>
          patchState(store, {
            isLoading: true,
            hasError: false
          })
        ),
        switchMap((id) =>
          councilMemberService.getMemberById(id).pipe(
            tapResponse({
              next: (member) =>
                patchState(store, {
                  councilMembers: [member],
                  selectedCouncilMemberId: member.ID
                }),
              error: () => patchState(store, { hasError: true }),
              finalize: () =>
                patchState(store, {
                  isLoading: false
                })
            })
          )
        )
      )
    ),

    loadVotingRecord: rxMethod<number>(
      pipe(
        tap(() =>
          patchState(store, {
            isLoadingVotingRecord: true,
            hasError: false
          })
        ),
        switchMap((id) =>
          councilMemberService.getVotes(id).pipe(
            tapResponse({
              next: (votes) =>
                patchState(store, {
                  selectedCouncilMemberVotingRecord: votes
                }),
              error: () => patchState(store, { hasError: true }),
              finalize: () =>
                patchState(store, {
                  isLoadingVotingRecord: false
                })
            })
          )
        )
      )
    )
  }))
);
