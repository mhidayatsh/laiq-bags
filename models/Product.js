const mongoose = require('mongoose');
const zlib = require('zlib');
const util = require('util');

// Promisify compression functions
const gzip = util.promisify(zlib.gzip);
const gunzip = util.promisify(zlib.gunzip);

// Compression middleware
const compressText = async (text) => {
  if (!text || text.length < 1000) return text; // Don't compress small text
  try {
    const compressed = await gzip(text);
    return compressed.toString('base64');
  } catch (error) {
    console.error('❌ Compression error:', error);
    return text; // Return original if compression fails
  }
};

const decompressText = async (compressedText) => {
  if (!compressedText || !compressedText.startsWith('H4sI')) return compressedText; // Not compressed
  try {
    const buffer = Buffer.from(compressedText, 'base64');
    const decompressed = await gunzip(buffer);
    return decompressed.toString();
  } catch (error) {
    console.error('❌ Decompression error:', error);
    return compressedText; // Return original if decompression fails
  }
};

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter product name'],
    trim: true,
    maxLength: [100, 'Product name cannot exceed 100 characters']
  },
  // SEO-optimized URL slug
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[a-z0-9-]+$/.test(v);
      },
      message: 'Slug can only contain lowercase letters, numbers, and hyphens'
    }
  },
  description: {
    type: String,
    required: [true, 'Please enter product description']
  },
  // SEO meta description
  metaDescription: {
    type: String,
    maxLength: [160, 'Meta description cannot exceed 160 characters'],
    trim: true
  },
  // SEO keywords
  seoKeywords: [{
    type: String,
    trim: true
  }],
  // SEO title (optional, defaults to name)
  seoTitle: {
    type: String,
    maxLength: [60, 'SEO title cannot exceed 60 characters'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Please enter product price'],
    maxLength: [5, 'Price cannot exceed 5 characters'],
    default: 0.0
  },
  images: [{
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: 'Product Image'
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  category: {
    type: String,
    required: [true, 'Please select category for this product'],
    enum: {
      values: [
        'backpack',
        'sling',
        'handbag',
        'tote',
        'laptop-bag',
        'travel-bag'
      ],
      message: 'Please select correct category'
    }
  },
  type: {
    type: String,
    required: [true, 'Please select type for this product'],
    enum: {
      values: [
        'backpack',
        'sling',
        'handbag'
      ],
      message: 'Please select correct type'
    }
  },
  size: {
    type: String,
    required: [true, 'Please enter product size']
  },
  material: {
    type: String,
    required: [true, 'Please enter product material']
  },
  // Enhanced color system with stock per color
  colorVariants: [{
    name: {
      type: String,
      required: true
    },
    code: {
      type: String,
      required: true
    },
    stock: {
      type: Number,
      default: 0,
      min: 0
    },
    images: [{
      public_id: String,
      url: String,
      alt: String
    }],
    isAvailable: {
      type: Boolean,
      default: true
    }
  }],
  // Legacy colors field for backward compatibility
  colors: [{
    type: String
  }],
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  numOfReviews: {
    type: Number,
    default: 0
  },
  ratings: {
    type: Number,
    default: 0
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      name: {
        type: String,
        required: true
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        required: true
      }
    }
  ],
  featured: {
    type: Boolean,
    default: false
  },
  bestSeller: {
    type: Boolean,
    default: false
  },
  newArrival: {
    type: Boolean,
    default: false
  },
  // Enhanced discount system
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    validate: {
      validator: function(value) {
        return value >= 0 && value <= 100;
      },
      message: 'Discount must be between 0 and 100'
    }
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountStartDate: {
    type: Date,
    default: null
  },
  discountEndDate: {
    type: Date,
    default: null
  },
  isDiscountActive: {
    type: Boolean,
    default: false
  },
  originalPrice: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String
  }],
  // Enhanced specifications
  specifications: {
    dimensions: {
      length: String,
      width: String,
      height: String,
      display: String // e.g., "35 × 25 × 12 cm"
    },
    weight: String,
    capacity: String,
    features: [String],
    care: {
      type: String,
      default: 'Wipe with damp cloth'
    },
    warranty: {
      type: String,
      default: '1 year'
    },
    closure: String, // e.g., "Zipper", "Magnetic", "Drawstring"
    pockets: {
      type: String,
      default: 'Multiple compartments'
    },
    waterResistant: {
      type: Boolean,
      default: false
    },
    laptopCompartment: {
      type: Boolean,
      default: false
    },
    usbPort: {
      type: Boolean,
      default: false
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Add indexes for better performance
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ type: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ featured: 1 });
productSchema.index({ 'colorVariants.isAvailable': 1 });

// Additional indexes for better performance
productSchema.index({ slug: 1 }); // For slug lookups
productSchema.index({ tags: 1 }); // For tag searches
productSchema.index({ price: 1, category: 1 }); // Compound index for filtered searches
productSchema.index({ isDiscountActive: 1, discount: -1 }); // For discount queries
productSchema.index({ seoKeywords: 1 }); // For SEO keyword searches
productSchema.index({ 'specifications.features': 1 }); // For feature-based searches

// Virtual for total stock across all colors
productSchema.virtual('totalStock').get(function() {
  if (this.colorVariants && this.colorVariants.length > 0) {
    return this.colorVariants.reduce((total, variant) => {
      return total + (variant.stock || 0);
    }, 0);
  }
  return this.stock || 0;
});

// Virtual for calculated discount price
productSchema.virtual('discountPrice').get(function() {
  if (!this.isDiscountActive || this.discount <= 0) {
    return this.price;
  }
  
  if (this.discountType === 'percentage') {
    return Math.round(this.price - (this.price * this.discount / 100));
  } else {
    return Math.max(0, this.price - this.discountAmount);
  }
});

// Virtual for discount savings amount
productSchema.virtual('discountSavings').get(function() {
  if (!this.isDiscountActive || this.discount <= 0) {
    return 0;
  }
  
  if (this.discountType === 'percentage') {
    return Math.round(this.price * this.discount / 100);
  } else {
    return Math.min(this.price, this.discountAmount);
  }
});

// Virtual for discount status
productSchema.virtual('discountStatus').get(function() {
  if (!this.isDiscountActive) {
    return 'inactive';
  }
  
  const now = new Date();
  
  if (this.discountStartDate && now < this.discountStartDate) {
    return 'upcoming';
  }
  
  if (this.discountEndDate && now > this.discountEndDate) {
    return 'expired';
  }
  
  return 'active';
});

// Virtual for average rating
productSchema.virtual('averageRating').get(function() {
  if (!this.reviews || this.reviews.length === 0) {
    return 0;
  }
  
  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((totalRating / this.reviews.length) * 10) / 10; // Round to 1 decimal place
});

// Virtual for review count
productSchema.virtual('reviewCount').get(function() {
  return this.reviews ? this.reviews.length : 0;
});

// Virtual for discount time remaining
productSchema.virtual('discountTimeRemaining').get(function() {
  if (!this.isDiscountActive || !this.discountEndDate) {
    return null;
  }
  
  const now = new Date();
  const endDate = new Date(this.discountEndDate);
  
  if (now > endDate) {
    return null;
  }
  
  const diff = endDate - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes };
});

// Method to get available colors
productSchema.methods.getAvailableColors = function() {
  if (this.colorVariants && this.colorVariants.length > 0) {
    return this.colorVariants.filter(variant => variant.isAvailable && variant.stock > 0);
  }
  return this.colors || [];
};

// Method to check if product is in stock
productSchema.methods.isInStock = function(colorName = null) {
  if (colorName && this.colorVariants && this.colorVariants.length > 0) {
    const variant = this.colorVariants.find(v => v.name === colorName);
    return variant && variant.isAvailable && variant.stock > 0;
  }
  return this.totalStock > 0;
};

// Method to get primary image
productSchema.methods.getPrimaryImage = function() {
  const primaryImage = this.images.find(img => img.isPrimary);
  return primaryImage ? primaryImage.url : (this.images[0] ? this.images[0].url : null);
};

// Method to check if discount is valid
productSchema.methods.isDiscountValid = function() {
  // First check if there's a discount value
  if (this.discount <= 0) {
    return false;
  }
  
  // Check date constraints regardless of isDiscountActive flag
  const now = new Date();
  
  if (this.discountStartDate && now < this.discountStartDate) {
    return false;
  }
  
  if (this.discountEndDate && now > this.discountEndDate) {
    return false;
  }
  
  // If we reach here, discount should be active
  return true;
};

// Method to get current discount status (real-time)
productSchema.methods.getCurrentDiscountStatus = function() {
  if (this.discount <= 0) {
    return 'inactive';
  }
  
  const now = new Date();
  
  if (this.discountStartDate && now < this.discountStartDate) {
    return 'upcoming';
  }
  
  if (this.discountEndDate && now > this.discountEndDate) {
    return 'expired';
  }
  
  return 'active';
};

// Method to get formatted discount info
productSchema.methods.getDiscountInfo = function() {
  // Use real-time status checking instead of relying on isDiscountActive
  const currentStatus = this.getCurrentDiscountStatus();
  
  if (currentStatus !== 'active') {
    return null;
  }
  
  return {
    type: this.discountType,
    value: this.discountType === 'percentage' ? `${this.discount}%` : `₹${this.discountAmount}`,
    originalPrice: this.price,
    discountPrice: this.discountPrice,
    savings: this.discountSavings,
    timeRemaining: this.discountTimeRemaining,
    status: currentStatus
  };
};

// Pre-save middleware to update discount status and compress data
productSchema.pre('save', async function(next) {
  try {
    // Update original price if not set
    if (!this.originalPrice || this.originalPrice === 0) {
      this.originalPrice = this.price;
    }
    
    // Update discount amount for percentage discounts
    if (this.discountType === 'percentage' && this.discount > 0) {
      this.discountAmount = Math.round(this.price * this.discount / 100);
    }
    
    // Check if discount should be active
    if (this.discount > 0) {
      const now = new Date();
      let shouldBeActive = true;
      
      if (this.discountStartDate && now < this.discountStartDate) {
        shouldBeActive = false;
      }
      
      if (this.discountEndDate && now > this.discountEndDate) {
        shouldBeActive = false;
      }
      
      this.isDiscountActive = shouldBeActive;
    } else {
      this.isDiscountActive = false;
    }
    
    // Compress large text fields
    if (this.description && this.description.length > 1000) {
      console.log('🗜️ Compressing description:', this.description.length, 'characters');
      this.description = await compressText(this.description);
    }
    
    // Compress image URLs if they are base64 data URLs
    if (this.images && this.images.length > 0) {
      for (let image of this.images) {
        if (image.url && image.url.startsWith('data:image/') && image.url.length > 10000) {
          console.log('🗜️ Compressing image URL:', image.url.length, 'characters');
          image.url = await compressText(image.url);
        }
      }
    }
    
    // Compress color variant images
    if (this.colorVariants && this.colorVariants.length > 0) {
      for (let variant of this.colorVariants) {
        if (variant.images && variant.images.length > 0) {
          for (let image of variant.images) {
            if (image.url && image.url.startsWith('data:image/') && image.url.length > 10000) {
              console.log('🗜️ Compressing color variant image URL:', image.url.length, 'characters');
              image.url = await compressText(image.url);
            }
          }
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('❌ Pre-save compression error:', error);
    next(error);
  }
});

// Pre-save middleware for stock calculation
productSchema.pre('save', function(next) {
  // Ensure stock is calculated from colorVariants if available
  if (this.colorVariants && this.colorVariants.length > 0) {
    const calculatedStock = this.colorVariants.reduce((sum, variant) => {
      return sum + (parseInt(variant.stock) || 0);
    }, 0);
    this.stock = calculatedStock;
    console.log('📦 Pre-save stock calculation:', {
      colorVariants: this.colorVariants.map(v => ({ name: v.name, stock: v.stock })),
      calculatedStock: calculatedStock
    });
  }
  next();
});

// Post-find middleware to ensure stock consistency
productSchema.post(['find', 'findOne', 'findById'], function(docs) {
  if (!docs) return;
  
  const documents = Array.isArray(docs) ? docs : [docs];
  
  documents.forEach(doc => {
    if (doc.colorVariants && doc.colorVariants.length > 0) {
      const calculatedStock = doc.colorVariants.reduce((sum, variant) => {
        return sum + (parseInt(variant.stock) || 0);
      }, 0);
      
      // Only update if there's a mismatch
      if (doc.stock !== calculatedStock) {
        console.log('📦 Post-find stock correction:', {
          product: doc.name,
          oldStock: doc.stock,
          newStock: calculatedStock
        });
        doc.stock = calculatedStock;
      }
    }
  });
});

// Pre-save middleware for SEO optimization
productSchema.pre('save', function(next) {
  // Generate slug if not provided
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim('-'); // Remove leading/trailing hyphens
  }
  
  // Generate meta description if not provided
  if (!this.metaDescription && this.description) {
    this.metaDescription = this.description
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .substring(0, 157) // Keep under 160 chars
      .trim();
    if (this.metaDescription.length === 157) {
      this.metaDescription += '...';
    }
  }
  
  // Generate SEO title if not provided
  if (!this.seoTitle && this.name) {
    this.seoTitle = this.name.length > 60 
      ? this.name.substring(0, 57) + '...' 
      : this.name;
  }
  
  next();
});

// Post-find middleware to decompress data
productSchema.post(['find', 'findOne', 'findById'], async function(docs) {
  try {
    // Allow routes to opt-out of decompression for performance (e.g., light listing)
    const opts = typeof this.getOptions === 'function' ? this.getOptions() : {};
    if (opts && opts.skipDecompression) {
      return;
    }
    if (!docs) return;
    
    const documents = Array.isArray(docs) ? docs : [docs];
    
    for (let doc of documents) {
      if (!doc) continue;
      
      // Decompress description
      if (doc.description && doc.description.startsWith('H4sI')) {
        doc.description = await decompressText(doc.description);
      }
      
      // Decompress image URLs
      if (doc.images && doc.images.length > 0) {
        for (let image of doc.images) {
          if (image.url && image.url.startsWith('H4sI')) {
            image.url = await decompressText(image.url);
          }
        }
      }
      
      // Decompress color variant images
      if (doc.colorVariants && doc.colorVariants.length > 0) {
        for (let variant of doc.colorVariants) {
          if (variant.images && variant.images.length > 0) {
            for (let image of variant.images) {
              if (image.url && image.url.startsWith('H4sI')) {
                image.url = await decompressText(image.url);
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Post-find decompression error:', error);
  }
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema); 