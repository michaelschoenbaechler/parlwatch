import { Business } from 'swissparl';
import { RequestState } from '../../../shared/models/request-state.model';
import { BusinessFilter } from '../../services/business.service';

export interface BusinessListVm {
  businesses: Business[];
  isRefreshing: boolean;
  noContent: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasError: boolean;
}

export interface BusinessDetailVm {
  business: Business | null;
  hasVotes: boolean;
  isLoading: boolean;
  hasError: boolean;
}

/**
 * Creates a view model for the business list view.
 * This function transforms the raw business data and request state into a structured
 * view model that contains all the necessary properties for rendering the list UI.
 * @param businessRequestState - The current request state containing business data and loading/error status
 * @param query - The current query parameters including pagination (skip, top) and filters
 * @returns A view model object with businesses data and computed UI state properties
 */
export function createBusinessListVm(
  businessRequestState: RequestState<Business[]>,
  query: BusinessFilter
): BusinessListVm {
  return {
    businesses: businesses(),
    noContent: businesses().length === 0,
    isLoading:
      businessRequestState.loading &&
      businesses().length === 0 &&
      (query.skip ?? 0) === 0,
    isRefreshing:
      businessRequestState.loading &&
      businesses().length > 0 &&
      (query.skip ?? 0) === 0,
    isLoadingMore: businessRequestState.loading && (query.skip ?? 0) > 0,
    hasError: !!businessRequestState.error
  };

  /**
   * Helper function to safely extract businesses array from request state.
   * Returns an empty array if data is null or undefined.
   * @returns An array of businesses or an empty array if no data is available
   */
  function businesses(): Business[] {
    return businessRequestState.data || [];
  }
}

/**
 * Creates a view model for the business detail view.
 *
 * Reads a dedicated request state rather than searching the list array: the
 * list is fetched with a `$select` covering only the card fields, so a list
 * row can never satisfy the detail page, and a list refresh would otherwise
 * overwrite the fully loaded business mid-view.
 * @param selectedBusinessRequestState Request state holding the loaded business
 * @returns A view model with the business and UI state properties
 */
export function createBusinessDetailVm(
  selectedBusinessRequestState: RequestState<Business | null>
): BusinessDetailVm {
  const selected = selectedBusinessRequestState.data ?? null;
  return {
    business: selected,
    hasVotes: !!selected?.Votes?.length,
    isLoading: selectedBusinessRequestState.loading && !selected,
    hasError: !!selectedBusinessRequestState.error
  };
}
