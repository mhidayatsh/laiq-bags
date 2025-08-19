const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const zlib = require('zlib');

// Image optimization configuration
const IMAGE_CONFIGS = {
  thumbnail: { width: 150, height: 150, quality: 80 },
  small: { width: 400, height: 400, quality: 85 },
  medium: { width: 800, height: 800, quality: 80 },
  large: { width: 1200, height: 1200, quality: 75 }
};

// Supported formats
const SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'avif'];

// Optimize image with multiple sizes
const optimizeImage = async (inputBuffer, options = {}) => {
  try {
    const {
      format = 'webp',
      quality = 80,
      width,
      height,
      fit = 'inside'
    } = options;

    let pipeline = sharp(inputBuffer);

    // Resize if dimensions provided
    if (width || height) {
      pipeline = pipeline.resize(width, height, { 
        fit,
        withoutEnlargement: true 
      });
    }

    // Convert to specified format
    switch (format.toLowerCase()) {
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality });
        break;
      case 'jpeg':
      case 'jpg':
        pipeline = pipeline.jpeg({ quality });
        break;
      case 'png':
        pipeline = pipeline.png({ quality });
        break;
      default:
        pipeline = pipeline.webp({ quality });
    }

    return await pipeline.toBuffer();
  } catch (error) {
    console.error('Image optimization error:', error);
    return inputBuffer; // Return original if optimization fails
  }
};

// Generate multiple sizes for a product image
const generateProductImages = async (inputBuffer, productId) => {
  try {
    const results = {};
    
    for (const [size, config] of Object.entries(IMAGE_CONFIGS)) {
      const optimized = await optimizeImage(inputBuffer, {
        ...config,
        format: 'webp'
      });
      
      results[size] = {
        buffer: optimized,
        size: optimized.length,
        format: 'webp',
        dimensions: config
      };
    }

    // Also generate a JPEG fallback
    const jpegFallback = await optimizeImage(inputBuffer, {
      width: 800,
      height: 800,
      format: 'jpeg',
      quality: 85
    });

    results.jpeg = {
      buffer: jpegFallback,
      size: jpegFallback.length,
      format: 'jpeg',
      dimensions: { width: 800, height: 800 }
    };

    return results;
  } catch (error) {
    console.error('Product image generation error:', error);
    throw error;
  }
};

// Optimize image for web delivery
const optimizeForWeb = async (inputBuffer, options = {}) => {
  const {
    maxWidth = 800,
    maxHeight = 800,
    format = 'webp',
    quality = 80
  } = options;

  return await optimizeImage(inputBuffer, {
    width: maxWidth,
    height: maxHeight,
    format,
    quality,
    fit: 'inside'
  });
};

// Get image metadata
const getImageMetadata = async (inputBuffer) => {
  try {
    const metadata = await sharp(inputBuffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: inputBuffer.length,
      hasAlpha: metadata.hasAlpha,
      isOpaque: metadata.isOpaque
    };
  } catch (error) {
    console.error('Image metadata error:', error);
    return null;
  }
};

// Validate image format
const isValidImage = (buffer) => {
  try {
    const metadata = sharp(buffer).metadata();
    return SUPPORTED_FORMATS.includes(metadata.format);
  } catch (error) {
    return false;
  }
};

// Create placeholder image
const createPlaceholder = async (width = 400, height = 400, text = 'Image') => {
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f3f4f6"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="Arial, sans-serif" font-size="16">${text}</text>
    </svg>
  `;
  
  return Buffer.from(svg);
};

module.exports = {
  optimizeImage,
  generateProductImages,
  optimizeForWeb,
  getImageMetadata,
  isValidImage,
  createPlaceholder,
  IMAGE_CONFIGS,
  SUPPORTED_FORMATS,
  // Convert data URL or compressed data URL into optimized file under uploads and return URL
  normalizeImageUrlForProduct: async (url, productId, index = 0) => {
    try {
      if (!url) return url;
      // Decompress if needed
      if (typeof url === 'string' && url.startsWith('H4sI')) {
        try {
          const buffer = Buffer.from(url, 'base64');
          url = zlib.gunzipSync(buffer).toString();
        } catch (_) {}
      }
      // Keep non-data URLs as-is
      if (!String(url).startsWith('data:image/')) return url;
      const match = String(url).match(/^data:(image\/(png|jpe?g|webp|avif));base64,(.+)$/i);
      if (!match) return url;
      const base64Payload = match[3];
      const inputBuffer = Buffer.from(base64Payload, 'base64');
      // Prepare destination
      const safeProductId = String(productId || 'temp');
      const destDir = path.join(__dirname, '..', 'uploads', 'products', safeProductId);
      await fs.mkdir(destDir, { recursive: true });
      const fileBase = `img-${Date.now()}-${index}`;
      const destPath = path.join(destDir, `${fileBase}.webp`);
      // Optimize and save
      await sharp(inputBuffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(destPath);
      return `/uploads/products/${safeProductId}/${fileBase}.webp`;
    } catch (error) {
      console.error('normalizeImageUrlForProduct error:', error);
      return url;
    }
  }
};
