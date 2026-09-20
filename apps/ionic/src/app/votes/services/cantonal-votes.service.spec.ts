import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { OpenParlDataService } from '@parlwatch/shared/open-parl-data/services/open-parl-data.service';
import {
  allFetches,
  createOpenParlDataSpy,
  lastFetch
} from '@parlwatch/shared/open-parl-data/testing/open-parl-data.testing';
import zhVotings from '@parlwatch/shared/open-parl-data/testing/fixtures/zh-votings.json';
import beVotings from '@parlwatch/shared/open-parl-data/testing/fixtures/be-votings.json';
import vdVotings from '@parlwatch/shared/open-parl-data/testing/fixtures/vd-votings.json';
import zhVotingDetail from '@parlwatch/shared/open-parl-data/testing/fixtures/zh-voting-detail.json';
import zhVotes from '@parlwatch/shared/open-parl-data/testing/fixtures/zh-votes.json';
import { SwissParlService } from '@parlwatch/shared/swissparl/swissparl.service';
import {
  createDefaultRequestState,
  onRequestSuccess
} from '@parlwatch/shared/common/models/request-state.model';
import { talliesByParlGroup } from '@parlwatch/shared/common/models/vote-decision';
import { LoadedVote } from '../models/loaded-vote';
import { createVoteListVm } from '../store/vote/vote.vm-builder';
import { CantonalVoteService } from './cantonal-votes.service';
import { VoteFacade } from './votes.facade';

describe('CantonalVoteService', () => {
  let service: CantonalVoteService;
  let openParlData: jasmine.SpyObj<OpenParlDataService>;

  function configure(responses: Parameters<typeof createOpenParlDataSpy>[0]) {
    openParlData = createOpenParlDataSpy(responses);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: OpenParlDataService, useValue: openParlData },
        { provide: TranslocoService, useValue: { getActiveLang: () => 'de' } }
      ]
    });
    service = TestBed.inject(CantonalVoteService);
  }

  beforeEach(() => {
    configure({
      votings: zhVotings,
      'votings/105953': zhVotingDetail,
      votes: zhVotes
    });
  });

  describe('getVotes', () => {
    it('lists a canton newest first with paging, search and the card fields', () => {
      service
        .getVotes({ parliament: 'ZH', top: 10, skip: 20, searchTerm: 'Solar' })
        .subscribe();

      const { resource, query } = lastFetch(openParlData);
      expect(resource).toBe('votings');
      expect(query['body_key']).toBe('ZH');
      expect(query['sort_by']).toBe('-date');
      expect(query['limit']).toBe(10);
      expect(query['offset']).toBe(20);
      expect(query['search']).toBe('Solar');
      expect(query['lang']).toBe('de');
      expect(String(query['fields'])).toContain('results_yes');
    });

    it('maps votings onto votes that carry their totals', (done) => {
      service.getVotes({ parliament: 'ZH', top: 10 }).subscribe((votes) => {
        const first = votes[0];
        const source = zhVotings.data[0];

        expect(first.ID).toBe(source.id);
        expect(first.BusinessNumber).toBe(source.affair_id);
        expect(first.BusinessTitle).toBe(source.affair_title.de);
        expect(first.VoteEnd).toMatch(/^\/Date\(\d+\)\/$/);
        expect(first.tally).toEqual({
          yes: source.results_yes,
          no: source.results_no,
          abstained: source.results_abstention,
          'not-participated': source.results_absent,
          total:
            source.results_yes +
            source.results_no +
            source.results_abstention +
            source.results_absent
        });
        expect(first.cantonal?.parliament).toBe('ZH');
        done();
      });
    });

    it('shows the voting title as subject only when it adds to the business title', (done) => {
      configure({ votings: beVotings });

      service.getVotes({ parliament: 'BE', top: 10 }).subscribe((votes) => {
        const bern = beVotings.data[0];
        expect(votes[0].BusinessTitle).toBe(bern.affair_title.de);
        expect(votes[0].Subject).toBe(bern.title.de);

        configure({ votings: zhVotings });
        service.getVotes({ parliament: 'ZH', top: 10 }).subscribe((zh) => {
          expect(zh[0].Subject).toBe('');
          done();
        });
      });
    });
  });

  describe('getVote', () => {
    it('fetches the voting and its ballots with the persons expanded', (done) => {
      service.getVote('ZH', 105953).subscribe(() => {
        const calls = allFetches(openParlData);
        expect(calls.map((call) => call.resource)).toEqual([
          'votings/105953',
          'votes'
        ]);
        expect(calls[1].query['voting_id']).toBe(105953);
        expect(calls[1].query['expand']).toBe('person');
        expect(calls[1].query['limit']).toBe(500);
        expect(String(calls[1].query['fields'])).toContain(
          'person.party_harmonized'
        );
        done();
      });
    });

    it('maps ballots onto the federal voting shape with harmonised parties', (done) => {
      service.getVote('ZH', 105953).subscribe((vote: LoadedVote) => {
        expect(vote.ID).toBe(105953);
        expect(vote.tally?.yes).toBe(164);
        expect(vote.Votings?.length).toBe(zhVotes.data.length);

        const yes = vote.Votings?.find((v) => v.Decision === 1);
        const absent = vote.Votings?.find((v) => v.Decision === 5);
        expect(yes).toBeDefined();
        expect(absent).toBeDefined();
        expect(yes?.FirstName).not.toBe('');
        expect(yes?.PersonNumber).toBeGreaterThan(0);
        expect(yes?.ParlGroupNameAbbreviation).toBe(
          zhVotes.data.find((v) => v.vote === 'yes')?.person[0].party_harmonized
            .de
        );

        const groups = talliesByParlGroup(vote.Votings);
        expect(groups.length).toBeGreaterThan(1);
        expect(groups[0].tally.total).toBeGreaterThanOrEqual(
          groups[groups.length - 1].tally.total
        );

        expect(vote.cantonal?.source.url).toContain('recapp');
        done();
      });
    });
  });

  describe('no votings published', () => {
    it('flags a canton with no votings, but not a filtered-empty list', (done) => {
      configure({ votings: vdVotings });

      service.getVotes({ parliament: 'VD', top: 10 }).subscribe((votes) => {
        expect(votes).toEqual([]);
        const state = onRequestSuccess(
          createDefaultRequestState<LoadedVote[]>([]),
          votes
        );

        expect(
          createVoteListVm(state, { parliament: 'VD', top: 10 })
            .noVotingsPublished
        ).toBeTrue();
        expect(
          createVoteListVm(state, {
            parliament: 'VD',
            top: 10,
            searchTerm: 'Budget'
          }).noVotingsPublished
        ).toBeFalse();
        expect(
          createVoteListVm(state, { parliament: 'ch', top: 10 })
            .noVotingsPublished
        ).toBeFalse();
        done();
      });
    });
  });
});

describe('VoteFacade', () => {
  let facade: VoteFacade;
  let swissParl: jasmine.SpyObj<SwissParlService>;
  let openParlData: jasmine.SpyObj<OpenParlDataService>;

  beforeEach(() => {
    swissParl = jasmine.createSpyObj('SwissParlService', ['fetchCollection']);
    swissParl.fetchCollection.and.returnValue(of([]));
    openParlData = createOpenParlDataSpy({
      'votings/105953': zhVotingDetail,
      votes: zhVotes
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: SwissParlService, useValue: swissParl },
        { provide: OpenParlDataService, useValue: openParlData },
        { provide: TranslocoService, useValue: { getActiveLang: () => 'de' } }
      ]
    });

    facade = TestBed.inject(VoteFacade);
  });

  it('serves the federal parliament from parlament.ch', () => {
    facade.getVotes({ parliament: 'ch', top: 10 }).subscribe();
    facade.getVote('ch', 1).subscribe();

    expect(swissParl.fetchCollection).toHaveBeenCalledTimes(2);
    expect(openParlData.fetch).not.toHaveBeenCalled();
  });

  it('serves a canton from OpenParlData', () => {
    facade.getVotes({ parliament: 'BE', top: 10 }).subscribe();
    facade.getVote('ZH', 105953).subscribe();

    expect(openParlData.fetch).toHaveBeenCalledTimes(3);
    expect(swissParl.fetchCollection).not.toHaveBeenCalled();
  });
});
