import { Voting } from 'swissparl';
import { RequestState } from '../../../shared/models/request-state.model';
import { VotingRecordVm } from './voting-record.vm';

/**
 * Creates a view model for the voting record view.
 * This function transforms the raw voting record data and request state into a structured
 * view model that contains all the necessary properties for rendering the voting record UI.
 * @param votingRecordRequestState - The current request state containing voting record data and loading/error status
 * @returns A view model object with voting records data and computed UI state properties
 */
export function createVotingRecordVm(
  votingRecordRequestState: RequestState<Voting[]>
): VotingRecordVm {
  return {
    votingRecord: votingRecord(),
    hasNoVotingRecord: votingRecord().length === 0,
    isLoading: votingRecordRequestState.loading,
    hasError: !!votingRecordRequestState.error
  };

  /**
   * Helper function to safely extract voting records array from request state.
   * Returns an empty array if data is null or undefined.
   * @returns An array of voting records or an empty array if no data is available
   */
  function votingRecord(): Voting[] {
    return votingRecordRequestState.data || [];
  }
}
