import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Storage } from '@ionic/storage';

export const firstTimeOpenGuard: CanActivateFn = async () => {
  const storage = inject(Storage);
  const router = inject(Router);

  storage.create();

  const isFirstTime = await storage.get('isFirstTimeOpen');
  if (isFirstTime === null) {
    await storage.set('isFirstTimeOpen', false);
    router.navigate(['/welcome']);
    return false;
  }
  return true;
};
