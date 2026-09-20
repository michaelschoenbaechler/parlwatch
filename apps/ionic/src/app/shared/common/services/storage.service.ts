import { inject, Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

/**
 * Thin wrapper around Ionic Storage. `create()` has to finish before any read
 * or write, so the promise it returns is kept and awaited by every call —
 * callers never have to think about initialisation order.
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly storage = inject(Storage);
  private readonly ready = this.storage.create();

  /**
   * Read a persisted value.
   * @param key Storage key
   * @param fallback Returned when nothing is stored or storage is unavailable
   * @returns The stored value, or the fallback
   */
  async get<T>(key: string, fallback: T): Promise<T> {
    try {
      const storage = await this.ready;
      return (await storage.get(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }

  /**
   * Persist a value. Failures are swallowed: storage is a convenience here,
   * never something the UI depends on.
   * @param key Storage key
   * @param value Value to persist
   */
  async set(key: string, value: unknown): Promise<void> {
    try {
      const storage = await this.ready;
      await storage.set(key, value);
    } catch {
      // ignored on purpose
    }
  }
}
