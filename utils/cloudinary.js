'use strict';

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary from environment
function configureCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.warn('⚠️ Cloudinary environment variables are not fully set. Image uploads will be skipped.');
    return false;
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
  });
  return true;
}

// Upload a single image (data URL or remote URL) to Cloudinary
async function uploadImage(input, options = {}) {
  if (!configureCloudinary()) return null;
  if (!input) return null;
  try {
    // Allow data URLs or remote URLs
    const uploadOptions = {
      folder: options.folder || 'laiq-bags/products',
      overwrite: false,
      resource_type: 'image',
      transformation: options.transformation || [{ width: 1200, height: 1200, crop: 'limit' }],
      format: options.format || 'webp'
    };
    const res = await cloudinary.uploader.upload(input, uploadOptions);
    return {
      public_id: res.public_id,
      url: res.secure_url
    };
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error?.message || error);
    return null;
  }
}

// Delete a single image by public_id
async function deleteImage(publicId) {
  if (!configureCloudinary()) return false;
  if (!publicId) return false;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    return true;
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error?.message || error);
    return false;
  }
}

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage,
  configureCloudinary
};


