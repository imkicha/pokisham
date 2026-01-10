const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide offer title'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    imagePublicId: {
      type: String,
      default: '',
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed', 'none'],
      default: 'none',
    },
    discountValue: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    link: {
      type: String,
      default: '/products',
    },
    buttonText: {
      type: String,
      default: 'Shop Now',
    },
    backgroundColor: {
      type: String,
      default: '#f97316', // Orange
    },
    textColor: {
      type: String,
      default: '#ffffff',
    },
    festivalType: {
      type: String,
      enum: ['diwali', 'pongal', 'navratri', 'christmas', 'newyear', 'onam', 'ugadi', 'holi', 'eid', 'general', 'sale', 'other'],
      default: 'general',
    },
    startDate: {
      type: Date,
      required: [true, 'Please provide start date'],
    },
    endDate: {
      type: Date,
      required: [true, 'Please provide end date'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 0, // Higher priority shows first
    },
    displayLocation: {
      type: [String],
      enum: ['homepage_banner', 'homepage_card', 'products_page', 'checkout'],
      default: ['homepage_banner'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying active offers
offerSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('Offer', offerSchema);
