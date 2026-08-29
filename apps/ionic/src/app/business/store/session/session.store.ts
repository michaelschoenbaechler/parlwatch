import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { tapResponse } from '@ngrx/operators';
import { Session } from 'swissparl';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import {
  createDefaultRequestState,
  onRequestError,
  onRequestLoad,
  onRequestSuccess,
  RequestState
} from '../../../shared/models/request-state.model';
import { BusinessService } from '../../services/business.service';
import { createSessionsVm } from './session.vm-builder';

export type SessionSlice = {
  sessionsRequestState: RequestState<Session[]>;
};

const initialState: SessionSlice = {
  sessionsRequestState: createDefaultRequestState<Session[]>([])
};

export const SessionStore = signalStore(
  { providedIn: 'root' },
  withDevtools('SessionStore'),
  withState(initialState),
  withComputed((store) => ({
    sessionsViewModel: computed(() =>
      createSessionsVm(store.sessionsRequestState())
    ),
    /**
     * The session the business list defaults to: `undefined` while still
     * loading, `null` when sessions could not be loaded (the list then falls
     * back to showing every session), otherwise the most recent session.
     */
    defaultSessionId: computed<number | null | undefined>(() => {
      const state = store.sessionsRequestState();
      if (state.error) return null;
      if (!state.data?.length) return undefined;
      return state.data[0].ID;
    })
  })),
  withMethods((store) => {
    const businessService = inject(BusinessService);

    const _loadSessions = rxMethod<void>(
      pipe(
        tap(() =>
          patchState(store, (state) => ({
            sessionsRequestState: onRequestLoad(
              state.sessionsRequestState,
              state.sessionsRequestState.data
            )
          }))
        ),
        switchMap(() =>
          businessService.getSessions().pipe(
            tapResponse({
              next: (sessions) =>
                patchState(store, (state) => ({
                  sessionsRequestState: onRequestSuccess(
                    state.sessionsRequestState,
                    sessions
                  )
                })),
              error: () =>
                patchState(store, (state) => ({
                  sessionsRequestState: onRequestError(
                    state.sessionsRequestState
                  )
                }))
            })
          )
        )
      )
    );

    _loadSessions();

    return { reloadSessions: () => _loadSessions() };
  })
);
