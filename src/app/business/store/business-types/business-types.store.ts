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
import { BusinessType } from 'swissparl';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import {
  createDefaultRequestState,
  RequestState
} from '../../../shared/models/request-state.model';
import { BusinessService } from '../../services/business.service';
import { createBusinessTypesVm } from './business-types.vm-builder';
import {
  createErrorBusinessTypesRequestState,
  createLoadBusinessTypesRequestState,
  createSuccessBusinessTypesRequestState
} from './business-types.updaters';

export type BusinessTypesState = {
  businessTypesRequestState: RequestState<BusinessType[]>;
};

const initialBusinessTypesState: BusinessTypesState = {
  businessTypesRequestState: createDefaultRequestState<BusinessType[]>([])
};

export const BusinessTypesStore = signalStore(
  { providedIn: 'root' },
  withDevtools('BusinessTypesStore'),
  withState(initialBusinessTypesState),
  withComputed((store) => {
    return {
      businessTypesViewModel: computed(() =>
        createBusinessTypesVm(store.businessTypesRequestState())
      )
    };
  }),
  withMethods((store) => {
    const businessService = inject(BusinessService);

    const _loadBusinessTypes = rxMethod<void>(
      pipe(
        tap(() => patchState(store, createLoadBusinessTypesRequestState())),
        switchMap(() =>
          businessService.getBusinessTypes().pipe(
            tapResponse({
              next: (types) =>
                patchState(
                  store,
                  createSuccessBusinessTypesRequestState(types)
                ),
              error: () =>
                patchState(store, createErrorBusinessTypesRequestState())
            })
          )
        )
      )
    );

    _loadBusinessTypes();

    return {};
  })
);
