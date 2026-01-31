const mongoose = require('mongoose');

const comboOfferSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide combo offer title'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Type of combo offer
    comboType: {
      type: String,
      enum: ['fixed_products', 'category_combo', 'any_n_products'],
      required: true,
      // fixed_products: Specific products combo (Frame A + Frame B = ₹1200)
      // category_combo: Any N items from category (Any 3 from Wall Frames = 20% off)
      // any_n_products: Any N products from seller (Buy 4 from this shop = ₹500 off)
    },
    // === FOR FIXED PRODUCTS COMBO ===
    // Specific products that must be purchased together
    comboProducts: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
      quantity: {
        type: Number,
        default: 1,
      },
      variant: {
        size: { type: String, default: '' },
      },
    }],
    // Fixed combo price (for fixed_products type)
    comboPrice: {
      type: Number,
      default: 0,
    },

    // === FOR CATEGORY COMBO ===
    // Categories applicable for category combo
    applicableCategories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    }],
    // Minimum items required from category
    minItemsFromCategory: {
      type: Number,
      default: 2,
    },

    // === FOR ANY N PRODUCTS COMBO ===
    // Minimum products required to trigger combo
    minProducts: {
      type: Number,
      default: 2,
    },

    // === DISCOUNT SETTINGS (for category_combo and any_n_products) ===
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      default: 0,
    },
    // Maximum discount cap for percentage discounts
    maxDiscountAmount: {
      type: Number,
      default: 0, // 0 means no limit
    },

    // === OWNERSHIP ===
    // Who created this combo
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // If created by tenant, this links to tenant user
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Is this a global combo (admin) or tenant-specific
    isGlobal: {
      type: Boolean,
      default: false,
    },

    // === STACKING RULES ===
    // Can admin offers be applied on top of this combo?
    allowAdminOffersOnTop: {
      type: Boolean,
      default: false,
    },
    // Priority (higher = checked first)
    priority: {
      type: Number,
      default: 0,
    },

    // === VALIDITY ===
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

    // === USAGE TRACKING ===
    usageLimit: {
      type: Number,
      default: 0, // 0 = unlimited
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    perUserLimit: {
      type: Number,
      default: 0, // 0 = unlimited per user
    },
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

    // === DISPLAY ===
    image: {
      type: String,
      default: '',
    },
    imagePublicId: {
      type: String,
      default: '',
    },
    badge: {
      type: String,
      default: 'COMBO',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
comboOfferSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
comboOfferSchema.index({ comboType: 1, tenant: 1 });
comboOfferSchema.index({ isGlobal: 1 });
comboOfferSchema.index({ 'comboProducts.product': 1 });

module.exports = mongoose.model('ComboOffer', comboOfferSchema);
