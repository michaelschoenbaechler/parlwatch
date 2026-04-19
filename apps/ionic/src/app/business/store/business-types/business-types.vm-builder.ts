import { BusinessType } from 'swissparl';
import { RequestState } from '../../../shared/models/request-state.model';

export interface BusinessTypesVm {
  types: BusinessType[];
  isLoading: boolean;
  hasError: boolean;
}

/**
 * Creates a view model for the business types view.
 * This function transforms the raw business type data and request state into a structured
 * view model that contains all the necessary properties for rendering the types UI.
 * @param businessTypesRequestState - The current request state containing business type data and loading/error status
 * @returns A view model object with business types data and computed UI state properties
 */
export function createBusinessTypesVm(
  businessTypesRequestState: RequestState<BusinessType[]>
): BusinessTypesVm {
  const types = businessTypesRequestState.data ?? [];
  return {
    types,
    isLoading: businessTypesRequestState.loading && types.length === 0,
    hasError: !!businessTypesRequestState.error
  };
}
