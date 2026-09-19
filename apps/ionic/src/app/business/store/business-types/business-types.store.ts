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
import {
  FEDERAL_PARLIAMENT_KEY,
  ParliamentKey
} from '../../../parliament/models/parliament.model';
import { BusinessFacade } from '../../services/business.facade';
import { createBusinessTypesVm } from './business-types.vm-builder';
import {
  createErrorBusinessTypesRequestState,
  createLoadBusinessTypesRequestState,
  createSuccessBusinessTypesRequestState
} from './business-types.updaters';

export type BusinessTypesState = {
  businessTypesRequestState: RequestState<BusinessType[]>;
  /** The parliament the loaded types belong to. */
  parliament: ParliamentKey;
};

const initialBusinessTypesState: BusinessTypesState = {
  businessTypesRequestState: createDefaultRequestState<BusinessType[]>([]),
  parliament: FEDERAL_PARLIAMENT_KEY
};

/**
 * The type options of the business filter, for one parliament at a time.
 * Every parliament numbers its types differently, so switching parliament
 * reloads the list rather than mixing two vocabularies.
 */
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
    const businessFacade = inject(BusinessFacade);

    const _loadBusinessTypes = rxMethod<ParliamentKey>(
      pipe(
        tap(() => patchState(store, createLoadBusinessTypesRequestState())),
        switchMap((parliament) =>
          businessFacade.getBusinessTypes(parliament).pipe(
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

    _loadBusinessTypes(store.parliament);

    return {
      /**
       * Load the types of a parliament, unless they are already in hand.
       * @param parliament The parliament whose types the filter offers
       */
      setParliament(parliament: ParliamentKey) {
        if (store.parliament() === parliament) return;
        patchState(store, {
          parliament,
          businessTypesRequestState: createDefaultRequestState<BusinessType[]>(
            []
          )
        });
      }
    };
  })
);
