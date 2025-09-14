// Image Upload and Optimization Service
export class ImageUploadService {
  constructor() {
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    this.optimizedWidth = 300; // Reduced from 400 to 300
    this.optimizedHeight = 300; // Reduced from 400 to 300
    this.quality = 0.7; // Reduced from 0.8 to 0.7 for smaller file size
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
    return this.optimizeImageWithSettings(file, this.optimizedWidth, this.optimizedHeight, this.quality);
  }

  // Optimize image with custom settings
  async optimizeImageWithSettings(file, maxWidth, maxHeight, quality) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = this.calculateDimensions(
          img.width, 
          img.height, 
          maxWidth, 
          maxHeight
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
          quality
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
      console.log('ImageUploadService: Starting image upload for:', file.name, file.type, file.size);
      
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        console.log('ImageUploadService: File validation failed:', validation.errors);
        throw new Error(validation.errors.join(', '));
      }

      // Optimize image
      console.log('ImageUploadService: Optimizing image...');
      const optimizedBlob = await this.optimizeImage(file);
      console.log('ImageUploadService: Image optimized, new size:', optimizedBlob.size);
      
      // Generate filename
      const fileName = this.generateFileName(file.name);
      console.log('ImageUploadService: Generated filename:', fileName);
      
      // Try to upload to server first
      try {
        const formData = new FormData();
        formData.append('image', optimizedBlob, fileName);
        formData.append('folder', 'optimized');

        console.log('ImageUploadService: Attempting server upload...');
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          console.log('ImageUploadService: Server upload successful:', result);
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
        console.warn('ImageUploadService: Server upload failed, using fallback:', serverError.message);
        
        // Fallback: Convert to base64 and store in localStorage
        console.log('ImageUploadService: Converting to base64...');
        let base64Url = await this.blobToBase64(optimizedBlob);
        let fallbackUrl = `data:image/jpeg;base64,${base64Url}`;
        console.log('ImageUploadService: Base64 URL length:', fallbackUrl.length);
        
        // If still too large, try with even smaller dimensions and lower quality
        if (fallbackUrl.length > 50000) {
          console.log('ImageUploadService: First optimization too large, trying smaller size...');
          const smallerBlob = await this.optimizeImageWithSettings(file, 200, 200, 0.5);
          base64Url = await this.blobToBase64(smallerBlob);
          fallbackUrl = `data:image/jpeg;base64,${base64Url}`;
          console.log('ImageUploadService: Smaller base64 URL length:', fallbackUrl.length);
        }
        
        // Check if base64 URL is still too long for database
        if (fallbackUrl.length > 50000) {
          console.warn('ImageUploadService: Base64 image still too large, using placeholder');
          // Use a data URI for a simple placeholder instead of a file that might not exist
          const placeholderUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIFRvbyBMYXJnZTwvdGV4dD48L3N2Zz4=';
          
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
        console.log('ImageUploadService: Stored in localStorage with key:', storageKey);
        
        return {
          success: true,
          fileName: fileName,
          url: fallbackUrl,
          optimizedUrl: fallbackUrl,
          isFallback: true
        };
      }

    } catch (error) {
      console.error('ImageUploadService: Image upload error:', error);
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
