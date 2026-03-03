import { TestBed } from '@angular/core/testing';
import * as swissparl from 'swissparl';
import { SwissParlService } from './swissparl.service';

describe('SwissParlService', () => {
  let service: SwissParlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SwissParlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch collection with retry', (done) => {
    const mockData = [{ ID: 1, Name: 'Test' }];
    let callCount = 0;
    const fetchCollectionSpy = jasmine
      .createSpy('fetchCollection')
      .and.callFake(() => {
        callCount += 1;
        if (callCount < 3) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve(mockData);
      });
    spyOnProperty(swissparl, 'fetchCollection', 'get').and.returnValue(
      fetchCollectionSpy
    );

    service.fetchCollection('Business', { top: 10 }).subscribe({
      next: (result) => {
        expect(result).toEqual(mockData);
        expect(callCount).toBe(3);
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
        expect(callCount).toBe(4);
        done();
      }
    });
  });

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
