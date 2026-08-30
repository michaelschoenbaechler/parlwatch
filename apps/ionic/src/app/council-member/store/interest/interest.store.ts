import { PersonInterest } from 'swissparl';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { tapResponse } from '@ngrx/operators';
import { computed, inject } from '@angular/core';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import {
  createDefaultRequestState,
  RequestState
} from '../../../shared/models/request-state.model';
import { CouncilMemberService } from '../../services/council-member.service';
import {
  createErrorInterestRequestState,
  createLoadInterestRequestState,
  createSuccessInterestRequestState
} from './interest.updaters';
import { createInterestVm } from './interest.vm-builder';

export type InterestSlice = {
  interestRequestState: RequestState<PersonInterest[]>;
};

const initialInterestState: InterestSlice = {
  interestRequestState: createDefaultRequestState<PersonInterest[]>([])
};

export const InterestStore = signalStore(
  { providedIn: 'root' },
  withDevtools('InterestStore'),
  withState(initialInterestState),
  withComputed((store) => {
    return {
      interestViewModel: computed(() =>
        createInterestVm(store.interestRequestState())
      )
    };
  }),
  withMethods((store) => {
    const councilMemberService = inject(CouncilMemberService);

    const loadInterests = rxMethod<number>(
      pipe(
        tap(() => patchState(store, createLoadInterestRequestState())),
        switchMap((id) =>
          councilMemberService.getInterests(id).pipe(
            tapResponse({
              next: (interests) =>
                patchState(store, createSuccessInterestRequestState(interests)),
              error: () => patchState(store, createErrorInterestRequestState())
            })
          )
        )
      )
    );

    return {
      loadInterests
    };
  })
);
