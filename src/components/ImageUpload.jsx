import { useState, useRef, useCallback } from 'react';
import { imageUploadService } from '../services/imageUploadService';

const ImageUpload = ({ 
  value = '', 
  onChange, 
  onError,
  disabled = false,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(value || '');
  const [dragCounter, setDragCounter] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = useCallback(async (file) => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('Uploading and optimizing image...');
    
    try {
      // Create preview URL
      const preview = imageUploadService.createPreviewUrl(file);
      setPreviewUrl(preview);

      // Upload and optimize image
      const result = await imageUploadService.uploadImage(file);
      
      if (result.success) {
        // Update parent component with the optimized image URL
        onChange(result.optimizedUrl);
        
        // Clean up preview URL
        imageUploadService.revokePreviewUrl(preview);
        setPreviewUrl(result.optimizedUrl);
        
        // Show success message
        if (result.isFallback) {
          if (result.isPlaceholder) {
            setUploadStatus('Image too large, using placeholder');
            console.warn('Image too large for base64 storage, using placeholder.');
          } else {
            setUploadStatus('Image uploaded (using fallback method)');
            console.warn('Image uploaded using fallback method (base64). Server upload failed.');
          }
        } else {
          setUploadStatus('Image uploaded successfully');
        }
        
        // Clear status after 3 seconds
        setTimeout(() => setUploadStatus(''), 3000);
      } else {
        // Handle upload error
        setUploadStatus('Upload failed');
        onError?.(result.error);
        
        // Clean up preview URL
        imageUploadService.revokePreviewUrl(preview);
        setPreviewUrl('');
        
        // Clear error status after 5 seconds
        setTimeout(() => setUploadStatus(''), 5000);
      }
    } catch (error) {
      setUploadStatus('Upload failed');
      onError?.(error.message);
      setPreviewUrl('');
      
      // Clear error status after 5 seconds
      setTimeout(() => setUploadStatus(''), 5000);
    } finally {
      setIsUploading(false);
    }
  }, [onChange, onError]);

  // Handle drag events
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter <= 1) {
      setIsDragging(false);
    }
  }, [dragCounter]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect, disabled]);

  // Handle file input change
  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle click to open file dialog
  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  // Handle remove image
  const handleRemove = (e) => {
    e.stopPropagation();
    setPreviewUrl('');
    onChange('');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragging 
            ? 'border-orange-500 bg-orange-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isUploading ? 'pointer-events-none' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {previewUrl ? (
          // Image preview
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="mx-auto max-h-48 max-w-full rounded-lg object-cover"
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          // Upload prompt
          <div className="space-y-4">
            {isUploading ? (
              <div className="space-y-2">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                <p className="text-sm text-gray-600">Uploading and optimizing image...</p>
              </div>
            ) : (
              <>
                <div className="mx-auto w-12 h-12 text-gray-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {isDragging ? 'Drop image here' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, WebP up to 5MB
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Upload progress indicator */}
      {isUploading && (
        <div className="mt-2">
          <div className="bg-gray-200 rounded-full h-2">
            <div className="bg-orange-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      )}

      {/* Upload status */}
      {uploadStatus && (
        <div className={`mt-2 text-sm ${
          uploadStatus.includes('successfully') 
            ? 'text-green-600' 
            : uploadStatus.includes('failed') 
            ? 'text-red-600' 
            : 'text-blue-600'
        }`}>
          {uploadStatus}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
