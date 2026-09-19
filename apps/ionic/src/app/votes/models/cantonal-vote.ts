import { Voting } from 'swissparl';
import { CantonKey } from '../../parliament/models/parliament.model';
import {
  localized,
  relationList,
  toODataDate
} from '../../parliament/models/open-parl-data.model';
import {
  OpdVote,
  OpdVoting
} from '../../parliament/models/open-parl-data.records';
import { LoadedVote } from './loaded-vote';
import { VoteTally } from './vote-decision';

/**
 * The federal decision codes the app's components switch on (see
 * `toVoteDecision`), mapped from the words OpenParlData uses.
 */
const DECISION_CODES: Record<string, number> = {
  yes: 1,
  no: 2,
  abstention: 3,
  absent: 5
};

/** Code for a ballot that is neither yes, no, abstention nor absence. */
const DECISION_OTHER = 7;

/**
 * Map an OpenParlData ballot value to the federal decision code.
 * @param vote The ballot as the API words it
 * @returns The numeric code the vote components understand
 */
export function toDecisionCode(vote: string | null | undefined): number {
  return DECISION_CODES[vote ?? ''] ?? DECISION_OTHER;
}

/**
 * Read a voting's totals into the app's tally shape.
 * @param voting The voting
 * @returns The decision counts
 */
export function toTally(voting: OpdVoting): VoteTally {
  const tally: VoteTally = {
    yes: voting.results_yes ?? 0,
    no: voting.results_no ?? 0,
    abstained: voting.results_abstention ?? 0,
    'not-participated': voting.results_absent ?? 0,
    total: 0
  };
  tally.total =
    tally.yes + tally.no + tally.abstained + tally['not-participated'];
  return tally;
}

/**
 * Map a cantonal voting onto the federal vote shape the vote components render.
 *
 * A voting's own title often just repeats the business title (Zürich) but
 * can name the specific question (Bern: "Art. T2-2, Rückweisungsantrag"), so
 * it is shown as the subject only when it says something new.
 * @param voting The voting as the API returned it
 * @param parliament The canton the voting belongs to
 * @param lang The app's active language
 * @returns The vote, carrying its tally and source
 */
export function toLoadedVote(
  voting: OpdVoting,
  parliament: CantonKey,
  lang: string
): LoadedVote {
  const title = localized(voting.title, lang);
  const businessTitle = localized(voting.affair_title, lang) || title;

  return {
    ID: voting.id,
    BusinessNumber: voting.affair_id ?? undefined,
    BusinessShortNumber: '',
    BusinessTitle: businessTitle,
    Subject: title !== businessTitle ? title : '',
    MeaningYes: localized(voting.meaning_of_yes, lang),
    MeaningNo: localized(voting.meaning_of_no, lang),
    VoteEnd: toODataDate(voting.date),
    Votings: relationList<OpdVote>(voting.votes).map((vote) =>
      toVoting(vote, voting.id, lang)
    ),
    tally: toTally(voting),
    cantonal: {
      parliament,
      source: {
        updatedAt: toODataDate(voting.updated_at ?? voting.updated_external_at),
        url: localized(voting.url_external, lang)
      }
    }
  } as LoadedVote;
}

/**
 * Map one member's ballot onto the federal `Voting` shape.
 *
 * The faction bucket is the harmonised party when the ballot carries its
 * person expanded, otherwise the canton's own party label; the party
 * breakdown and the member list key on it through `ParlGroupNameAbbreviation`.
 * @param vote The ballot as the API returned it
 * @param votingId The voting the ballot belongs to
 * @param lang The app's active language
 * @returns The ballot
 */
export function toVoting(
  vote: OpdVote,
  votingId: number | undefined,
  lang: string
): Voting {
  const person = relationList(vote.person)[0];
  const party =
    localized(person?.party_harmonized, lang) ||
    localized(vote.person_party, lang);

  return {
    ID: vote.id,
    IdVote: votingId,
    PersonNumber: vote.person_id ?? undefined,
    FirstName: vote.person_fullname?.trim() ?? '',
    LastName: '',
    Decision: toDecisionCode(vote.vote),
    ParlGroupCode: '',
    ParlGroupNameAbbreviation: party,
    CantonName: ''
  } as Voting;
}
