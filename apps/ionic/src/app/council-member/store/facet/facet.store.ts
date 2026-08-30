import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { forkJoin, pipe, tap } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { tapResponse } from '@ngrx/operators';
import { computed, inject } from '@angular/core';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import {
  createDefaultRequestState,
  onRequestError,
  onRequestLoad,
  onRequestSuccess,
  RequestState
} from '../../../shared/models/request-state.model';
import { CouncilMemberService } from '../../services/council-member.service';
import {
  emptyMemberFacets,
  MemberFacets,
  toMemberFacets
} from '../../models/member-facets';

export type FacetSlice = {
  facetsRequestState: RequestState<MemberFacets>;
};

const initialFacetState: FacetSlice = {
  facetsRequestState: createDefaultRequestState<MemberFacets>(emptyMemberFacets)
};

/**
 * The option lists behind the member list's canton, faction and party filters.
 *
 * Loaded once and kept for the session: the underlying reference data changes
 * at most once a legislature, and the filter modal must open instantly.
 */
export const MemberFacetStore = signalStore(
  { providedIn: 'root' },
  withDevtools('MemberFacetStore'),
  withState(initialFacetState),
  withComputed((store) => {
    return {
      facets: computed(
        () => store.facetsRequestState().data ?? emptyMemberFacets
      ),
      isLoading: computed(() => store.facetsRequestState().loading)
    };
  }),
  withMethods((store) => {
    const councilMemberService = inject(CouncilMemberService);

    const loadFacets = rxMethod<void>(
      pipe(
        tap(() =>
          patchState(store, (state) => ({
            facetsRequestState: onRequestLoad(state.facetsRequestState)
          }))
        ),
        switchMap(() =>
          forkJoin({
            cantons: councilMemberService.getCantons(),
            parlGroups: councilMemberService.getParlGroups(),
            members: councilMemberService.getSeatedMemberParties()
          }).pipe(
            map(({ cantons, parlGroups, members }) =>
              toMemberFacets(cantons, parlGroups, members)
            ),
            tapResponse({
              next: (facets) =>
                patchState(store, (state) => ({
                  facetsRequestState: onRequestSuccess(
                    state.facetsRequestState,
                    facets
                  )
                })),
              error: () =>
                patchState(store, (state) => ({
                  facetsRequestState: onRequestError(state.facetsRequestState)
                }))
            })
          )
        )
      )
    );

    return {
      /** Loads the option lists, unless they are already in hand. */
      ensureFacetsLoaded: () => {
        const state = store.facetsRequestState();
        if (state.loading || state.success) return;
        loadFacets();
      }
    };
  })
);
