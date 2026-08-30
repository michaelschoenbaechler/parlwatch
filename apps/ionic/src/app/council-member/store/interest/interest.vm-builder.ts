import { PersonInterest } from 'swissparl';
import { RequestState } from '../../../shared/models/request-state.model';
import { toInterestGroups } from '../../models/person-interest';
import { InterestVm } from './interest.vm';

/**
 * Build the view model for a member's register of interests.
 * @param interestRequestState Request state holding the register entries
 * @returns A view model with the grouped entries and UI state properties
 */
export function createInterestVm(
  interestRequestState: RequestState<PersonInterest[]>
): InterestVm {
  const groups = toInterestGroups(interestRequestState.data);

  return {
    groups,
    hasNoInterests: groups.length === 0,
    isLoading: interestRequestState.loading,
    hasError: !!interestRequestState.error
  };
}
