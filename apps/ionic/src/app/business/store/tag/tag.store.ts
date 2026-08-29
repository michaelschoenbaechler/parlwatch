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
import { Tags } from 'swissparl';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import {
  createDefaultRequestState,
  onRequestError,
  onRequestLoad,
  onRequestSuccess,
  RequestState
} from '../../../shared/models/request-state.model';
import { BusinessService } from '../../services/business.service';
import { createTagsVm } from './tag.vm-builder';

export type TagSlice = {
  tagsRequestState: RequestState<Tags[]>;
};

const initialState: TagSlice = {
  tagsRequestState: createDefaultRequestState<Tags[]>([])
};

export const TagStore = signalStore(
  { providedIn: 'root' },
  withDevtools('TagStore'),
  withState(initialState),
  withComputed((store) => ({
    tagsViewModel: computed(() => createTagsVm(store.tagsRequestState()))
  })),
  withMethods((store) => {
    const businessService = inject(BusinessService);

    const _loadTags = rxMethod<void>(
      pipe(
        tap(() =>
          patchState(store, (state) => ({
            tagsRequestState: onRequestLoad(
              state.tagsRequestState,
              state.tagsRequestState.data
            )
          }))
        ),
        switchMap(() =>
          businessService.getTags().pipe(
            tapResponse({
              next: (tags) =>
                patchState(store, (state) => ({
                  tagsRequestState: onRequestSuccess(
                    state.tagsRequestState,
                    tags
                  )
                })),
              error: () =>
                patchState(store, (state) => ({
                  tagsRequestState: onRequestError(state.tagsRequestState)
                }))
            })
          )
        )
      )
    );

    _loadTags();

    return { reloadTags: () => _loadTags() };
  })
);
