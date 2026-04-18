import { BusinessStatus } from 'swissparl';
import { RequestState } from '../../../shared/models/request-state.model';

export interface BusinessStatusesVm {
  statuses: BusinessStatus[];
  isLoading: boolean;
  hasError: boolean;
}

/**
 * Creates a view model for the business statuses view.
 * This function transforms the raw business status data and request state into a structured
 * view model that contains all the necessary properties for rendering the statuses UI.
 * @param businessStatusesRequestState - The current request state containing business status data and loading/error status
 * @returns A view model object with business statuses data and computed UI state properties
 */
export function createBusinessStatusesVm(
  businessStatusesRequestState: RequestState<BusinessStatus[]>
): BusinessStatusesVm {
  const statuses = businessStatusesRequestState.data ?? [];
  return {
    statuses,
    isLoading: businessStatusesRequestState.loading && statuses.length === 0,
    hasError: !!businessStatusesRequestState.error
  };
}
