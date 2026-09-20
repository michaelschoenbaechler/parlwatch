import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { OpenParlDataService } from '@parlwatch/shared/open-parl-data/services/open-parl-data.service';
import { createOpenParlDataSpy } from '@parlwatch/shared/open-parl-data/testing/open-parl-data.testing';
import zhAffairDetail from '@parlwatch/shared/open-parl-data/testing/fixtures/zh-affair-detail.json';
import { SwissParlService } from '@parlwatch/shared/swissparl/swissparl.service';
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

  it('serves a canton from OpenParlData', () => {
    facade.getBusinesses({ parliament: 'ZH', top: 10 }).subscribe();
    facade.getBusinessTypes('BE').subscribe();
    facade.getBusiness('LU', 91382).subscribe();

    expect(openParlData.fetch).toHaveBeenCalledTimes(3);
    expect(swissParl.fetchCollection).not.toHaveBeenCalled();
  });
});
