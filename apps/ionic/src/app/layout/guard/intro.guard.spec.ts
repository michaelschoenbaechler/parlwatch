import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { StorageService } from '@parlwatch/shared/common/services';
import { InMemoryStorageService } from '@parlwatch/shared/parliament/testing';
import {
  INTRO_VERSION,
  INTRO_VERSION_KEY,
  introGuard,
  LEGACY_INTRO_KEY,
  markIntroSeen
} from './intro.guard';

@Component({ template: '' })
class StubPage {}

describe('intro', () => {
  let storage: InMemoryStorageService;

  async function open(seed: Record<string, unknown>): Promise<string> {
    storage = new InMemoryStorageService(seed);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: StorageService, useValue: storage },
        provideRouter([
          { path: 'layout', component: StubPage, canActivate: [introGuard] },
          { path: 'welcome', component: StubPage }
        ])
      ]
    });
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/layout');
    return router.url;
  }

  it('shows the intro on a fresh install', async () => {
    expect(await open({})).toBe('/welcome');
  });

  it('shows the new intro to users who only saw an older one', async () => {
    expect(await open({ [LEGACY_INTRO_KEY]: false })).toBe('/welcome');
    expect(await open({ [INTRO_VERSION_KEY]: INTRO_VERSION - 1 })).toBe(
      '/welcome'
    );
  });

  it('lets users through once they have seen the current intro', async () => {
    expect(await open({ [INTRO_VERSION_KEY]: INTRO_VERSION })).toBe('/layout');
  });

  it('records the current intro as seen and drops the old flag', async () => {
    await open({ [LEGACY_INTRO_KEY]: false });

    await markIntroSeen(storage as unknown as StorageService);

    expect(storage.values.get(INTRO_VERSION_KEY)).toBe(INTRO_VERSION);
    expect(storage.values.has(LEGACY_INTRO_KEY)).toBeFalse();
  });
});
