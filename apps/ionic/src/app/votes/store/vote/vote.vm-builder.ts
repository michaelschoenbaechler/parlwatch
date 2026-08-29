import { Vote, Voting } from 'swissparl';
import { RequestState } from '../../../shared/models/request-state.model';
import { VoteFilter } from '../../services/votes.service';
import { toVoteDecision, VoteDecision } from '../../models/vote-decision';

export interface VoteListVm {
  businessGroups: VoteBusinessGroupVm[];
  isRefreshing: boolean;
  noContent: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasError: boolean;
}

export interface VoteBusinessGroupVm {
  key: string;
  businessNumber: number | null;
  businessShortNumber: string;
  businessTitle: string;
  latestVoteEnd: string;
  votes: Vote[];
}

export interface VoteDetailVm {
  vote: Vote | null;
  votings: Voting[];
  isLoading: boolean;
  hasError: boolean;
}

export type VotingDecisionFilter = 'all' | VoteDecision;

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
    businessGroups: groupVotesByBusiness(items()),
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
      : votings.filter((voting) => toVoteDecision(voting.Decision) === filter);
  }
}

/**
 * Group votes by the business they belong to. Votes within a group and the
 * groups themselves are ordered by `VoteEnd` descending, so the most recent
 * vote of the most recently active business comes first.
 * @param votes Flat list of votes as delivered by the API
 * @returns One group per business, each holding its votes newest first
 */
export function groupVotesByBusiness(votes: Vote[]): VoteBusinessGroupVm[] {
  const groups = new Map<string, VoteBusinessGroupVm>();

  for (const vote of votes) {
    const key = businessKey(vote);
    const group = groups.get(key);

    if (group) {
      group.votes.push(vote);
      continue;
    }

    groups.set(key, {
      key,
      businessNumber: vote.BusinessNumber ?? null,
      businessShortNumber: vote.BusinessShortNumber ?? '',
      businessTitle: vote.BusinessTitle ?? '',
      latestVoteEnd: '',
      votes: [vote]
    });
  }

  const ordered = [...groups.values()];

  for (const group of ordered) {
    // Safe to sort in place: every `votes` array is built here, not shared.
    group.votes.sort((a, b) => toTimestamp(b.VoteEnd) - toTimestamp(a.VoteEnd));
    group.latestVoteEnd = group.votes[0].VoteEnd ?? '';
  }

  return ordered.sort(
    (a, b) => toTimestamp(b.latestVoteEnd) - toTimestamp(a.latestVoteEnd)
  );
}

/**
 * Build a stable grouping key for a vote, falling back to the vote itself when
 * the business reference is missing.
 * @param vote The vote to build the key for
 * @returns Key identifying the business the vote belongs to
 */
function businessKey(vote: Vote): string {
  return (
    vote.BusinessNumber?.toString() ??
    vote.BusinessShortNumber ??
    `vote-${vote.ID}`
  );
}

/**
 * Parse an OData date string (`/Date(1234567890)/`) into milliseconds.
 * @param voteEnd The OData date string to parse
 * @returns Milliseconds since epoch, or 0 when the value is unparsable
 */
function toTimestamp(voteEnd: string | undefined): number {
  const parsed = parseInt(
    (voteEnd ?? '').replace('/Date(', '').replace(')/', ''),
    10
  );
  return Number.isNaN(parsed) ? 0 : parsed;
}
