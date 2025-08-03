import { Voting } from 'swissparl';

export interface VotingRecordVm {
  votingRecord: Voting[];
  hasNoVotingRecord: boolean;
  isLoading: boolean;
  hasError: boolean;
}
