export const IMAGE_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  OPTIMAL_WIDTH: 1920, // 16:9 ratio
  OPTIMAL_HEIGHT: 1080,
  COMPRESSION_QUALITY: 0.8,
  ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const // Make this a literal type
} as const;

// Define accepted MIME types
type AcceptedImageType = typeof IMAGE_CONFIG.ACCEPTED_TYPES[number];

export class ImageProcessor {
  static async compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const canvas = document.createElement('canvas');
        
        let width = img.width;
        let height = img.height;
        
        if (width > IMAGE_CONFIG.OPTIMAL_WIDTH || height > IMAGE_CONFIG.OPTIMAL_HEIGHT) {
          const ratio = Math.min(
            IMAGE_CONFIG.OPTIMAL_WIDTH / width, 
            IMAGE_CONFIG.OPTIMAL_HEIGHT / height
          );
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Image compression failed'));
            }
          },
          'image/jpeg' as AcceptedImageType,
          IMAGE_CONFIG.COMPRESSION_QUALITY
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
    });
  }

  static validateImage(file: File): { isValid: boolean; error?: string } {
    const fileType = file.type as AcceptedImageType;
    
    if (!IMAGE_CONFIG.ACCEPTED_TYPES.includes(fileType)) {
      return {
        isValid: false,
        error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.'
      };
    }

    if (file.size > IMAGE_CONFIG.MAX_FILE_SIZE * 2) {
      return {
        isValid: false,
        error: 'Image is too large. Please select an image under 10MB'
      };
    }

    return { isValid: true };
  }

  static generateFileName(originalName: string): string {
    return `${crypto.randomUUID()}.jpg`;
  }
}