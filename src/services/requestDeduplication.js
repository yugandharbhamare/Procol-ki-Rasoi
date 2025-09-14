/**
 * Request Deduplication Service
 * Prevents duplicate API requests and provides request batching
 */

class RequestDeduplication {
  constructor() {
    this.pendingRequests = new Map();
    this.batchQueues = new Map();
    this.batchTimeouts = new Map();
    this.batchDelay = 100; // 100ms batch window
  }

  /**
   * Deduplicate single request
   */
  async deduplicate(key, requestFn, options = {}) {
    const { 
      ttl = 5000, // 5 seconds default TTL
      forceRefresh = false 
    } = options;

    // Check if request is already in progress
    if (this.pendingRequests.has(key) && !forceRefresh) {
      console.log(`🔄 Request deduplication: Reusing pending request for ${key}`);
      return this.pendingRequests.get(key);
    }

    // Create new request
    const requestPromise = requestFn()
      .finally(() => {
        // Clean up after request completes
        setTimeout(() => {
          this.pendingRequests.delete(key);
        }, ttl);
      });

    // Store the promise
    this.pendingRequests.set(key, requestPromise);

    try {
      const result = await requestPromise;
      console.log(`✅ Request completed for ${key}`);
      return result;
    } catch (error) {
      console.error(`❌ Request failed for ${key}:`, error);
      this.pendingRequests.delete(key);
      throw error;
    }
  }

  /**
   * Batch multiple requests of the same type
   */
  batchRequest(batchKey, requestKey, requestFn, options = {}) {
    const { 
      batchSize = 10,
      batchDelay = this.batchDelay 
    } = options;

    // Initialize batch queue if not exists
    if (!this.batchQueues.has(batchKey)) {
      this.batchQueues.set(batchKey, []);
    }

    const queue = this.batchQueues.get(batchKey);
    const request = {
      key: requestKey,
      fn: requestFn,
      resolve: null,
      reject: null,
      promise: new Promise((resolve, reject) => {
        request.resolve = resolve;
        request.reject = reject;
      })
    };

    queue.push(request);

    // Process batch if it reaches batch size
    if (queue.length >= batchSize) {
      this._processBatch(batchKey);
    } else {
      // Set timeout to process batch after delay
      if (this.batchTimeouts.has(batchKey)) {
        clearTimeout(this.batchTimeouts.get(batchKey));
      }

      const timeout = setTimeout(() => {
        this._processBatch(batchKey);
      }, batchDelay);

      this.batchTimeouts.set(batchKey, timeout);
    }

    return request.promise;
  }

  /**
   * Process batched requests
   */
  async _processBatch(batchKey) {
    const queue = this.batchQueues.get(batchKey);
    if (!queue || queue.length === 0) return;

    console.log(`📦 Processing batch ${batchKey} with ${queue.length} requests`);

    // Clear timeout
    if (this.batchTimeouts.has(batchKey)) {
      clearTimeout(this.batchTimeouts.get(batchKey));
      this.batchTimeouts.delete(batchKey);
    }

    // Clear queue
    this.batchQueues.set(batchKey, []);

    // Process all requests in the batch
    const promises = queue.map(request => 
      request.fn().then(
        result => request.resolve(result),
        error => request.reject(error)
      )
    );

    try {
      await Promise.all(promises);
      console.log(`✅ Batch ${batchKey} completed successfully`);
    } catch (error) {
      console.error(`❌ Batch ${batchKey} failed:`, error);
    }
  }

  /**
   * Debounce requests (wait for pause before executing)
   */
  debounce(key, requestFn, delay = 300) {
    // Clear existing timeout
    if (this.batchTimeouts.has(`debounce_${key}`)) {
      clearTimeout(this.batchTimeouts.get(`debounce_${key}`));
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);

      this.batchTimeouts.set(`debounce_${key}`, timeout);
    });
  }

  /**
   * Throttle requests (limit frequency)
   */
  throttle(key, requestFn, limit = 1000) {
    const now = Date.now();
    const lastCall = this.pendingRequests.get(`throttle_${key}`) || 0;

    if (now - lastCall < limit) {
      console.log(`🚦 Request throttled for ${key}`);
      return Promise.resolve(null); // or return cached result
    }

    this.pendingRequests.set(`throttle_${key}`, now);
    return requestFn();
  }

  /**
   * Get pending requests status
   */
  getStatus() {
    return {
      pendingRequests: this.pendingRequests.size,
      batchQueues: Array.from(this.batchQueues.keys()).map(key => ({
        key,
        size: this.batchQueues.get(key).length
      })),
      activeTimeouts: this.batchTimeouts.size
    };
  }

  /**
   * Clear all pending requests and timeouts
   */
  clear() {
    // Clear all timeouts
    for (const timeout of this.batchTimeouts.values()) {
      clearTimeout(timeout);
    }

    this.pendingRequests.clear();
    this.batchQueues.clear();
    this.batchTimeouts.clear();

    console.log('🧹 Request deduplication cleared');
  }
}

// Create singleton instance
const requestDeduplication = new RequestDeduplication();

export default requestDeduplication;
