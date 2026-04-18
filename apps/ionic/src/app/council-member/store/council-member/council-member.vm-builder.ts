import { MemberCouncil } from 'swissparl';
import { RequestState } from '../../../shared/models/request-state.model';
import { CouncilMemberFilter } from '../../services/council-member.service';
import {
  CouncilMemberDetailVm,
  CouncilMemberListVm
} from './council-member.vm';

/**
 * Creates a view model for the council member list view.
 * This function transforms the raw council member data and request state into a structured
 * view model that contains all the necessary properties for rendering the list UI.
 * @param councilMemberRequestState - The current request state containing council member data and loading/error status
 * @param query - The current query parameters including pagination (skip, top) and filters
 * @returns A view model object with council members data and computed UI state properties
 */
export function createCouncilMemberListVm(
  councilMemberRequestState: RequestState<MemberCouncil[]>,
  query: CouncilMemberFilter
): CouncilMemberListVm {
  return {
    councilMembers: councilMembers(),
    noContent: councilMembers().length === 0,
    isLoading:
      councilMemberRequestState.loading &&
      councilMembers().length === 0 &&
      query.skip === 0,
    isRefreshing:
      councilMemberRequestState.loading &&
      councilMembers().length > 0 &&
      query.skip === 0,
    isLoadingMore: councilMemberRequestState.loading && query.skip > 0,
    hasError: !!councilMemberRequestState.error
  };

  /**
   * Helper function to safely extract council members array from request state.
   * Returns an empty array if data is null or undefined.
   * @returns An array of council members or an empty array if no data is available
   */
  function councilMembers(): MemberCouncil[] {
    return councilMemberRequestState.data || [];
  }
}

/**
 * Creates a view model for the council member detail view.
 * This function finds a specific council member by ID from the available data
 * and creates a view model suitable for displaying detailed information about that member.
 * @param councilMemberRequestState - The current request state containing council member data and loading/error status
 * @param selectedCouncilMemberId - The ID of the council member to display, or null if none selected
 * @returns A view model object with the selected council member data and UI state properties
 */
export function createCouncilMemberDetailVm(
  councilMemberRequestState: RequestState<MemberCouncil[]>,
  selectedCouncilMemberId: number | null
): CouncilMemberDetailVm {
  return {
    councilMember:
      councilMemberRequestState.data?.find(
        (cm) => cm.ID === selectedCouncilMemberId
      ) || null,
    isLoading: councilMemberRequestState.loading,
    hasError: !!councilMemberRequestState.error
  };
}
