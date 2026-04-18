import { Voting } from 'swissparl';
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
  createErrorVotingRecordRequestState,
  createLoadVotingRecordRequestState,
  createSuccessVotingRecordRequestState,
  createVotingRecordState
} from './voting-record.updaters';
import { createVotingRecordVm } from './voting-record.vm-builder';

export type VotingRecordSlice = {
  votingRecordRequestState: RequestState<Voting[]>;
};

const initialVotingRecordState: VotingRecordSlice = {
  votingRecordRequestState: createDefaultRequestState<Voting[]>([])
};

export const VotingRecordStore = signalStore(
  { providedIn: 'root' },
  withDevtools('VotingRecordStore'),
  withState(initialVotingRecordState),
  withComputed((store) => {
    return {
      votingRecordViewModel: computed(() =>
        createVotingRecordVm(store.votingRecordRequestState())
      )
    };
  }),
  withMethods((store) => {
    const councilMemberService = inject(CouncilMemberService);

    const loadVotingRecord = rxMethod<number>(
      pipe(
        tap(() => patchState(store, createLoadVotingRecordRequestState())),
        switchMap((id) =>
          councilMemberService.getVotes(id).pipe(
            tapResponse({
              next: (votes) =>
                patchState(store, createVotingRecordState(votes)),
              error: () =>
                patchState(store, createErrorVotingRecordRequestState()),
              finalize: () =>
                patchState(store, createSuccessVotingRecordRequestState())
            })
          )
        )
      )
    );

    return {
      loadVotingRecord
    };
  })
);
