import { MemberCouncil } from 'swissparl';
import { RequestState } from '../../../shared/models/request-state.model';
import { CouncilMemberFilter } from '../../services/council-member.service';
import { LoadedMember } from '../../models/cantonal-member';
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
      (query.skip ?? 0) === 0,
    isRefreshing:
      councilMemberRequestState.loading &&
      councilMembers().length > 0 &&
      (query.skip ?? 0) === 0,
    isLoadingMore: councilMemberRequestState.loading && (query.skip ?? 0) > 0,
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
 *
 * Reads a dedicated request state rather than searching the list: ids are
 * only unique within one parliament, and a list refresh must not clobber
 * the member on screen.
 * @param selectedMemberRequestState Request state holding the loaded member
 * @returns A view model object with the member and UI state properties
 */
export function createCouncilMemberDetailVm(
  selectedMemberRequestState: RequestState<LoadedMember | null>
): CouncilMemberDetailVm {
  const selected = selectedMemberRequestState.data ?? null;
  return {
    councilMember: selected,
    isLoading: selectedMemberRequestState.loading && !selected,
    hasError: !!selectedMemberRequestState.error
  };
}
