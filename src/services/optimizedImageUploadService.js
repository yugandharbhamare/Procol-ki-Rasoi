/**
 * Optimized Image Upload Service
 * Provides efficient image upload with retry mechanisms and better error handling
 */

import apiCache from './apiCache';

class OptimizedImageUploadService {
  constructor() {
    this.uploadQueue = new Map();
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
    this.maxConcurrentUploads = 3;
    this.activeUploads = new Set();
  }

  /**
   * Upload image with retry mechanism and queue management
   */
  async uploadImage(file, options = {}) {
    const {
      folder = 'optimized',
      maxWidth = 800,
      maxHeight = 600,
      quality = 0.8,
      retryAttempts = this.retryAttempts
    } = options;

    // Check if upload is already in progress
    const uploadKey = `${file.name}-${file.size}-${file.lastModified}`;
    if (this.uploadQueue.has(uploadKey)) {
      console.log(`📤 Upload already in progress for: ${file.name}`);
      return this.uploadQueue.get(uploadKey);
    }

    // Check cache first
    const cacheKey = `image:${uploadKey}`;
    const cached = apiCache.get(cacheKey);
    if (cached) {
      console.log(`🎯 Image upload cache hit for: ${file.name}`);
      return cached;
    }

    // Create upload promise
    const uploadPromise = this._performUpload(file, folder, maxWidth, maxHeight, quality, retryAttempts);
    
    // Store in queue
    this.uploadQueue.set(uploadKey, uploadPromise);
    
    // Clean up queue when done
    uploadPromise.finally(() => {
      this.uploadQueue.delete(uploadKey);
    });

    try {
      const result = await uploadPromise;
      
      // Cache successful upload
      apiCache.set(cacheKey, result, apiCache.defaultDurations.images);
      
      return result;
    } catch (error) {
      // Remove from cache on error
      apiCache.delete(cacheKey);
      throw error;
    }
  }

  /**
   * Perform the actual upload with retry logic
   */
  async _performUpload(file, folder, maxWidth, maxHeight, quality, retryAttempts) {
    // Wait for available slot if too many concurrent uploads
    while (this.activeUploads.size >= this.maxConcurrentUploads) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.activeUploads.add(file.name);

    try {
      // Optimize image
      const optimizedBlob = await this._optimizeImage(file, maxWidth, maxHeight, quality);
      
      // Generate filename
      const fileName = this._generateFileName(file.name);
      
      // Attempt upload with retries
      for (let attempt = 1; attempt <= retryAttempts; attempt++) {
        try {
          console.log(`📤 Upload attempt ${attempt}/${retryAttempts} for: ${file.name}`);
          
          const result = await this._uploadToServer(optimizedBlob, fileName, folder);
          
          console.log(`✅ Upload successful for: ${file.name}`);
          return result;
          
        } catch (error) {
          console.warn(`⚠️ Upload attempt ${attempt} failed for: ${file.name}:`, error.message);
          
          if (attempt === retryAttempts) {
            throw error;
          }
          
          // Wait before retry with exponential backoff
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
    } finally {
      this.activeUploads.delete(file.name);
    }
  }

  /**
   * Upload to server
   */
  async _uploadToServer(blob, fileName, folder) {
    const formData = new FormData();
    formData.append('image', blob, fileName);
    formData.append('folder', folder);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      return {
        success: true,
        fileName: result.fileName,
        url: result.url,
        optimizedUrl: result.optimizedUrl
      };

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Upload timeout');
      }
      
      throw error;
    }
  }

  /**
   * Optimize image with better compression
   */
  async _optimizeImage(file, maxWidth, maxHeight, quality) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions
          const { width, height } = this._calculateDimensions(
            img.width, 
            img.height, 
            maxWidth, 
            maxHeight
          );

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                console.log(`🗜️ Image optimized: ${file.size} → ${blob.size} bytes`);
                resolve(blob);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            quality
          );

        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Calculate optimal dimensions maintaining aspect ratio
   */
  _calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
    let width = originalWidth;
    let height = originalHeight;

    // Scale down if needed
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  /**
   * Generate unique filename
   */
  _generateFileName(originalName) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    return `optimized_${timestamp}_${random}.${extension}`;
  }

  /**
   * Delete image with cache invalidation
   */
  async deleteImage(fileName) {
    try {
      const response = await fetch('/api/delete-image', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileName }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Delete failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      // Clear related cache entries
      apiCache.clearPattern(`image:.*${fileName}`);
      
      return result;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  /**
   * Get upload queue status
   */
  getQueueStatus() {
    return {
      activeUploads: this.activeUploads.size,
      queuedUploads: this.uploadQueue.size,
      maxConcurrent: this.maxConcurrentUploads
    };
  }

  /**
   * Cancel all pending uploads
   */
  cancelAllUploads() {
    this.uploadQueue.clear();
    this.activeUploads.clear();
    console.log('🚫 Cancelled all pending uploads');
  }
}

// Create singleton instance
const optimizedImageUploadService = new OptimizedImageUploadService();

export default optimizedImageUploadService;
