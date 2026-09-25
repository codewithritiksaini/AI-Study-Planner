/**
 * cache.js
 *
 * High-performance, lightweight in-memory TTL cache with:
 * 1. Automatic time-based expiration (TTL).
 * 2. In-flight request deduplication (stampede / thundering herd protection).
 * 3. User-scoped cache invalidation for instant data freshness on mutations.
 */

class MemoryCache {
  constructor(defaultTtlSeconds = 60, maxEntries = 500) {
    this.defaultTtl = defaultTtlSeconds * 1000;
    this.maxEntries = maxEntries;
    this.store = new Map();
    this.inFlight = new Map();

    // Auto-clean expired items every 2 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 120000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  set(key, value, ttlSeconds) {
    // Prevent unbounded memory growth
    if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) this.store.delete(oldestKey);
    }

    const expiresAt = Date.now() + (ttlSeconds ? ttlSeconds * 1000 : this.defaultTtl);
    this.store.set(key, { value, expiresAt });
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  del(key) {
    this.store.delete(key);
  }

  /**
   * Invalidates all cache entries matching a user prefix or pattern.
   * e.g. invalidateUser('c969e36f-...') clears all cached data for that student.
   */
  invalidateUser(userId) {
    if (!userId) return;
    const prefix = `user:${userId}:`;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Atomic get-or-set with Promise stampede deduplication.
   * If 5 concurrent requests ask for the same data simultaneously, only 1 DB
   * query runs and all 5 share the resolved value.
   */
  async getOrSet(key, fetchFn, ttlSeconds = 60) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    if (this.inFlight.has(key)) {
      return this.inFlight.get(key);
    }

    const promise = (async () => {
      try {
        const result = await fetchFn();
        this.set(key, result, ttlSeconds);
        return result;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  clear() {
    this.store.clear();
    this.inFlight.clear();
  }
}

export const appCache = new MemoryCache();
