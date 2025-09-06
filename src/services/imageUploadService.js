// Image Upload and Optimization Service
export class ImageUploadService {
  constructor() {
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    this.optimizedWidth = 400;
    this.optimizedHeight = 400;
    this.quality = 0.8;
  }

  // Validate file before upload
  validateFile(file) {
    const errors = [];

    if (!file) {
      errors.push('Please select a file');
      return { isValid: false, errors };
    }

    if (!this.allowedTypes.includes(file.type)) {
      errors.push('Please select a valid image file (JPEG, PNG, or WebP)');
    }

    if (file.size > this.maxFileSize) {
      errors.push('File size must be less than 5MB');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Optimize image using canvas
  async optimizeImage(file) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = this.calculateDimensions(
          img.width, 
          img.height, 
          this.optimizedWidth, 
          this.optimizedHeight
        );

        canvas.width = width;
        canvas.height = height;

        // Draw and optimize image
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to optimize image'));
            }
          },
          'image/jpeg',
          this.quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Calculate optimal dimensions while maintaining aspect ratio
  calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
    let width = originalWidth;
    let height = originalHeight;

    // Scale down if image is larger than max dimensions
    if (width > maxWidth || height > maxHeight) {
      const aspectRatio = width / height;
      
      if (width > height) {
        width = maxWidth;
        height = width / aspectRatio;
      } else {
        height = maxHeight;
        width = height * aspectRatio;
      }
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  // Generate unique filename
  generateFileName(originalName) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop().toLowerCase();
    return `menu_${timestamp}_${randomString}.${extension}`;
  }

  // Upload optimized image to public/optimized folder
  async uploadImage(file) {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Optimize image
      const optimizedBlob = await this.optimizeImage(file);
      
      // Generate filename
      const fileName = this.generateFileName(file.name);
      
      // Try to upload to server first
      try {
        const formData = new FormData();
        formData.append('image', optimizedBlob, fileName);
        formData.append('folder', 'optimized');

        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          return {
            success: true,
            fileName: result.fileName,
            url: result.url,
            optimizedUrl: result.optimizedUrl
          };
        } else {
          throw new Error(`Server upload failed: ${response.status}`);
        }
      } catch (serverError) {
        console.warn('Server upload failed, using fallback:', serverError.message);
        
        // Fallback: Convert to base64 and store in localStorage
        const base64Url = await this.blobToBase64(optimizedBlob);
        const fallbackUrl = `data:image/jpeg;base64,${base64Url}`;
        
        // Check if base64 URL is too long for database
        if (fallbackUrl.length > 10000) { // Conservative limit
          console.warn('Base64 image too large, using placeholder');
          const placeholderUrl = '/placeholder-image.svg';
          
          return {
            success: true,
            fileName: fileName,
            url: placeholderUrl,
            optimizedUrl: placeholderUrl,
            isFallback: true,
            isPlaceholder: true
          };
        }
        
        // Store in localStorage with a unique key
        const storageKey = `temp_image_${fileName}`;
        localStorage.setItem(storageKey, fallbackUrl);
        
        return {
          success: true,
          fileName: fileName,
          url: fallbackUrl,
          optimizedUrl: fallbackUrl,
          isFallback: true
        };
      }

    } catch (error) {
      console.error('Image upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Convert blob to base64
  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Delete image from server
  async deleteImage(fileName) {
    try {
      const response = await fetch('/api/delete-image', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileName, folder: 'optimized' }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      return { success: true };
    } catch (error) {
      console.error('Image deletion error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get image preview URL
  createPreviewUrl(file) {
    return URL.createObjectURL(file);
  }

  // Revoke preview URL to free memory
  revokePreviewUrl(url) {
    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const imageUploadService = new ImageUploadService();
