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
import { map, switchMap } from 'rxjs/operators';
import { tapResponse } from '@ngrx/operators';
import { BusinessStatus } from 'swissparl';
import * as _ from 'lodash';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import {
  createDefaultRequestState,
  RequestState
} from '../../../shared/models/request-state.model';
import { BusinessService } from '../../services/business.service';
import { createBusinessStatusesVm } from './business-statuses.vm-builder';
import {
  createErrorBusinessStatusesRequestState,
  createLoadBusinessStatusesRequestState,
  createSuccessBusinessStatusesRequestState
} from './business-statuses.updaters';

export type BusinessStatusesSlice = {
  businessStatusesRequestState: RequestState<BusinessStatus[]>;
};

const initialBusinessStatusesState: BusinessStatusesSlice = {
  businessStatusesRequestState: createDefaultRequestState<BusinessStatus[]>([])
};

export const BusinessStatusesStore = signalStore(
  { providedIn: 'root' },
  withDevtools('BusinessStatusesStore'),
  withState(initialBusinessStatusesState),
  withComputed((store) => {
    return {
      businessStatusesViewModel: computed(() =>
        createBusinessStatusesVm(store.businessStatusesRequestState())
      )
    };
  }),
  withMethods((store) => {
    const businessService = inject(BusinessService);

    const _loadBusinessStatuses = rxMethod<void>(
      pipe(
        tap(() => patchState(store, createLoadBusinessStatusesRequestState())),
        switchMap(() =>
          businessService.getBusinessStatus().pipe(
            map((businessStates) =>
              _.uniqBy(businessStates, 'BusinessStatusId')
            ), // TODO move _.uniqBy to service
            tapResponse({
              next: (statuses) =>
                patchState(
                  store,
                  createSuccessBusinessStatusesRequestState(statuses)
                ),
              error: () =>
                patchState(store, createErrorBusinessStatusesRequestState())
            })
          )
        )
      )
    );

    _loadBusinessStatuses();

    return {};
  })
);
