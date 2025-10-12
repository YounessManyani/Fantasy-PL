import { Player } from '../../types';
import { createLogger } from '../../utils/logger.utils';

const logger = createLogger('NameCache');

export interface INameCacheService {
  get(key: string): Player | null | undefined;
  set(key: string, player: Player | null): void;
  has(key: string): boolean;
  clear(): void;
  size(): number;
}

export class NameCacheService implements INameCacheService {
  private cache = new Map<string, Player | null>();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  get(key: string): Player | null | undefined {
    return this.cache.get(key);
  }

  set(key: string, player: Player | null): void {
    // LRU eviction if needed
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, player);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
    logger.info('Cache cleared');
  }

  size(): number {
    return this.cache.size;
  }
}