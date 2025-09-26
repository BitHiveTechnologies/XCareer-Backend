interface CacheStats {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
}
declare class CacheService {
    private cache;
    private stats;
    private readonly DEFAULT_TTL;
    private readonly MAX_SIZE;
    /**
     * Get value from cache
     */
    get(key: string): any | null;
    /**
     * Set value in cache
     */
    set(key: string, value: any, ttl?: number): void;
    /**
     * Delete value from cache
     */
    delete(key: string): boolean;
    /**
     * Clear all cache
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    getStats(): CacheStats;
    /**
     * Clean expired entries
     */
    cleanExpired(): number;
    /**
     * Get cache size in bytes (approximate)
     */
    getSizeInBytes(): number;
    /**
     * Cache with automatic key generation
     */
    cacheResult<T>(keyGenerator: () => string, dataFetcher: () => Promise<T>, ttl?: number): Promise<T>;
}
export declare const cacheService: CacheService;
export {};
//# sourceMappingURL=cacheService.d.ts.map