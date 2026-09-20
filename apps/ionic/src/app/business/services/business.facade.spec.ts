import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { OpenParlDataService } from '@parlwatch/shared/open-parl-data/services';
import { createOpenParlDataSpy } from '@parlwatch/shared/open-parl-data/testing';
import zhAffairDetail from '@parlwatch/shared/open-parl-data/testing/fixtures/zh-affair-detail.json';
import { SwissParlService } from '@parlwatch/shared/swissparl';
import { BusinessFacade } from './business.facade';

describe('BusinessFacade', () => {
  let facade: BusinessFacade;
  let swissParl: jasmine.SpyObj<SwissParlService>;
  let openParlData: jasmine.SpyObj<OpenParlDataService>;

  beforeEach(() => {
    swissParl = jasmine.createSpyObj('SwissParlService', ['fetchCollection']);
    swissParl.fetchCollection.and.returnValue(of([]));
    openParlData = createOpenParlDataSpy({ 'affairs/91382': zhAffairDetail });

    TestBed.configureTestingModule({
      providers: [
        { provide: SwissParlService, useValue: swissParl },
        { provide: OpenParlDataService, useValue: openParlData },
        { provide: TranslocoService, useValue: { getActiveLang: () => 'de' } }
      ]
    });

    facade = TestBed.inject(BusinessFacade);
  });

  it('serves the federal parliament from parlament.ch', () => {
    facade.getBusinesses({ parliament: 'ch', top: 10 }).subscribe();
    facade.getBusinessTypes('ch').subscribe();
    facade.getBusiness('ch', 20233456).subscribe();

    expect(swissParl.fetchCollection).toHaveBeenCalledTimes(3);
    expect(openParlData.fetch).not.toHaveBeenCalled();
  });

  it('asks each source once for the heads of its watched businesses', (done) => {
    swissParl.fetchCollection.and.returnValue(
      of([{ ID: 1, Modified: '/Date(1)/', BusinessStatus: 202 }])
    );

    facade
      .getBusinessHeads([
        { parliament: 'ch', id: 1 },
        { parliament: 'ch', id: 2 },
        { parliament: 'ZH', id: 91382 }
      ])
      .subscribe(({ heads, failed }) => {
        expect(swissParl.fetchCollection).toHaveBeenCalledTimes(1);
        expect(openParlData.fetch).toHaveBeenCalledTimes(1);
        expect(failed).toBeFalse();
        expect(heads).toEqual([
          { parliament: 'ch', id: 1, modified: '/Date(1)/', status: '202' },
          jasmine.objectContaining({ parliament: 'ZH', id: 91382 })
        ]);
        done();
      });
  });

  it('keeps the heads of the sources that answered when one fails', (done) => {
    swissParl.fetchCollection.and.returnValue(
      throwError(() => new Error('down'))
    );

    facade
      .getBusinessHeads([
        { parliament: 'ch', id: 1 },
        { parliament: 'ZH', id: 91382 }
      ])
      .subscribe(({ heads, failed }) => {
        expect(failed).toBeTrue();
        expect(heads.map((head) => head.parliament)).toEqual(['ZH']);
        done();
      });
  });

  it('serves a canton from OpenParlData', () => {
    facade.getBusinesses({ parliament: 'ZH', top: 10 }).subscribe();
    facade.getBusinessTypes('BE').subscribe();
    facade.getBusiness('LU', 91382).subscribe();

    expect(openParlData.fetch).toHaveBeenCalledTimes(3);
    expect(swissParl.fetchCollection).not.toHaveBeenCalled();
  });
});
