import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { StorageService } from '@parlwatch/shared/common/services';

export const INTRO_VERSION_KEY = 'layout.introVersion';
/** Bump to show a changed intro once more to everyone who saw an older one. */
export const INTRO_VERSION = 2;
export const LEGACY_INTRO_KEY = 'isFirstTimeOpen';

export const introGuard: CanActivateFn = async (): Promise<
  boolean | UrlTree
> => {
  const storage = inject(StorageService);
  const router = inject(Router);

  const seen = await storage.get<number>(INTRO_VERSION_KEY, 0);
  return seen >= INTRO_VERSION || router.parseUrl('/welcome');
};

export async function markIntroSeen(storage: StorageService): Promise<void> {
  await storage.set(INTRO_VERSION_KEY, INTRO_VERSION);
  await storage.remove(LEGACY_INTRO_KEY);
}
