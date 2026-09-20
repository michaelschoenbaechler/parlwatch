import { Voting } from 'swissparl';
import { toTally, toVoting } from '../../votes/models/cantonal-vote';
import {
  createEmptyTally,
  talliesByParlGroup,
  talliesByVote,
  tallyVotings,
  toCssColour,
  toDecisionCode,
  toVoteDecision
} from './vote-decision';

describe('vote decisions', () => {
  it('maps the federal codes onto the four buckets', () => {
    expect(toVoteDecision(1)).toBe('yes');
    expect(toVoteDecision(2)).toBe('no');
    expect(toVoteDecision(3)).toBe('abstained');
    expect(toVoteDecision(5)).toBe('not-participated');
    expect(toVoteDecision(7)).toBe('not-participated');
    expect(toVoteDecision(undefined)).toBe('not-participated');
  });

  it('maps the cantonal ballot words onto the same codes', () => {
    expect(toVoteDecision(toDecisionCode('yes'))).toBe('yes');
    expect(toVoteDecision(toDecisionCode('no'))).toBe('no');
    expect(toVoteDecision(toDecisionCode('abstention'))).toBe('abstained');
    expect(toVoteDecision(toDecisionCode('absent'))).toBe('not-participated');
    expect(toVoteDecision(toDecisionCode('further_option'))).toBe(
      'not-participated'
    );
    expect(toVoteDecision(toDecisionCode(null))).toBe('not-participated');
  });

  it('counts ballots per bucket and copes with an unexpanded relation', () => {
    const votings = [
      { Decision: 1 },
      { Decision: 1 },
      { Decision: 2 },
      { Decision: 3 },
      { Decision: 5 }
    ] as Voting[];

    expect(tallyVotings(votings)).toEqual({
      yes: 2,
      no: 1,
      abstained: 1,
      'not-participated': 1,
      total: 5
    });
    expect(tallyVotings(undefined)).toEqual(createEmptyTally());
  });

  it('reads a cantonal voting’s official totals', () => {
    expect(
      toTally({
        results_yes: 3,
        results_no: 2,
        results_abstention: 1,
        results_absent: null
      })
    ).toEqual({
      yes: 3,
      no: 2,
      abstained: 1,
      'not-participated': 0,
      total: 6
    });
    expect(toTally({}).total).toBe(0);
  });

  it('groups ballots by faction, largest first, keyed on the code or the label', () => {
    const votings = [
      { Decision: 1, ParlGroupCode: 'S', ParlGroupColour: '#FFFF0000' },
      { Decision: 2, ParlGroupCode: 'S', ParlGroupColour: '#FFFF0000' },
      { Decision: 1, ParlGroupNameAbbreviation: 'SVP' },
      { Decision: 5 }
    ] as Voting[];

    const groups = talliesByParlGroup(votings);

    expect(groups.map((group) => group.key)).toEqual(['S', 'SVP', '']);
    expect(groups[0].colour).toBe('#FF0000');
    expect(groups[0].tally).toEqual({
      yes: 1,
      no: 1,
      abstained: 0,
      'not-participated': 0,
      total: 2
    });
    expect(groups[1].colour).toBe('transparent');
    expect(talliesByParlGroup(undefined)).toEqual([]);
  });

  it('gives every requested vote a tally, even one without ballots', () => {
    const tallies = talliesByVote([1, 2], [
      { IdVote: 1, Decision: 1 },
      { IdVote: 9, Decision: 1 },
      {}
    ] as Voting[]);

    expect(tallies[1].yes).toBe(1);
    expect(tallies[2]).toEqual(createEmptyTally());
    expect(tallies[9]).toBeUndefined();
    expect(talliesByVote([3], undefined as never)[3].total).toBe(0);
  });

  it('turns the API’s ARGB colour into CSS', () => {
    expect(toCssColour('#FF00BFFF')).toBe('#00BFFF');
    expect(toCssColour('abc')).toBe('transparent');
    expect(toCssColour(undefined)).toBe('transparent');
  });

  it('prefers the harmonised party of an expanded person over the native label', () => {
    const withPerson = toVoting(
      {
        id: 1,
        person_id: 7,
        person_fullname: ' Anna Muster ',
        vote: 'no',
        person_party: { de: 'SP' },
        person: [{ party_harmonized: { de: 'Sozialdemokratische Partei' } }]
      },
      42,
      'de'
    );
    expect(withPerson.ParlGroupNameAbbreviation).toBe(
      'Sozialdemokratische Partei'
    );
    expect(withPerson.FirstName).toBe('Anna Muster');
    expect(withPerson.IdVote).toBe(42);
    expect(withPerson.Decision).toBe(2);

    const bare = toVoting(
      { vote: 'yes', person_party: { de: 'SP' } },
      42,
      'de'
    );
    expect(bare.ParlGroupNameAbbreviation).toBe('SP');
    expect(bare.FirstName).toBe('');
    expect(bare.PersonNumber).toBeUndefined();
  });
});
