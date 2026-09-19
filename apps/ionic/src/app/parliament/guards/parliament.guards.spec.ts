import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Route, Router } from '@angular/router';
import { BUSINESS_ROUTES } from '../../business/routes';
import { COUNCIL_MEMBER_ROUTES } from '../../council-member/routes';
import { StorageService } from '../../shared/services/storage.service';
import { VOTE_ROUTES } from '../../votes/routes';
import { InMemoryStorageService } from '../testing/storage.testing';
import {
  ACTIVE_PARLIAMENT_KEY,
  CANTONS_OF_INTEREST_KEY,
  ParliamentStore
} from '../store/parliament.store';

@Component({ template: '' })
class StubPage {}

/**
 * The real feature routes, with every page swapped for an empty component
 * so the redirects and guards are exercised without rendering the app.
 * @param routes A feature's route table
 * @returns The same table, pages stubbed
 */
function withStubPages(routes: Route[]): Route[] {
  return routes.map((route) => {
    const { loadComponent, children, ...rest } = route;
    return {
      ...rest,
      ...(loadComponent && { component: StubPage }),
      ...(children && { children: withStubPages(children) })
    };
  });
}

describe('parliament routing', () => {
  let router: Router;
  let store: InstanceType<typeof ParliamentStore>;

  /**
   * Boot the router over the feature routes with the given storage contents.
   * @param seed What storage holds before the parliament store loads
   */
  async function setUp(seed: Record<string, unknown> = {}) {
    TestBed.configureTestingModule({
      providers: [
        { provide: StorageService, useValue: new InMemoryStorageService(seed) },
        provideRouter([
          {
            path: 'layout',
            children: [
              { path: 'business', children: withStubPages(BUSINESS_ROUTES) },
              { path: 'votes', children: withStubPages(VOTE_ROUTES) },
              {
                path: 'council-member',
                children: withStubPages(COUNCIL_MEMBER_ROUTES)
              }
            ]
          }
        ])
      ]
    });
    router = TestBed.inject(Router);
    store = TestBed.inject(ParliamentStore);
    await store.whenReady();
  }

  it('sends key-less list routes to the federal parliament by default', async () => {
    await setUp();

    await router.navigateByUrl('/layout/business');
    expect(router.url).toBe('/layout/business/ch');

    await router.navigateByUrl('/layout/votes');
    expect(router.url).toBe('/layout/votes/ch');

    await router.navigateByUrl('/layout/council-member');
    expect(router.url).toBe('/layout/council-member/ch');
  });

  it('sends key-less list routes to the active canton', async () => {
    await setUp({
      [CANTONS_OF_INTEREST_KEY]: ['ZH'],
      [ACTIVE_PARLIAMENT_KEY]: 'ZH'
    });

    await router.navigateByUrl('/layout/business');
    expect(router.url).toBe('/layout/business/ZH');
  });

  it('keeps old detail links working as federal ones', async () => {
    await setUp();

    await router.navigateByUrl('/layout/business/detail/20233456');
    expect(router.url).toBe('/layout/business/ch/detail/20233456');

    await router.navigateByUrl('/layout/votes/detail/12');
    expect(router.url).toBe('/layout/votes/ch/detail/12');

    await router.navigateByUrl('/layout/council-member/detail/4057');
    expect(router.url).toBe('/layout/council-member/ch/detail/4057');

    // Cross-tab detail routes from before cantons existed.
    await router.navigateByUrl('/layout/votes/business/detail/7');
    expect(router.url).toBe('/layout/votes/ch/business/detail/7');
    await router.navigateByUrl('/layout/council-member/votes/detail/9');
    expect(router.url).toBe('/layout/council-member/ch/votes/detail/9');
  });

  it('redirects an unknown parliament key to the federal equivalent', async () => {
    await setUp();

    await router.navigateByUrl('/layout/business/XX');
    expect(router.url).toBe('/layout/business/ch');

    await router.navigateByUrl('/layout/votes/zh/detail/5');
    expect(router.url).toBe('/layout/votes/ch/detail/5');
  });

  it('opens a canton route without touching the active parliament', async () => {
    await setUp({ [CANTONS_OF_INTEREST_KEY]: ['BE'] });

    // A recent entry from Bern opens in Bern while the switcher stays federal.
    await router.navigateByUrl('/layout/business/BE/detail/130335');
    expect(router.url).toBe('/layout/business/BE/detail/130335');
    expect(store.activeParliament()).toBe('ch');

    // Even a canton the user no longer follows still opens.
    await router.navigateByUrl('/layout/votes/GR/detail/1');
    expect(router.url).toBe('/layout/votes/GR/detail/1');
    expect(store.activeParliament()).toBe('ch');
  });
});
