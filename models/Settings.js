const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  websiteName: {
    type: String,
    required: true,
    default: 'Laiq Bags'
  },
  // Default return & replacement policy
  returnPolicy: {
    returnableByDefault: {
      type: Boolean,
      default: true
    },
    replaceableByDefault: {
      type: Boolean,
      default: true
    },
    merchantReturnDays: {
      type: Number,
      default: 7,
      min: 0,
      max: 60
    },
    merchantReplacementDays: {
      type: Number,
      default: 7,
      min: 0,
      max: 60
    },
    returnFees: {
      type: String,
      enum: ['free', 'customer'],
      default: 'free'
    },
    policyNotes: {
      type: String,
      default: 'Items can be returned or replaced within the window if unused and in original packaging.'
    }
  },
  contactEmail: {
    type: String,
    required: true,
    default: 'mdhidayatulahsheikh786@gmail.com'
  },
  instagramHandle: {
    type: String,
    default: '@laiq_bags_'
  },
  whatsappNumber: {
    type: String,
    default: '+91 99999 99999'
  },
  address: {
    street: {
      type: String,
      default: 'Admin Street'
    },
    city: {
      type: String,
      default: 'Mumbai'
    },
    state: {
      type: String,
      default: 'Maharashtra'
    },
    pincode: {
      type: String,
      default: '400001'
    },
    country: {
      type: String,
      default: 'India'
    }
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      websiteName: 'Laiq Bags',
      contactEmail: 'mdhidayatulahsheikh786@gmail.com',
      instagramHandle: '@laiq_bags_',
      whatsappNumber: '+91 99999 99999',
      address: {
        street: 'Admin Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India'
      },
      // Don't set updatedBy for default settings
    });
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema); 