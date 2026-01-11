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
    // ===== NEW FIELDS FOR ADMIN & TENANT OFFERS =====
    offerType: {
      type: String,
      enum: ['global', 'category', 'tenant'],
      default: 'global',
      // global = applies to all products (admin only)
      // category = applies to specific categories (admin only)
      // tenant = applies to tenant's own products only
    },
    // For category-specific offers (admin)
    applicableCategories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    }],
    // For tenant-specific offers or when admin targets specific tenants
    applicableTenants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    // For tenant's own offers - the tenant who created it
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Minimum order amount for the offer to apply
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    // Maximum discount amount (for percentage discounts)
    maxDiscountAmount: {
      type: Number,
      default: 0, // 0 means no limit
    },
    // Usage limits
    usageLimit: {
      type: Number,
      default: 0, // 0 means unlimited
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    // Per user usage limit
    perUserLimit: {
      type: Number,
      default: 0, // 0 means unlimited
    },
    // Can this offer be combined with other offers?
    canCombine: {
      type: Boolean,
      default: false,
    },
    // Users who have used this offer (for per-user limit tracking)
    usedBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      usageCount: {
        type: Number,
        default: 1,
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Index for querying active offers
offerSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
offerSchema.index({ offerType: 1, tenant: 1 });
offerSchema.index({ couponCode: 1 });

module.exports = mongoose.model('Offer', offerSchema);
