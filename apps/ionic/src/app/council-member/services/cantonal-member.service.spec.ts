import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { OpenParlDataService } from '../../shared/open-parl-data/services/open-parl-data.service';
import {
  createOpenParlDataSpy,
  lastFetch
} from '../../shared/open-parl-data/testing/open-parl-data.testing';
import zhPersons from '../../shared/open-parl-data/testing/fixtures/zh-persons.json';
import zhPersonDetail from '../../shared/open-parl-data/testing/fixtures/zh-person-detail.json';
import bePersonDetail from '../../shared/open-parl-data/testing/fixtures/be-person-detail.json';
import beParties from '../../shared/open-parl-data/testing/fixtures/be-parties-harmonized.json';
import zhPersonVotes from '../../shared/open-parl-data/testing/fixtures/zh-person-votes.json';
import bePersonSpeeches from '../../shared/open-parl-data/testing/fixtures/be-person-speeches.json';
import { SwissParlService } from '../../shared/swissparl/swissparl.service';
import { TranscriptService } from '../../shared/common/services/transcript.service';
import {
  OpdSpeech,
  OpdVote
} from '../../shared/open-parl-data/models/open-parl-data.records';
import { relationList } from '../../shared/open-parl-data/models/open-parl-data.model';
import { odataTimestamp } from '../../shared/common/models/odata.model';
import {
  CantonalMemberService,
  wikidataNumber
} from './cantonal-member.service';
import { CouncilMemberFacade } from './council-member.facade';

const personVotes = zhPersonVotes.data as OpdVote[];
const personSpeeches = bePersonSpeeches.data as OpdSpeech[];

describe('CantonalMemberService', () => {
  let service: CantonalMemberService;
  let openParlData: jasmine.SpyObj<OpenParlDataService>;

  beforeEach(() => {
    openParlData = createOpenParlDataSpy({
      persons: zhPersons,
      'persons/17820': zhPersonDetail,
      'persons/7472': bePersonDetail,
      'persons/group_by/parties_harmonized': beParties,
      votes: zhPersonVotes,
      speeches: bePersonSpeeches
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: OpenParlDataService, useValue: openParlData },
        { provide: TranslocoService, useValue: { getActiveLang: () => 'de' } }
      ]
    });

    service = TestBed.inject(CantonalMemberService);
  });

  describe('getMembers', () => {
    it('lists the sitting members of a canton by name, with search and party filter', () => {
      service
        .getMembers({
          parliament: 'ZH',
          top: 20,
          skip: 20,
          searchTerm: 'Abou',
          parties: [303745, 385258]
        })
        .subscribe();

      const { resource, query } = lastFetch(openParlData);
      expect(resource).toBe('persons');
      expect(query['body_key']).toBe('ZH');
      expect(query['active']).toBeTrue();
      expect(query['sort_by']).toBe('lastname,firstname');
      expect(query['limit']).toBe(20);
      expect(query['offset']).toBe(20);
      expect(query['search']).toBe('Abou');
      expect(query['party_harmonized_wikidata_id']).toBe('Q303745,Q385258');
      expect(query['lang']).toBe('de');
    });

    it('leaves search and party out when nothing is filtered', () => {
      service.getMembers({ parliament: 'ZH', top: 20 }).subscribe();

      const { query } = lastFetch(openParlData);
      expect(query['search']).toBeUndefined();
      expect(query['party_harmonized_wikidata_id']).toBeUndefined();
    });

    it('maps persons onto the member card with the canton on the flag', (done) => {
      service.getMembers({ parliament: 'ZH', top: 20 }).subscribe((members) => {
        const first = members[0];
        const source = zhPersons.data[0];

        expect(first.ID).toBe(source.id);
        expect(first.FirstName).toBe(source.firstname);
        expect(first.LastName).toBe(source.lastname);
        expect(first.PartyAbbreviation).toBe(source.party.de);
        expect(first.PartyName).toBe(source.party_harmonized.de);
        expect(first.CouncilName).toBe(source.electoral_district.de);
        expect(first.CantonAbbreviation).toBe('ZH');
        expect(first.CantonName).toBe('');
        done();
      });
    });
  });

  describe('getParties', () => {
    it('turns the harmonised party aggregation into numbered options', (done) => {
      service.getParties('BE').subscribe((parties) => {
        const { resource, query } = lastFetch(openParlData);
        expect(resource).toBe('persons/group_by/parties_harmonized');
        expect(query['body_key']).toBe('BE');

        expect(parties.length).toBeGreaterThan(0);
        const labels = parties.map((party) => party.label);
        expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)));
        const svp = beParties.data.find(
          (group) => group.party_harmonized_wikidata_id === 'Q385258'
        );
        expect(parties.find((party) => party.id === 385258)?.label).toBe(
          svp?.party_harmonized.de
        );
        done();
      });
    });

    it('reads the number out of a Wikidata id', () => {
      expect(wikidataNumber('Q303745')).toBe(303745);
      expect(wikidataNumber('303745')).toBeUndefined();
      expect(wikidataNumber(null)).toBeUndefined();
    });
  });

  describe('getMember', () => {
    it('expands memberships, interests and images in one request', () => {
      service.getMember('ZH', 17820).subscribe();

      const { resource, query } = lastFetch(openParlData);
      expect(resource).toBe('persons/17820');
      expect(query['expand']).toBe('memberships,interests,person_images');
      expect(String(query['fields'])).toContain(
        'memberships.type_harmonized_oparl_id'
      );
    });

    it('builds the ID card, fraktion, commissions and interests of a Zürich member', (done) => {
      service.getMember('ZH', 17820).subscribe((member) => {
        expect(member.FirstName).toBe('Mandy');
        expect(member.PartyName).toBe('Sozialdemokratische Partei');

        const cantonal = member.cantonal;
        expect(cantonal?.parliament).toBe('ZH');
        expect(cantonal?.imageUrl).toContain('files.openparldata.ch');
        expect(cantonal?.electoralDistrict).toBe('II Zürich 3+9');
        expect(cantonal?.occupation).toBe('Sozialarbeiterin');

        expect(cantonal?.fraktion.map((m) => m.group)).toEqual(['Fraktion SP']);
        expect(cantonal?.fraktion[0].role).toBe('');
        expect(cantonal?.fraktion[0].since).toMatch(/^\/Date\(\d+\)\/$/);
        expect(cantonal?.commissions.length).toBeGreaterThan(0);
        expect(cantonal?.commissions[0].group).toContain('Kommission');

        expect(cantonal?.interests.length).toBe(1);
        expect(cantonal?.interests[0].type).toBe('');
        expect(cantonal?.interests[0].interests.length).toBe(
          zhPersonDetail.interests.data.length
        );
        expect(cantonal?.interests[0].interests[0].paid).toBeFalse();
        expect(cantonal?.interests[0].interests[0].paymentRecorded).toBeFalse();

        expect(cantonal?.source.url).toContain('kantonsrat.zh.ch');
        done();
      });
    });

    it('keeps a role that says more than member, and reads bilingual fields in German', (done) => {
      service.getMember('BE', 7472).subscribe((member) => {
        expect(member.LastName).toBe('Speiser-Niess');
        expect(member.CouncilName).toBe('Oberland');

        const commissions = member.cantonal?.commissions ?? [];
        expect(commissions.length).toBeGreaterThan(0);
        expect(member.cantonal?.fraktion).toEqual([]);
        done();
      });
    });
  });

  describe('sparse records', () => {
    it('fills the card and the sections from whatever a canton publishes', (done) => {
      openParlData = createOpenParlDataSpy({
        'persons/9': {
          id: 9,
          party: { de: 'Parteilos' },
          memberships: {
            data: [
              {
                type_harmonized_oparl_id: 4,
                group_name: { de: 'Fraktion X' },
                role_name: { de: 'Präsidentin' }
              },
              { type_harmonized_oparl_id: 4, group_name: {}, active: true },
              {
                type_harmonized_oparl_id: 2,
                group_name: { de: 'K' },
                active: false
              }
            ]
          },
          interests: {
            data: [
              { name: {} },
              {
                name: { de: 'B' },
                type: { de: 'Verein' },
                type_payment_harmonized: 'paid'
              },
              { name: { de: 'A' } }
            ]
          }
        },
        votes: {
          data: [
            { vote: 'yes' },
            { voting_id: 3, voting: [{ title: { de: 'T' } }] }
          ]
        }
      });
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          { provide: OpenParlDataService, useValue: openParlData },
          { provide: TranslocoService, useValue: { getActiveLang: () => 'de' } }
        ]
      });
      service = TestBed.inject(CantonalMemberService);

      service.getMember('GL', 9).subscribe((member) => {
        expect(member.FirstName).toBe('');
        expect(member.LastName).toBe('');
        expect(member.PartyName).toBe('Parteilos');

        const cantonal = member.cantonal;
        expect(cantonal?.imageUrl).toBe('');
        expect(cantonal?.fraktion.map((m) => m.group)).toEqual(['Fraktion X']);
        expect(cantonal?.fraktion[0].role).toBe('Präsidentin');
        expect(cantonal?.fraktion[0].since).toBe('');
        expect(cantonal?.commissions).toEqual([]);
        expect(cantonal?.interests.map((g) => g.type)).toEqual(['Verein', '']);
        expect(cantonal?.interests[0].interests[0].paid).toBeTrue();
        expect(cantonal?.interests[0].interests[0].paymentRecorded).toBeTrue();
        expect(
          cantonal?.interests[1].interests.map((i) => i.organisation)
        ).toEqual(['A']);

        service.getVotingRecord(9).subscribe((record) => {
          expect(record.length).toBe(1);
          expect(record[0].title).toBe('T');
          expect(record[0].businessNumber).toBeNull();
          expect(record[0].date).toBe('');
          done();
        });
      });
    });
  });

  describe('getVotingRecord', () => {
    it('reads the linked ballots with their votings, newest first', (done) => {
      service.getVotingRecord(18242).subscribe((record) => {
        const { resource, query } = lastFetch(openParlData);
        expect(resource).toBe('votes');
        expect(query['person_id']).toBe(18242);
        expect(query['exclude_null']).toBe('voting_id');
        expect(query['expand']).toBe('voting');
        expect(query['sort_by']).toBe('-voting_id');

        expect(record.length).toBe(personVotes.length);
        const dates = record.map((entry) => odataTimestamp(entry.date));
        expect(dates).toEqual([...dates].sort((a, b) => b - a));
        const newest = personVotes.find(
          (vote) => vote.voting_id === record[0].votingId
        );
        expect(record[0].title).toBe(
          relationList(newest?.voting)[0].affair_title?.['de'] ?? ''
        );
        expect(record[0].decision).toBe(1);
        expect(record[0].date).toMatch(/^\/Date\(\d+\)\/$/);
        done();
      });
    });
  });

  describe('getSpeeches', () => {
    it('reads the speeches with a transcript and groups them by business', (done) => {
      service.getSpeeches('BE', 7472).subscribe((speeches) => {
        const { resource, query } = lastFetch(openParlData);
        expect(resource).toBe('speeches');
        expect(query['person_id']).toBe(7472);
        expect(query['exclude_null']).toBe('text_content_de');
        expect(query['expand']).toBe('affair');
        expect(query['sort_by']).toBe('-date_start');

        const withText = personSpeeches.filter(
          (speech) => speech.text_content?.['de']
        );
        const rows = speeches.groups.flatMap((group) => group.speeches);
        expect(rows.length).toBe(withText.length);
        expect(rows[0].title).toBe(
          relationList(withText[0].affair)[0].title?.['de'] ?? ''
        );
        expect(speeches.texts[rows[0].id]).toContain(
          (withText[0].text_content?.['de'] ?? '').slice(3, 20)
        );
        done();
      });
    });
  });
});

describe('CouncilMemberFacade', () => {
  let facade: CouncilMemberFacade;
  let swissParl: jasmine.SpyObj<SwissParlService>;
  let openParlData: jasmine.SpyObj<OpenParlDataService>;

  beforeEach(() => {
    swissParl = jasmine.createSpyObj('SwissParlService', ['fetchCollection']);
    swissParl.fetchCollection.and.returnValue(of([]));
    openParlData = createOpenParlDataSpy({
      speeches: bePersonSpeeches,
      'persons/7472': bePersonDetail
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: SwissParlService, useValue: swissParl },
        { provide: OpenParlDataService, useValue: openParlData },
        { provide: TranslocoService, useValue: { getActiveLang: () => 'de' } },
        TranscriptService
      ]
    });

    facade = TestBed.inject(CouncilMemberFacade);
  });

  it('serves the federal parliament from parlament.ch', (done) => {
    facade.getMembers({ parliament: 'ch', top: 10 }).subscribe();
    facade.getMember('ch', 4057).subscribe();
    facade.getVotingRecord('ch', 4057).subscribe();
    facade.getSpeechPage('ch', 4057, 20, 0).subscribe((page) => {
      expect(page).toEqual({ speeches: [], texts: {}, hasMore: false });
      expect(swissParl.fetchCollection).toHaveBeenCalled();
      expect(openParlData.fetch).not.toHaveBeenCalled();
      done();
    });
  });

  it('serves a canton from OpenParlData', (done) => {
    facade.getMembers({ parliament: 'ZH', top: 10 }).subscribe();
    facade.getMember('BE', 7472).subscribe();
    facade.getVotingRecord('ZH', 18242).subscribe();
    facade.getCantonalParties('BE').subscribe();
    facade.getSpeechPage('BE', 7472, 20, 0).subscribe((page) => {
      expect(page.hasMore).toBeFalse();
      expect(page.speeches.length).toBeGreaterThan(0);
      expect(Object.keys(page.texts).length).toBe(page.speeches.length);
      expect(openParlData.fetch).toHaveBeenCalledTimes(5);
      expect(swissParl.fetchCollection).not.toHaveBeenCalled();
      done();
    });
  });

  it('has nothing more to page and no body to fetch for a cantonal member', (done) => {
    facade.getSpeechPage('BE', 7472, 20, 20).subscribe((page) => {
      expect(page).toEqual({ speeches: [], texts: {}, hasMore: false });
      facade.getSpeechText('BE', 1).subscribe((text) => {
        expect(text).toBe('');
        expect(openParlData.fetch).not.toHaveBeenCalled();
        done();
      });
    });
  });

  it('offers no cantonal parties for the federal parliament', (done) => {
    facade.getCantonalParties('ch').subscribe((parties) => {
      expect(parties).toEqual([]);
      done();
    });
  });
});
