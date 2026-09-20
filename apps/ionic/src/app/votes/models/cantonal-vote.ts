import { Voting } from 'swissparl';
import { CantonKey } from '@parlwatch/shared/parliament/models';
import {
  localized,
  OpdVote,
  OpdVoting,
  relationList,
  toODataDate
} from '@parlwatch/shared/open-parl-data/models';
import { toDecisionCode, VoteTally } from '@parlwatch/shared/common/models';
import { LoadedVote } from './loaded-vote';

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
