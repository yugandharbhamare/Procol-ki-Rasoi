/**
 * Optimized API Client
 * Centralized API client with caching, deduplication, and error handling
 */

import apiCache from './apiCache';
import requestDeduplication from './requestDeduplication';

class OptimizedAPIClient {
  constructor() {
    this.baseURL = '/api';
    this.defaultTimeout = 30000; // 30 seconds
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Make optimized HTTP request with caching and deduplication
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      body = null,
      cache = true,
      cacheDuration = null,
      deduplicate = true,
      timeout = this.defaultTimeout,
      retryAttempts = this.retryAttempts,
      ...fetchOptions
    } = options;

    // Generate cache/deduplication key
    const key = this._generateKey(endpoint, method, body);

    // Check cache for GET requests
    if (cache && method === 'GET') {
      const cached = apiCache.get(key);
      if (cached) {
        return cached;
      }
    }

    // Create request function
    const requestFn = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const config = {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
          signal: controller.signal,
          ...fetchOptions,
        };

        if (body && method !== 'GET') {
          config.body = JSON.stringify(body);
        }

        console.log(`🌐 API Request: ${method} ${endpoint}`);
        
        const response = await fetch(`${this.baseURL}${endpoint}`, config);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ API Response: ${method} ${endpoint}`);

        return data;

      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        
        throw error;
      }
    };

    // Apply deduplication if enabled
    let result;
    if (deduplicate && method === 'GET') {
      result = await requestDeduplication.deduplicate(key, requestFn);
    } else {
      result = await requestFn();
    }

    // Cache successful GET requests
    if (cache && method === 'GET' && result) {
      apiCache.set(key, result, cacheDuration);
    }

    return result;
  }

  /**
   * GET request with caching
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  /**
   * POST request
   */
  async post(endpoint, body, options = {}) {
    return this.request(endpoint, { 
      method: 'POST', 
      body, 
      cache: false, 
      deduplicate: false,
      ...options 
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, body, options = {}) {
    return this.request(endpoint, { 
      method: 'PUT', 
      body, 
      cache: false, 
      deduplicate: false,
      ...options 
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { 
      method: 'DELETE', 
      cache: false, 
      deduplicate: false,
      ...options 
    });
  }

  /**
   * Batch multiple requests
   */
  async batch(requests) {
    const promises = requests.map(({ endpoint, options }) => 
      this.request(endpoint, options)
    );

    try {
      const results = await Promise.allSettled(promises);
      
      return results.map((result, index) => ({
        endpoint: requests[index].endpoint,
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null
      }));
    } catch (error) {
      console.error('Batch request failed:', error);
      throw error;
    }
  }

  /**
   * Upload file with progress tracking
   */
  async uploadFile(endpoint, file, options = {}) {
    const {
      onProgress = null,
      timeout = 60000, // 1 minute for file uploads
      ...uploadOptions
    } = options;

    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      // Progress tracking
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });
      }

      // Handle response
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            resolve({ success: true, data: xhr.responseText });
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed: Network error'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'));
      });

      // Configure request
      xhr.timeout = timeout;
      xhr.open('POST', `${this.baseURL}${endpoint}`);
      
      // Set custom headers
      Object.entries(uploadOptions.headers || {}).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.send(formData);
    });
  }

  /**
   * Generate cache/deduplication key
   */
  _generateKey(endpoint, method, body) {
    const bodyString = body ? JSON.stringify(body) : '';
    return `${method}:${endpoint}:${bodyString}`;
  }

  /**
   * Clear cache for specific endpoint
   */
  clearCache(pattern) {
    if (pattern) {
      apiCache.clearPattern(pattern);
    } else {
      apiCache.clear();
    }
  }

  /**
   * Get API client statistics
   */
  getStats() {
    return {
      cache: apiCache.getStats(),
      deduplication: requestDeduplication.getStatus()
    };
  }
}

// Create singleton instance
const optimizedApiClient = new OptimizedAPIClient();

export default optimizedApiClient;
