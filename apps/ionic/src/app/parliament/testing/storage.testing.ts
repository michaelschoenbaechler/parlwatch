import { StorageService } from '../../shared/services/storage.service';

export class InMemoryStorageService implements Pick<
  StorageService,
  'get' | 'set'
> {
  readonly values = new Map<string, unknown>();

  constructor(seed: Record<string, unknown> = {}) {
    for (const [key, value] of Object.entries(seed)) {
      this.values.set(key, value);
    }
  }

  async get<T>(key: string, fallback: T): Promise<T> {
    return this.values.has(key) ? (this.values.get(key) as T) : fallback;
  }

  async set(key: string, value: unknown): Promise<void> {
    this.values.set(key, value);
  }
}
