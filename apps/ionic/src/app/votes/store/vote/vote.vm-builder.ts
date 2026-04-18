import { Vote, Voting } from 'swissparl';
import { RequestState } from '../../../shared/models/request-state.model';
import { VoteFilter } from '../../services/votes.service';

export interface VoteListVm {
  votes: Vote[];
  isRefreshing: boolean;
  noContent: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasError: boolean;
}

export interface VoteDetailVm {
  vote: Vote | null;
  votings: Voting[];
  isLoading: boolean;
  hasError: boolean;
}

export type VotingDecisionFilter = 'all' | 'yes' | 'no' | 'no-vote';

/**
 * Build the view model for the votes list with loading/refresh states.
 * @param votesRequestState Request state that holds the vote list and status
 * @param query Current list query (pagination and search)
 * @returns VoteListVm derived from state and query
 */
export function createVoteListVm(
  votesRequestState: RequestState<Vote[]>,
  query: VoteFilter
): VoteListVm {
  return {
    votes: items(),
    noContent: items().length === 0,
    isLoading:
      votesRequestState.loading &&
      items().length === 0 &&
      (query.skip ?? 0) === 0,
    isRefreshing:
      votesRequestState.loading &&
      items().length > 0 &&
      (query.skip ?? 0) === 0,
    isLoadingMore: votesRequestState.loading && (query.skip ?? 0) > 0,
    hasError: !!votesRequestState.error
  };

  /**
   * Get the list or an empty array.
   * @returns Vote[] list (never null)
   */
  function items(): Vote[] {
    return votesRequestState.data || [];
  }
}

/**
 * Build the view model for a single vote detail.
 * @param votesRequestState Request state that may contain the selected vote
 * @param selectedVoteId ID of the vote to select
 * @param filter Voting decision filter to apply to the votings list
 * @returns VoteDetailVm derived from state
 */
export function createVoteDetailVm(
  votesRequestState: RequestState<Vote[]>,
  selectedVoteId: number | null,
  filter: VotingDecisionFilter
): VoteDetailVm {
  const selected =
    votesRequestState.data?.find((v) => v.ID === selectedVoteId) ?? null;
  const votings = [...(selected?.Votings || [])];

  return {
    vote: selected,
    votings: filterVotings(),
    isLoading: votesRequestState.loading,
    hasError: !!votesRequestState.error
  };

  /**
   * Filter the votings based on the provided filter.
   * @returns Voting[] filtered list based on the decision
   */
  function filterVotings(): Voting[] {
    return filter === 'all'
      ? votings
      : votings.filter((voting) => {
          return (
            {
              yes: () => voting.Decision === 1,
              no: () => voting.Decision === 2,
              'no-vote': () => voting.Decision !== 1 && voting.Decision !== 2
            } as const
          )[filter]();
        });
  }
}
