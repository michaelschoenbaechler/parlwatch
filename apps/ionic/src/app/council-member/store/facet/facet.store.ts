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
import { CouncilMemberFacade } from '../../services/council-member.facade';
import {
  emptyMemberFacets,
  MemberFacets,
  toMemberFacets
} from '../../models/member-facets';
import {
  FEDERAL_PARLIAMENT_KEY,
  isCantonal,
  ParliamentKey
} from '../../../parliament/models/parliament.model';

export type FacetSlice = {
  facetsRequestState: RequestState<MemberFacets>;
  /** The parliament the loaded options belong to. */
  parliament: ParliamentKey;
};

const initialFacetState: FacetSlice = {
  facetsRequestState: createDefaultRequestState<MemberFacets>(emptyMemberFacets),
  parliament: FEDERAL_PARLIAMENT_KEY
};

/**
 * The option lists behind the member list's canton, faction and party filters.
 *
 * Loaded once per parliament and kept while that parliament is shown: the
 * underlying reference data changes at most once a legislature, and the
 * filter modal must open instantly. A canton offers harmonised parties only.
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
    const councilMemberFacade = inject(CouncilMemberFacade);

    const federalFacets = () =>
      forkJoin({
        cantons: councilMemberService.getCantons(),
        parlGroups: councilMemberService.getParlGroups(),
        members: councilMemberService.getSeatedMemberParties()
      }).pipe(
        map(({ cantons, parlGroups, members }) =>
          toMemberFacets(cantons, parlGroups, members)
        )
      );

    const cantonalFacets = (parliament: ParliamentKey) =>
      councilMemberFacade
        .getCantonalParties(parliament)
        .pipe(map((parties) => ({ ...emptyMemberFacets, parties })));

    const loadFacets = rxMethod<ParliamentKey>(
      pipe(
        tap(() =>
          patchState(store, (state) => ({
            facetsRequestState: onRequestLoad(state.facetsRequestState)
          }))
        ),
        switchMap((parliament) =>
          (isCantonal(parliament)
            ? cantonalFacets(parliament)
            : federalFacets()
          ).pipe(
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
      /**
       * Loads the option lists of a parliament, unless they are already in
       * hand.
       * @param parliament The parliament being filtered
       */
      ensureFacetsLoaded: (parliament: ParliamentKey) => {
        const state = store.facetsRequestState();
        if (store.parliament() === parliament) {
          if (state.loading || state.success) return;
        } else {
          patchState(store, {
            parliament,
            facetsRequestState:
              createDefaultRequestState<MemberFacets>(emptyMemberFacets)
          });
        }
        loadFacets(parliament);
      }
    };
  })
);
