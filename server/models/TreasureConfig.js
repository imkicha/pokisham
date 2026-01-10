const mongoose = require('mongoose');

const treasureConfigSchema = new mongoose.Schema({
  isActive: {
    type: Boolean,
    default: true
  },
  couponCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minOrderValue: {
    type: Number,
    default: 0
  },
  maxDiscount: {
    type: Number,
    default: null
  },
  treasureImage: {
    type: String,
    default: '/treasure-offer.png'
  },
  title: {
    type: String,
    default: 'You Found a Treasure!'
  },
  description: {
    type: String,
    default: 'Use this special coupon code on your next purchase!'
  },
  appearanceInterval: {
    type: Number,
    default: 180000, // 3 minutes in milliseconds
    min: 60000 // minimum 1 minute
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Ensure only one config exists (singleton pattern)
treasureConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({
      couponCode: 'TREASURE10',
      discountType: 'percentage',
      discountValue: 10
    });
  }
  return config;
};

module.exports = mongoose.model('TreasureConfig', treasureConfigSchema);
