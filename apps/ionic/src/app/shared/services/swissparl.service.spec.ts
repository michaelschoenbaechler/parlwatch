import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { TimeoutError } from 'rxjs';
import * as swissparl from 'swissparl';
import {
  REQUEST_TIMEOUT_MS,
  RETRY_COUNT,
  RETRY_DELAY_MS,
  SwissParlService
} from './swissparl.service';

describe('SwissParlService', () => {
  let service: SwissParlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SwissParlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should retry a failing request and succeed', (done) => {
    const mockData = [{ ID: 1, Name: 'Test' }];
    let callCount = 0;
    const fetchCollectionSpy = jasmine
      .createSpy('fetchCollection')
      .and.callFake(() => {
        callCount += 1;
        return callCount <= RETRY_COUNT
          ? Promise.reject(new Error('Temporary failure'))
          : Promise.resolve(mockData);
      });
    spyOnProperty(swissparl, 'fetchCollection', 'get').and.returnValue(
      fetchCollectionSpy
    );

    service.fetchCollection('Business', { top: 10 }).subscribe({
      next: (result) => {
        expect(result).toEqual(mockData);
        expect(callCount).toBe(RETRY_COUNT + 1);
        expect(fetchCollectionSpy).toHaveBeenCalledWith(
          'Business',
          { top: 10 },
          undefined
        );
        done();
      },
      error: done.fail
    });
  });

  it('should emit error after retry attempts are exhausted', (done) => {
    let callCount = 0;
    const fetchCollectionSpy = jasmine
      .createSpy('fetchCollection')
      .and.callFake(() => {
        callCount += 1;
        return Promise.reject(new Error('Persistent failure'));
      });
    spyOnProperty(swissparl, 'fetchCollection', 'get').and.returnValue(
      fetchCollectionSpy
    );

    service.fetchCollection('Business', { top: 10 }).subscribe({
      next: () => done.fail('Expected an error after retries are exhausted'),
      error: (err) => {
        expect(err).toEqual(jasmine.any(Error));
        expect(callCount).toBe(RETRY_COUNT + 1);
        done();
      }
    });
  });

  it('should give up on a request that never settles', fakeAsync(() => {
    const fetchCollectionSpy = jasmine
      .createSpy('fetchCollection')
      .and.callFake(() => new Promise(() => undefined));
    spyOnProperty(swissparl, 'fetchCollection', 'get').and.returnValue(
      fetchCollectionSpy
    );

    let caught: unknown;
    service
      .fetchCollection('Business', { top: 10 })
      .subscribe({ error: (err) => (caught = err) });

    // Each attempt is capped by the timeout, with a delay between retries.
    for (let attempt = 0; attempt <= RETRY_COUNT; attempt += 1) {
      tick(REQUEST_TIMEOUT_MS);
      tick(RETRY_DELAY_MS);
    }

    expect(caught).toEqual(jasmine.any(TimeoutError));
    expect(fetchCollectionSpy).toHaveBeenCalledTimes(RETRY_COUNT + 1);
  }));

  it('should pass config options to fetchCollection', (done) => {
    const mockData: any[] = [];
    const fetchCollectionSpy = jasmine
      .createSpy('fetchCollection')
      .and.returnValue(Promise.resolve(mockData));
    spyOnProperty(swissparl, 'fetchCollection', 'get').and.returnValue(
      fetchCollectionSpy
    );
    const config = { deepParse: true, maxResults: 100 };

    service.fetchCollection('Person', { top: 50 }, config).subscribe({
      next: () => {
        expect(fetchCollectionSpy).toHaveBeenCalledWith(
          'Person',
          { top: 50 },
          config
        );
        done();
      },
      error: done.fail
    });
  });
});
