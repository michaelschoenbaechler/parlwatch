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
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { CouncilMemberFilter } from '../../services/council-member.service';
import { CouncilMemberFacade } from '../../services/council-member.facade';
import {
  createDefaultRequestState,
  RequestState
} from '../../../shared/models/request-state.model';
import {
  FEDERAL_PARLIAMENT_KEY,
  isCantonal,
  ParliamentKey
} from '../../../parliament/models/parliament.model';
import { LoadedMember } from '../../models/cantonal-member';
import {
  createErrorCouncilMemberRequestState,
  createErrorSelectedMemberState,
  createLoadCouncilMembersRequestState,
  createLoadMoreState,
  createLoadSelectedMemberState,
  createRefreshState,
  createSuccessCouncilMemberRequestState,
  createSuccessSelectedMemberState,
  patchQueryState,
  createSuccessCouncilMemberAppendRequestState
} from './council-member.updaters';
import {
  createCouncilMemberDetailVm,
  createCouncilMemberListVm
} from './council-member.vm-builder';

export type CouncilMemberState = {
  councilMemberRequestState: RequestState<MemberCouncil[]>;
  /**
   * The member shown on the detail page. Kept apart from the list: ids are
   * only unique within one parliament, and a cantonal list row lacks the
   * memberships and interests the detail page shows.
   */
  selectedMemberRequestState: RequestState<LoadedMember | null>;
  query: CouncilMemberFilter;
};

const initialState: CouncilMemberState = {
  councilMemberRequestState: createDefaultRequestState<MemberCouncil[]>([]),
  selectedMemberRequestState: createDefaultRequestState<LoadedMember | null>(
    null
  ),
  query: {
    parliament: FEDERAL_PARLIAMENT_KEY,
    top: 20,
    skip: 0,
    searchTerm: '',
    council: [],
    showInactive: false
  }
};

export const CouncilMemberStore = signalStore(
  { providedIn: 'root' },
  withDevtools('CouncilMemberStore'),
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
        createCouncilMemberDetailVm(store.selectedMemberRequestState())
      )
    };
  }),
  withMethods((store) => {
    const councilMemberFacade = inject(CouncilMemberFacade);

    const _fetchMembers = rxMethod<CouncilMemberFilter>(
      pipe(
        tap(() => patchState(store, createLoadCouncilMembersRequestState())),
        switchMap((query) =>
          councilMemberFacade.getMembers(query).pipe(
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

    /**
     * A federal list row carries everything the detail page shows, so it is
     * reused. A cantonal row does not, and a row from another parliament may
     * share the id, so anything cantonal is always fetched.
     * @param parliament The member's parliament
     * @param id The member's id
     * @returns The list row that can serve as the detail, if any
     */
    const _listedMember = (
      parliament: ParliamentKey,
      id: number
    ): MemberCouncil | undefined => {
      const state = getState(store);
      if (isCantonal(parliament) || isCantonal(state.query.parliament)) {
        return undefined;
      }
      return (state.councilMemberRequestState.data ?? []).find(
        (member) => member.ID === id
      );
    };

    const _selectAndLoadCouncilMember = rxMethod<{
      parliament: ParliamentKey;
      id: number;
    }>(
      pipe(
        filter(({ parliament, id }) => {
          const listed = _listedMember(parliament, id);
          if (listed) {
            patchState(store, createSuccessSelectedMemberState(listed));
          }
          return !listed;
        }),
        tap(({ id }) => patchState(store, createLoadSelectedMemberState(id))),
        switchMap(({ parliament, id }) =>
          councilMemberFacade.getMember(parliament, id).pipe(
            tapResponse({
              next: (member) =>
                patchState(store, createSuccessSelectedMemberState(member)),
              error: () => patchState(store, createErrorSelectedMemberState())
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
      resetQuery: () =>
        patchState(store, (state) => ({
          query: { ...initialState.query, parliament: state.query.parliament }
        })),
      /**
       * Point the list at another parliament. Filters do not carry over:
       * councils, cantons and party ids of one parliament mean nothing in
       * another.
       * @param parliament The parliament to list
       */
      setParliament: (parliament: ParliamentKey) =>
        patchState(store, (state) => {
          if (state.query.parliament === parliament) return {};
          return {
            councilMemberRequestState: {
              ...state.councilMemberRequestState,
              data: []
            },
            query: { ...initialState.query, parliament }
          };
        })
    };
  })
);
