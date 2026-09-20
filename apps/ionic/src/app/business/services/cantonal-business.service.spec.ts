import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { OpenParlDataService } from '../../shared/open-parl-data/services/open-parl-data.service';
import {
  allFetches,
  createOpenParlDataSpy,
  lastFetch
} from '../../shared/open-parl-data/testing/open-parl-data.testing';
import zhAffairs from '../../shared/open-parl-data/testing/fixtures/zh-affairs.json';
import beAffairs from '../../shared/open-parl-data/testing/fixtures/be-affairs.json';
import zhAffairDetail from '../../shared/open-parl-data/testing/fixtures/zh-affair-detail.json';
import beAffairDetail from '../../shared/open-parl-data/testing/fixtures/be-affair-detail.json';
import beAffairSpeeches from '../../shared/open-parl-data/testing/fixtures/be-affair-speeches.json';
import zhTypes from '../../shared/open-parl-data/testing/fixtures/zh-types-harmonized.json';
import { CantonalBusinessService } from './cantonal-business.service';

describe('CantonalBusinessService', () => {
  let service: CantonalBusinessService;
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
    service = TestBed.inject(CantonalBusinessService);
  }

  beforeEach(() => {
    configure({
      affairs: zhAffairs,
      'affairs/91382': zhAffairDetail,
      'affairs/130335': beAffairDetail,
      speeches: beAffairSpeeches,
      'affairs/group_by/types_harmonized': zhTypes
    });
  });

  describe('getBusinesses', () => {
    it('lists a canton newest first with paging, language and card fields', () => {
      service
        .getBusinesses({ parliament: 'ZH', top: 20, skip: 40 })
        .subscribe();

      const { resource, query } = lastFetch(openParlData);
      expect(resource).toBe('affairs');
      expect(query['body_key']).toBe('ZH');
      expect(query['sort_by']).toBe('-begin_date');
      expect(query['limit']).toBe(20);
      expect(query['offset']).toBe(40);
      expect(query['lang']).toBe('de');
      expect(query['lang_fallback']).toBe('fr,it,rm,en');
      expect(query['fields']).toBe(
        'id,number,title,type_name,state_name,begin_date'
      );
      expect(query['search']).toBeUndefined();
      expect(query['type_harmonized_id']).toBeUndefined();
    });

    it('filters by harmonised type ids and free text', () => {
      service
        .getBusinesses({
          parliament: 'BE',
          top: 20,
          skip: 0,
          searchTerm: ' Budget ',
          businessTypes: [{ ID: 12 }, { ID: 3 }, {}]
        })
        .subscribe();

      const { query } = lastFetch(openParlData);
      expect(query['type_harmonized_id']).toBe('12,3');
      expect(query['search']).toBe('Budget');
      expect(query['search_scope']).toBe('metadata,docs');
      expect(query['search_mode']).toBe('natural');
    });

    it('substring-matches short terms, stems longer ones and phrases', () => {
      const modeFor = (searchTerm: string) => {
        service
          .getBusinesses({ parliament: 'ZH', top: 20, skip: 0, searchTerm })
          .subscribe();
        return lastFetch(openParlData).query['search_mode'];
      };

      expect(modeFor('SVP')).toBe('partial');
      expect(modeFor('Velo')).toBe('natural');
      expect(modeFor('Velo Winterthur')).toBe('natural');
    });

    it('maps affairs onto the business card with native type and state labels', (done) => {
      service
        .getBusinesses({ parliament: 'ZH', top: 20 })
        .subscribe((businesses) => {
          const first = businesses[0];
          const source = zhAffairs.data[0];

          expect(first.ID).toBe(source.id);
          expect(first.BusinessShortNumber).toBe(source.number);
          expect(first.Title).toBe(source.title.de);
          expect(first.BusinessTypeName).toBe(source.type_name.de);
          expect(first.BusinessStatusText).toBe(source.state_name.de);
          expect(first.SubmissionDate).toMatch(/^\/Date\(\d+\)\/$/);
          expect(first.BusinessStatusDate).toBeUndefined();
          expect(first.TagNames).toBe('');
          done();
        });
    });

    it('shows the German title of a bilingual canton', (done) => {
      configure({ affairs: beAffairs });

      service
        .getBusinesses({ parliament: 'BE', top: 20 })
        .subscribe((businesses) => {
          const bilingual = beAffairs.data.find(
            (affair) => affair.title.de && affair.title.fr
          );
          const mapped = businesses.find((b) => b.ID === bilingual?.id);
          expect(mapped?.Title).toBe(bilingual?.title.de);
          done();
        });
    });
  });

  describe('getBusinessTypes', () => {
    it('aggregates the harmonised types of one canton, alphabetically', (done) => {
      service.getBusinessTypes('ZH').subscribe((types) => {
        const { resource, query } = lastFetch(openParlData);
        expect(resource).toBe('affairs/group_by/types_harmonized');
        expect(query['body_key']).toBe('ZH');
        expect(query['lang']).toBe('de');

        const names = types.map((type) => type.BusinessTypeName ?? '');
        expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
        expect(types.every((type) => typeof type.ID === 'number')).toBeTrue();
        expect(names).toContain('Anfrage');
        done();
      });
    });
  });

  describe('getBusiness', () => {
    it('expands every relation the detail page renders, documents without their text', () => {
      service.getBusiness('ZH', 91382).subscribe();

      const { resource, query } = lastFetch(openParlData);
      expect(resource).toBe('affairs/91382');
      expect(query['expand']).toBe(
        'contributors,events,docs,texts,speeches,votings'
      );
      const fields = String(query['fields']).split(',');
      expect(fields).toContain('docs.url');
      expect(fields).not.toContain('docs.text');
      expect(fields).toContain('events.title_harmonized');
      expect(fields).toContain('votings.results_yes');
      expect(query['lang']).toBe('de');
    });

    it('builds contributors, timeline, documents and votes from a Zürich affair', (done) => {
      service.getBusiness('ZH', 91382).subscribe((business) => {
        expect(business.Title).toBe('Solaranlagen in geschützten Ortsbildern');
        expect(business.BusinessTypeName).toBe('Motion');

        const cantonal = business.cantonal;
        expect(cantonal?.parliament).toBe('ZH');

        const authors = cantonal?.contributors.filter(
          (c) => c.personId !== null
        );
        const bodies = cantonal?.contributors.filter(
          (c) => c.personId === null
        );
        expect(authors?.length).toBeGreaterThan(0);
        expect(bodies?.map((c) => c.name)).toContain('Baudirektion');
        expect(authors?.[0].role).toBe('Urheber/in');

        expect(cantonal?.timeline[0].kind).toBe('submission');
        expect(cantonal?.timeline[0].text).toBe('');
        expect(cantonal?.timeline[1].kind).toBe('status');
        expect(cantonal?.timeline[1].text).toBe('Antrag: Ablehnen');
        expect(cantonal?.timeline[1].council).toBe('Regierung');

        expect(cantonal?.documents.length).toBe(4);
        expect(cantonal?.documents[0].name).not.toContain('_');
        expect(cantonal?.documents[0].url).toMatch(/^https:\/\//);

        expect(cantonal?.votes.length).toBe(2);
        expect(cantonal?.votes[0].tally?.yes).toBe(164);
        expect(cantonal?.votes[0].cantonal?.parliament).toBe('ZH');

        expect(cantonal?.speeches).toEqual([]);
        expect(cantonal?.texts).toEqual([]);

        expect(cantonal?.source.url).toContain('kantonsrat.zh.ch');
        expect(cantonal?.source.updatedAt).toMatch(/^\/Date\(\d+\)\/$/);
        done();
      });
    });

    it('does not ask for speakers when no speech has a transcript', (done) => {
      service.getBusiness('ZH', 91382).subscribe(() => {
        expect(allFetches(openParlData).map((call) => call.resource)).toEqual([
          'affairs/91382'
        ]);
        done();
      });
    });

    it('fetches the speeches with their speakers when a canton publishes transcripts', (done) => {
      service.getBusiness('BE', 130335).subscribe((business) => {
        const calls = allFetches(openParlData);
        expect(calls.map((call) => call.resource)).toEqual([
          'affairs/130335',
          'speeches'
        ]);
        expect(calls[1].query['affair_id']).toBe(130335);
        expect(calls[1].query['expand']).toBe('person');
        expect(calls[1].query['exclude_null']).toBe('person_id');

        const cantonal = business.cantonal;
        expect(cantonal?.speeches.length).toBe(1);
        const speeches = cantonal?.speeches[0].speeches ?? [];
        expect(speeches.length).toBe(beAffairSpeeches.data.length);
        expect(speeches[0].speaker).not.toBe('');
        expect(Object.keys(cantonal?.speechTexts ?? {}).length).toBe(
          speeches.length
        );
        expect(Object.values(cantonal?.speechTexts ?? {}).join(' ')).toContain(
          'Hans Schori'
        );
        done();
      });
    });

    it('copes with sparse records the way a smaller canton delivers them', (done) => {
      configure({
        'affairs/1': {
          id: 1,
          contributors: {
            data: [{ fullname: 'Nur Name', type: 'person' }, { fullname: '  ' }]
          },
          events: {
            data: [
              { date: '2024-01-01', title: { de: 'Nur Titel' } },
              { position: 1 }
            ]
          },
          docs: {
            data: [{ url_oparl: 'https://files/x' }, { name: 'ohne Link' }]
          },
          texts: {
            data: [
              { text: { de: '<p>Text</p>' }, title: { de: 'Antrag' } },
              { text: {} }
            ]
          },
          votings: { data: [{ title: { de: 'Nur Abstimmung' } }] }
        },
        'affairs/group_by/types_harmonized': {
          data: [
            { type_harmonized: { de: 'Ohne Id' } },
            { type_harmonized_id: 4 }
          ]
        }
      });

      service.getBusiness('GL', 1).subscribe((business) => {
        expect(business.BusinessShortNumber).toBe('');
        expect(business.Title).toBe('');

        const cantonal = business.cantonal;
        expect(cantonal?.contributors.map((c) => c.name)).toEqual(['Nur Name']);
        expect(cantonal?.contributors[0].role).toBe('');
        expect(cantonal?.contributors[0].personId).toBeNull();
        expect(cantonal?.timeline.length).toBe(1);
        expect(cantonal?.timeline[0].kind).toBe('status');
        expect(cantonal?.timeline[0].text).toBe('Nur Titel');
        expect(cantonal?.documents.map((d) => d.url)).toEqual([
          'https://files/x'
        ]);
        expect(cantonal?.documents[0].name).toBe('');
        expect(cantonal?.texts.map((t) => t.title)).toEqual(['Antrag']);
        expect(cantonal?.votes[0].BusinessTitle).toBe('Nur Abstimmung');
        expect(cantonal?.votes[0].Subject).toBe('');
        expect(cantonal?.source.url).toBe('');

        service.getBusinessTypes('GL').subscribe((types) => {
          expect(types).toEqual([]);
          done();
        });
      });
    });

    it('reads bilingual Bernese fields in German', (done) => {
      service.getBusiness('BE', 130335).subscribe((business) => {
        expect(business.Title).toContain('Gesetz über die politischen Rechte');
        expect(business.cantonal?.timeline[0].text).toBe('Traktandiert');
        done();
      });
    });
  });
});
