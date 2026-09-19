import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import {
  OPEN_PARL_DATA_BASE_URL,
  OpenParlDataService
} from './open-parl-data.service';

describe('OpenParlDataService', () => {
  let service: OpenParlDataService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(OpenParlDataService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests a collection under its trailing slash with the query as parameters', () => {
    service
      .fetch('affairs', {
        body_key: 'ZH',
        limit: 20,
        offset: 0,
        search: undefined,
        type_harmonized_id: ''
      })
      .subscribe();

    const request = http.expectOne(
      (req) => req.url === `${OPEN_PARL_DATA_BASE_URL}affairs/`
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('body_key')).toBe('ZH');
    expect(request.request.params.get('limit')).toBe('20');
    expect(request.request.params.get('offset')).toBe('0');
    // Unset and empty parameters are left out rather than sent as "undefined".
    expect(request.request.params.has('search')).toBeFalse();
    expect(request.request.params.has('type_harmonized_id')).toBeFalse();
    request.flush({ data: [], meta: {} });
  });

  it('requests records and aggregations at their own paths', () => {
    service.fetch('affairs/91382').subscribe();
    http
      .expectOne(`${OPEN_PARL_DATA_BASE_URL}affairs/91382`)
      .flush({ id: 91382 });

    service.fetch('affairs/group_by/types_harmonized').subscribe();
    http
      .expectOne(`${OPEN_PARL_DATA_BASE_URL}affairs/group_by/types_harmonized`)
      .flush({ data: [], meta: {} });
  });

  it('hands back a list as its rows and meta', (done) => {
    service.fetch<{ id: number }>('persons').subscribe((page) => {
      expect(page.data).toEqual([{ id: 1 }, { id: 2 }]);
      expect(page.meta.total_records).toBe(2);
      done();
    });

    http
      .expectOne(`${OPEN_PARL_DATA_BASE_URL}persons/`)
      .flush({ data: [{ id: 1 }, { id: 2 }], meta: { total_records: 2 } });
  });

  it('hands back a single record as a one-row page', (done) => {
    service.fetch<{ id: number }>('persons/7').subscribe((page) => {
      expect(page.data).toEqual([{ id: 7 }]);
      expect(page.meta).toEqual({});
      done();
    });

    http.expectOne(`${OPEN_PARL_DATA_BASE_URL}persons/7`).flush({ id: 7 });
  });

  it('retries a failed request once before giving up', (done) => {
    let errors = 0;
    service.fetch('votings').subscribe({
      next: () => done.fail('expected the request to fail'),
      error: () => {
        expect(errors).toBe(2);
        done();
      }
    });

    const fail = () => {
      errors += 1;
      http
        .expectOne(`${OPEN_PARL_DATA_BASE_URL}votings/`)
        .flush('down', { status: 503, statusText: 'Service Unavailable' });
    };

    fail();
    // The retry waits before the second attempt.
    setTimeout(fail, 600);
  });
});
