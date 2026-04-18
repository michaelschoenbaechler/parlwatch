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
      query.skip === 0,
    isRefreshing:
      businessRequestState.loading &&
      businesses().length > 0 &&
      query.skip === 0,
    isLoadingMore: businessRequestState.loading && query.skip > 0,
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
 * This function finds a specific business by ID from the available data
 * and creates a view model suitable for displaying detailed information about that business.
 * @param businessRequestState - The current request state containing business data and loading/error status
 * @param selectedBusinessId - The ID of the business to display, or null if none selected
 * @returns A view model object with the selected business data and UI state properties
 */
export function createBusinessDetailVm(
  businessRequestState: RequestState<Business[]>,
  selectedBusinessId: number | null
): BusinessDetailVm {
  const selected = business();
  return {
    business: selected,
    hasVotes: !!selected?.Votes?.length,
    isLoading: businessRequestState.loading,
    hasError: !!businessRequestState.error
  };

  /**
   * Helper function to find and return the selected business by ID.
   * Returns null if no matching business is found or if no data is available.
   * @returns The selected Business or null when not found
   */
  function business(): Business | null {
    return (
      businessRequestState.data?.find(
        (business) => business.ID === selectedBusinessId
      ) || null
    );
  }
}
