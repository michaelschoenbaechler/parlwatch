import { Voting } from 'swissparl';

export type VoteDecision = 'yes' | 'no' | 'abstained' | 'not-participated';

/** Display order used by the voting bar, its legend and the detail filter. */
export const VOTE_DECISIONS: readonly VoteDecision[] = [
  'yes',
  'no',
  'abstained',
  'not-participated'
];

export type VoteTally = Record<VoteDecision, number> & { total: number };

export interface ParlGroupTally {
  key: string;
  code: string;
  abbreviation: string;
  colour: string;
  tally: VoteTally;
}

/**
 * Map the API's numeric decision code onto the buckets the app displays.
 * Observed codes: 1 Ja, 2 Nein, 3 Enthaltung, 5 Hat nicht teilgenommen,
 * 6 Entschuldigt gemäss Art. 57 Abs. 4, 7 Die Präsidentin/der Präsident
 * stimmt nicht. Everything that is not an explicit yes, no or abstention
 * counts as not having taken part.
 * @param decision Numeric decision code from a `Voting`
 * @returns The bucket the decision belongs to
 */
export function toVoteDecision(decision: number | undefined): VoteDecision {
  switch (decision) {
    case 1:
      return 'yes';
    case 2:
      return 'no';
    case 3:
      return 'abstained';
    default:
      return 'not-participated';
  }
}

/**
 * An all-zero tally, used for votes whose ballots have not loaded yet.
 * @returns A tally with every bucket at zero
 */
export function createEmptyTally(): VoteTally {
  return {
    yes: 0,
    no: 0,
    abstained: 0,
    'not-participated': 0,
    total: 0
  };
}

/**
 * Count votings per decision bucket.
 * @param votings Votings of a vote; may be an unexpanded OData reference
 * @returns Counts per bucket plus the total number of votings
 */
export function tallyVotings(votings: Voting[] | undefined): VoteTally {
  // Without `$expand` the API returns a deferred reference instead of an array.
  const list = Array.isArray(votings) ? votings : [];

  const tally = createEmptyTally();
  for (const voting of list) {
    tally[toVoteDecision(voting.Decision)] += 1;
    tally.total += 1;
  }

  return tally;
}

/**
 * Split a vote's ballots into one tally per faction, largest faction first.
 *
 * Buckets on `ParlGroupCode` so the grouping survives a language switch, and
 * falls back to the abbreviation for ballots the API reports no code for.
 * Members belonging to no faction end up in one bucket with an empty code.
 * @param votings Votings of a vote; may be an unexpanded OData reference
 * @returns One entry per faction, ordered by how many members it has
 */
export function talliesByParlGroup(
  votings: Voting[] | undefined
): ParlGroupTally[] {
  // Without `$expand` the API returns a deferred reference instead of an array.
  const list = Array.isArray(votings) ? votings : [];
  const groups = new Map<string, ParlGroupTally>();

  for (const voting of list) {
    const code = voting.ParlGroupCode?.trim() ?? '';
    const abbreviation = voting.ParlGroupNameAbbreviation?.trim() ?? '';
    const key = code || abbreviation;

    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        code,
        abbreviation,
        colour: toCssColour(voting.ParlGroupColour),
        tally: createEmptyTally()
      };
      groups.set(key, group);
    }

    group.tally[toVoteDecision(voting.Decision)] += 1;
    group.tally.total += 1;
  }

  return [...groups.values()].sort((a, b) => b.tally.total - a.tally.total);
}

/**
 * Split a batch of votings into one tally per vote.
 *
 * Every requested id gets an entry, including ids the response had no rows
 * for. Without that, a vote with no recorded ballots would stay "missing"
 * forever and the store would keep re-requesting it.
 * @param voteIds The vote ids that were requested
 * @param votings Rows returned for those votes, carrying IdVote and Decision
 * @returns One tally per requested vote id
 */
export function talliesByVote(
  voteIds: number[],
  votings: Voting[]
): Record<number, VoteTally> {
  const tallies: Record<number, VoteTally> = {};
  for (const id of voteIds) {
    tallies[id] = createEmptyTally();
  }

  for (const voting of Array.isArray(votings) ? votings : []) {
    if (voting.IdVote === undefined) continue;
    const tally = tallies[voting.IdVote];
    if (!tally) continue;
    tally[toVoteDecision(voting.Decision)] += 1;
    tally.total += 1;
  }

  return tallies;
}

/**
 * Convert the API's ARGB faction colour (`#FF00BFFF`) to a CSS RGB colour.
 * @param parlGroupColour ARGB colour string from a `Voting`
 * @returns CSS hex colour, or `transparent` when the input is unusable
 */
export function toCssColour(parlGroupColour: string | undefined): string {
  return parlGroupColour && parlGroupColour.length >= 6
    ? `#${parlGroupColour.slice(-6)}`
    : 'transparent';
}
