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
      { BusinessStatusId: 10 },
      { BusinessStatusId: 20 }
    ] as any;
    service.getBusinesses({ top: 10, businessStatuses }).subscribe();

    const [, options] =
      swissParlServiceSpy.fetchCollection.calls.mostRecent().args;
    const filter = options.filter as any;
    expect(filter.eq).toContain({ BusinessStatus: 10 });
    expect(filter.eq).toContain({ BusinessStatus: 20 });
  });

  it('should get single business with expand Votes', (done) => {
    const mockBusiness = { ID: 123, Title: 'Test Business' };
    swissParlServiceSpy.fetchCollection.and.returnValue(of([mockBusiness]));

    service.getBusiness(123).subscribe((business) => {
      expect(business).toEqual(mockBusiness as any);
      const [, options, config] =
        swissParlServiceSpy.fetchCollection.calls.mostRecent().args;
      expect(options.expand).toEqual(['Votes'] as any);
      expect(config).toEqual({ deepParse: true });
      done();
    });
  });

  it('should get business statuses with select and language filter', () => {
    service.getBusinessStatus().subscribe();

    const [collection, options] =
      swissParlServiceSpy.fetchCollection.calls.mostRecent().args;
    expect(collection).toBe('BusinessStatus');
    expect(options.select as any).toEqual([
      'BusinessStatusId',
      'BusinessStatusName'
    ]);
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
