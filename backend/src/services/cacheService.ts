import { logger } from '../utils/logger';

interface CacheItem {
  value: any;
  expiresAt: number;
  createdAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

class CacheService {
  private cache = new Map<string, CacheItem>();
  private stats = { hits: 0, misses: 0 };
  private readonly DEFAULT_TTL = 300000; // 5 minutes in milliseconds
  private readonly MAX_SIZE = 1000; // Maximum number of cache entries

  /**
   * Get value from cache
   */
  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: any, ttl: number = this.DEFAULT_TTL): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.MAX_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    const item: CacheItem = {
      value,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now()
    };

    this.cache.set(key, item);
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0
    };
  }

  /**
   * Clean expired entries
   */
  cleanExpired(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned ${cleaned} expired cache entries`);
    }

    return cleaned;
  }

  /**
   * Get cache size in bytes (approximate)
   */
  getSizeInBytes(): number {
    let size = 0;
    for (const [key, item] of this.cache.entries()) {
      size += key.length * 2; // UTF-16 encoding
      size += JSON.stringify(item.value).length * 2;
      size += 24; // Overhead for object properties
    }
    return size;
  }

  /**
   * Cache with automatic key generation
   */
  cacheResult<T>(
    keyGenerator: () => string,
    dataFetcher: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    const key = keyGenerator();
    const cached = this.get(key);
    
    if (cached !== null) {
      return Promise.resolve(cached);
    }

    return dataFetcher().then(result => {
      this.set(key, result, ttl);
      return result;
    });
  }
}

export const cacheService = new CacheService();

// Clean expired entries every 5 minutes
setInterval(() => {
  cacheService.cleanExpired();
}, 300000);
