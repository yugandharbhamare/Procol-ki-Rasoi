/**
 * API Cache Service
 * Provides client-side caching and request deduplication for API calls
 */

class APICache {
  constructor() {
    this.cache = new Map();
    this.requestPromises = new Map();
    this.cacheExpiry = new Map();
    
    // Default cache durations (in milliseconds)
    this.defaultDurations = {
      user: 5 * 60 * 1000,      // 5 minutes
      menu: 10 * 60 * 1000,     // 10 minutes
      orders: 30 * 1000,        // 30 seconds
      staff: 5 * 60 * 1000,     // 5 minutes
      images: 60 * 60 * 1000    // 1 hour
    };
  }

  /**
   * Generate cache key from parameters
   */
  generateKey(operation, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    
    return `${operation}:${JSON.stringify(sortedParams)}`;
  }

  /**
   * Check if cache entry is valid
   */
  isValid(key) {
    const expiry = this.cacheExpiry.get(key);
    return expiry && Date.now() < expiry;
  }

  /**
   * Get cached data if valid
   */
  get(key) {
    if (this.isValid(key)) {
      console.log(`🎯 Cache hit for key: ${key}`);
      return this.cache.get(key);
    }
    
    // Remove expired entry
    if (this.cache.has(key)) {
      console.log(`🗑️ Cache expired for key: ${key}`);
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
    }
    
    return null;
  }

  /**
   * Set cache entry with expiry
   */
  set(key, data, duration = null) {
    const cacheDuration = duration || this.defaultDurations.general || 5 * 60 * 1000;
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + cacheDuration);
    console.log(`💾 Cached data for key: ${key}, expires in ${cacheDuration}ms`);
  }

  /**
   * Remove cache entry
   */
  delete(key) {
    this.cache.delete(key);
    this.cacheExpiry.delete(key);
    console.log(`🗑️ Removed cache entry: ${key}`);
  }

  /**
   * Clear all cache entries matching pattern
   */
  clearPattern(pattern) {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key);
      }
    }
    console.log(`🧹 Cleared cache entries matching pattern: ${pattern}`);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.cacheExpiry.clear();
    this.requestPromises.clear();
    console.log('🧹 Cleared all cache');
  }

  /**
   * Get or create request promise (prevents duplicate requests)
   */
  getOrCreateRequest(key, requestFn) {
    // If request is already in progress, return the existing promise
    if (this.requestPromises.has(key)) {
      console.log(`⏳ Request already in progress for key: ${key}`);
      return this.requestPromises.get(key);
    }

    // Create new request promise
    const requestPromise = requestFn()
      .finally(() => {
        // Remove from request promises when completed
        this.requestPromises.delete(key);
      });

    this.requestPromises.set(key, requestPromise);
    return requestPromise;
  }

  /**
   * Cached API call wrapper
   */
  async cachedCall(operation, params, requestFn, duration = null) {
    const key = this.generateKey(operation, params);
    
    // Check cache first
    const cachedData = this.get(key);
    if (cachedData) {
      return cachedData;
    }

    // Make request (with deduplication)
    const data = await this.getOrCreateRequest(key, requestFn);
    
    // Cache the result
    this.set(key, data, duration);
    
    return data;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.requestPromises.size,
      memoryUsage: JSON.stringify([...this.cache.entries()]).length
    };
  }
}

// Create singleton instance
const apiCache = new APICache();

export default apiCache;
