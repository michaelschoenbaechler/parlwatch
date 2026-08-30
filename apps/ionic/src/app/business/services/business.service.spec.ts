import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { SwissParlService } from '../../shared/services/swissparl.service';
import { BusinessService } from './business.service';

describe('BusinessService', () => {
  let service: BusinessService;
  let swissParlServiceSpy: jasmine.SpyObj<SwissParlService>;

  beforeEach(() => {
    swissParlServiceSpy = jasmine.createSpyObj('SwissParlService', [
      'fetchCollection'
    ]);
    swissParlServiceSpy.fetchCollection.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        BusinessService,
        { provide: SwissParlService, useValue: swissParlServiceSpy },
        { provide: TranslocoService, useValue: { getActiveLang: () => 'de' } }
      ]
    });

    service = TestBed.inject(BusinessService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should query businesses with language filter and exclude 00.000', () => {
    service.getBusinesses({ top: 10 }).subscribe();

    const [collection, options] =
      swissParlServiceSpy.fetchCollection.calls.mostRecent().args;
    expect(collection).toBe('Business');
    const filter = options.filter as any;
    expect(filter.eq).toContain({ Language: 'DE' });
    expect(filter.ne).toEqual([{ BusinessShortNumber: '00.000' }]);
    expect(options.top).toBe(10);
  });

  it('should add substring filter for search term', () => {
    service.getBusinesses({ top: 10, searchTerm: 'budget' }).subscribe();

    const [, options] =
      swissParlServiceSpy.fetchCollection.calls.mostRecent().args;
    const filter = options.filter as any;
    expect(filter.substringOf).toEqual([
      {
        Title: 'budget',
        TagNames: 'budget'
      }
    ]);
  });

  it('should convert short business number and use ID filter', () => {
    service.getBusinesses({ top: 10, searchTerm: '23.3456' }).subscribe();

    const [, options] =
      swissParlServiceSpy.fetchCollection.calls.mostRecent().args;
    const filter = options.filter as any;
    expect(filter.eq).toContain({ ID: 20233456 });
  });

  it('should order by SubmissionDate desc', () => {
    service.getBusinesses({ top: 10 }).subscribe();

    const [, options] =
      swissParlServiceSpy.fetchCollection.calls.mostRecent().args;
    expect(options.orderby).toEqual({
      property: 'SubmissionDate',
      order: 'desc'
    } as any);
  });

  it('should filter by business types when provided', () => {
    const businessTypes = [{ ID: 1 }, { ID: 2 }] as any;
    service.getBusinesses({ top: 10, businessTypes }).subscribe();

    const [, options] =
      swissParlServiceSpy.fetchCollection.calls.mostRecent().args;
    const filter = options.filter as any;
    expect(filter.eq).toContain({ BusinessType: 1 });
    expect(filter.eq).toContain({ BusinessType: 2 });
  });

  it('should filter by business statuses when provided', () => {
    const businessStatuses = [
      { id: 10, ids: [10] },
      { id: 20, ids: [20] }
    ] as any;
    service.getBusinesses({ top: 10, businessStatuses }).subscribe();

    const [, options] =
      swissParlServiceSpy.fetchCollection.calls.mostRecent().args;
    const filter = options.filter as any;
    expect(filter.eq).toContain({ BusinessStatus: 10 });
    expect(filter.eq).toContain({ BusinessStatus: 20 });
  });

  it('should expand a status option that covers several ids', () => {
    const businessStatuses = [{ id: 229, ids: [27, 229] }] as any;
    service.getBusinesses({ top: 10, businessStatuses }).subscribe();

    const [, options] =
      swissParlServiceSpy.fetchCollection.calls.mostRecent().args;
    const filter = options.filter as any;
    expect(filter.eq).toContain({ BusinessStatus: 27 });
    expect(filter.eq).toContain({ BusinessStatus: 229 });
  });

  it('should filter by session only when one is selected', () => {
    service.getBusinesses({ top: 10, sessionId: 5214 }).subscribe();
    let filter = (
      swissParlServiceSpy.fetchCollection.calls.mostRecent().args[1] as any
    ).filter;
    expect(filter.eq).toContain({ SubmissionSession: 5214 });

    service.getBusinesses({ top: 10, sessionId: null }).subscribe();
    filter = (
      swissParlServiceSpy.fetchCollection.calls.mostRecent().args[1] as any
    ).filter;
    expect(filter.eq.some((e: any) => 'SubmissionSession' in e)).toBeFalse();
  });

  it('should request only the fields the list renders', () => {
    service.getBusinesses({ top: 10 }).subscribe();

    const [, options] =
      swissParlServiceSpy.fetchCollection.calls.mostRecent().args;
    expect(options.select as any).toEqual([
      'ID',
      'BusinessShortNumber',
      'BusinessTypeName',
      'BusinessStatusText',
      'BusinessStatusDate',
      'Title',
      'TagNames'
    ]);
  });

  it('should expand every collection the detail page renders', (done) => {
    const mockBusiness = { ID: 123, Title: 'Test Business' };
    swissParlServiceSpy.fetchCollection.and.returnValue(of([mockBusiness]));

    service.getBusiness(123).subscribe((business) => {
      expect(business).toEqual(mockBusiness as any);
      const [, options, config] =
        swissParlServiceSpy.fetchCollection.calls.mostRecent().args;
      expect(options.expand).toEqual([
        'Votes',
        'Bills/Resolutions',
        'Preconsultations',
        'RelatedBusinesses'
      ] as any);
      expect(config).toEqual({ deepParse: true });
      done();
    });
  });

  it('should match tag ids exactly, not as bare substrings', () => {
    service.getBusinesses({ top: 10, tagIds: [52, 66] }).subscribe();

    const [, options] =
      swissParlServiceSpy.fetchCollection.calls.mostRecent().args;
    const filter = options.filter as any;
    const tagEntry = filter.eq.find((entry: any) =>
      Object.keys(entry)[0].includes('substringof')
    );
    const expression = Object.keys(tagEntry)[0];

    // Business.Tags is a pipe-delimited id list, so both sides are padded:
    // without that, '|5|' would match the '52' inside '15|52|2841'.
    expect(expression).toBe(
      "(substringof('|52|', concat('|',concat(Tags,'|'))) or " +
        "substringof('|66|', concat('|',concat(Tags,'|'))))"
    );
    expect(tagEntry[expression]).toBeTrue();
  });

  it('should not add a tag filter when no tags are selected', () => {
    service.getBusinesses({ top: 10, tagIds: [] }).subscribe();

    const [, options] =
      swissParlServiceSpy.fetchCollection.calls.mostRecent().args;
    const filter = options.filter as any;
    expect(
      filter.eq.some((entry: any) => Object.keys(entry)[0].includes('Tags'))
    ).toBeFalse();
  });

  it('should get tags with select and language filter', () => {
    service.getTags().subscribe();

    const [collection, options] =
      swissParlServiceSpy.fetchCollection.calls.mostRecent().args;
    expect(collection).toBe('Tags');
    expect(options.select as any).toEqual(['ID', 'TagName']);
    const filter = options.filter as any;
    expect(filter.eq).toEqual([{ Language: 'DE' }]);
  });

  it('should get sessions with select, ordering and language filter', () => {
    service.getSessions().subscribe();

    const [collection, options] =
      swissParlServiceSpy.fetchCollection.calls.mostRecent().args;
    expect(collection).toBe('Session');
    expect(options.select as any).toEqual(['ID', 'SessionName', 'StartDate']);
    expect(options.orderby).toEqual({
      property: 'StartDate',
      order: 'desc'
    } as any);
    const filter = options.filter as any;
    expect(filter.eq).toEqual([{ Language: 'DE' }]);
  });

  it('should get business types with select and language filter', () => {
    service.getBusinessTypes().subscribe();

    const [collection, options] =
      swissParlServiceSpy.fetchCollection.calls.mostRecent().args;
    expect(collection).toBe('BusinessType');
    expect(options.select as any).toEqual(['ID', 'BusinessTypeName']);
    const filter = options.filter as any;
    expect(filter.eq).toEqual([{ Language: 'DE' }]);
  });

  it("should remove 'ne' exclusion for short-number search", () => {
    service.getBusinesses({ top: 10, searchTerm: '23.3456' }).subscribe();

    const [, options] =
      swissParlServiceSpy.fetchCollection.calls.mostRecent().args;
    const filter = options.filter as any;
    expect(filter.eq).toContain({ ID: 20233456 });
    expect(filter.ne).toEqual([]);
  });
});
