export interface OptimizeImageOptions {
  targetWidth?: number;
  targetHeight?: number;
  quality?: number;
  format?: 'image/png' | 'image/webp' | 'image/jpeg';
}

export interface OptimizedImageResult {
  dataUrl: string;
  blob: Blob;
  originalWidth: number;
  originalHeight: number;
  optimizedWidth: number;
  optimizedHeight: number;
  originalSize: number;
  optimizedSize: number;
  aspectRatio: number;
}

/**
 * Optimizes, center-crops, and resizes any uploaded image down to exact target dimensions (default 64x64).
 * Preserves alpha transparency for PNGs/SVGs/WebPs.
 */
export async function optimizeCompanyIcon(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<OptimizedImageResult> {
  const {
    targetWidth = 64,
    targetHeight = 64,
    quality = 0.92,
    format = 'image/png',
  } = options;

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const originalWidth = img.naturalWidth || img.width || targetWidth;
      const originalHeight = img.naturalHeight || img.height || targetHeight;
      const aspectRatio = originalWidth / originalHeight;

      // 1. Center crop to 1:1 square
      const cropSize = Math.min(originalWidth, originalHeight);
      const sourceX = (originalWidth - cropSize) / 2;
      const sourceY = (originalHeight - cropSize) / 2;

      // 2. Offscreen Canvas for exact target dimensions
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Clear for transparency
      ctx.clearRect(0, 0, targetWidth, targetHeight);

      // Draw cropped square into exact target width & height
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        cropSize,
        cropSize,
        0,
        0,
        targetWidth,
        targetHeight
      );

      // 3. Export to dataUrl
      const dataUrl = canvas.toDataURL(format, quality);

      // 4. Export to Blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create image blob'));
            return;
          }

          resolve({
            dataUrl,
            blob,
            originalWidth,
            originalHeight,
            optimizedWidth: targetWidth,
            optimizedHeight: targetHeight,
            originalSize: file.size,
            optimizedSize: blob.size,
            aspectRatio,
          });
        },
        format,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image file. Please ensure it is a valid image.'));
    };

    img.src = objectUrl;
  });
}

