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
import { MemberCouncil } from 'swissparl';
import { tapResponse } from '@ngrx/operators';
import {
  CouncilMemberFilter,
  CouncilMemberService
} from '../../services/council-member.service';
import {
  createDefaultRequestState,
  RequestState
} from '../../../shared/models/request-state.model';
import {
  createErrorCouncilMemberRequestState,
  createLoadCouncilMembersRequestState,
  createLoadMoreState,
  createRefreshState,
  createSuccessCouncilMemberRequestState,
  patchQueryState,
  createSuccessCouncilMemberAppendRequestState
} from './council-member.updaters';
import {
  createCouncilMemberDetailVm,
  createCouncilMemberListVm
} from './council-member.vm-builder';

export type CouncilMemberState = {
  councilMemberRequestState: RequestState<MemberCouncil[]>;
  selectedCouncilMemberId: number | null;
  query: CouncilMemberFilter;
};

const initialState: CouncilMemberState = {
  councilMemberRequestState: createDefaultRequestState<MemberCouncil[]>([]),
  selectedCouncilMemberId: null,
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
  withComputed((store) => {
    return {
      councilMembersViewModel: computed(() =>
        createCouncilMemberListVm(
          store.councilMemberRequestState(),
          store.query()
        )
      ),
      councilMemberDetailViewModel: computed(() =>
        createCouncilMemberDetailVm(
          store.councilMemberRequestState(),
          store.selectedCouncilMemberId()
        )
      )
    };
  }),
  withMethods((store) => {
    const councilMemberService = inject(CouncilMemberService);

    const _fetchMembers = rxMethod<CouncilMemberFilter>(
      pipe(
        tap(() => patchState(store, createLoadCouncilMembersRequestState())),
        switchMap((query) =>
          councilMemberService.getMembers(query).pipe(
            tapResponse({
              next: (councilMembers) => {
                const updaterFn =
                  query.skip === 0
                    ? createSuccessCouncilMemberRequestState(councilMembers)
                    : createSuccessCouncilMemberAppendRequestState(
                        councilMembers
                      );
                patchState(store, updaterFn);
              },
              error: () =>
                patchState(store, createErrorCouncilMemberRequestState())
            })
          )
        )
      )
    );

    _fetchMembers(store.query);

    const _isMemberInState = (id: number) => {
      const state = getState(store);
      return state.councilMemberRequestState.data.some((b) => b.ID === id);
    };

    const _selectAndLoadCouncilMember = rxMethod<number>(
      pipe(
        filter((id) => {
          const isLoaded = _isMemberInState(id);
          if (isLoaded) {
            patchState(store, { selectedCouncilMemberId: id });
          }
          return !isLoaded;
        }),
        tap(() => patchState(store, createLoadCouncilMembersRequestState())),
        switchMap((id) =>
          councilMemberService.getMemberById(id).pipe(
            tapResponse({
              next: (member) => {
                patchState(
                  store,
                  createSuccessCouncilMemberAppendRequestState([member])
                );
                patchState(store, { selectedCouncilMemberId: id });
              },
              error: () =>
                patchState(store, createErrorCouncilMemberRequestState())
            })
          )
        )
      )
    );

    return {
      reloadMembers: _fetchMembers,
      selectCouncilMember: _selectAndLoadCouncilMember,
      loadMore: () => patchState(store, createLoadMoreState()),
      refresh: () => patchState(store, createRefreshState()),
      updateQuery: (query: CouncilMemberFilter) =>
        patchState(store, patchQueryState(query)),
      resetQuery: () => patchState(store, () => ({ query: initialState.query }))
    };
  })
);
