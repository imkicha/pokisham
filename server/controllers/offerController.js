const Offer = require('../models/Offer');
const Product = require('../models/Product');
const Tenant = require('../models/Tenant');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// @desc    Get all active offers (public)
// @route   GET /api/offers
// @access  Public
exports.getActiveOffers = async (req, res) => {
  try {
    const now = new Date();
    const location = req.query.location;

    const query = {
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    };

    // Filter by location unless 'all' is requested
    if (location && location !== 'all') {
      query.displayLocation = location;
    } else if (!location) {
      query.displayLocation = 'homepage_banner';
    }

    const offers = await Offer.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      count: offers.length,
      offers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all offers (admin)
// @route   GET /api/offers/admin/all
// @access  Private/Admin
exports.getAllOffers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by status
    if (req.query.status === 'active') {
      const now = new Date();
      query.isActive = true;
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
    } else if (req.query.status === 'inactive') {
      query.isActive = false;
    } else if (req.query.status === 'expired') {
      query.endDate = { $lt: new Date() };
    } else if (req.query.status === 'upcoming') {
      query.startDate = { $gt: new Date() };
    }

    // Filter by festival type
    if (req.query.festivalType) {
      query.festivalType = req.query.festivalType;
    }

    const offers = await Offer.find(query)
      .populate('createdBy', 'name email')
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Offer.countDocuments(query);

    res.status(200).json({
      success: true,
      count: offers.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      offers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single offer
// @route   GET /api/offers/:id
// @access  Public
exports.getOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate('createdBy', 'name');

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    res.status(200).json({
      success: true,
      offer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create offer
// @route   POST /api/offers
// @access  Private/Admin
exports.createOffer = async (req, res) => {
  try {
    const offerData = { ...req.body };
    offerData.createdBy = req.user._id;

    // Parse displayLocation if it's a string
    if (typeof offerData.displayLocation === 'string') {
      offerData.displayLocation = offerData.displayLocation.split(',').map(loc => loc.trim());
    }

    // Parse applicableCategories if it's a string
    if (typeof offerData.applicableCategories === 'string') {
      offerData.applicableCategories = offerData.applicableCategories
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0);
    }

    // Handle image upload
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'pokisham/offers',
          transformation: [
            { quality: 'auto:best' },
            { fetch_format: 'auto' }
          ],
        });
        offerData.image = result.secure_url;
        offerData.imagePublicId = result.public_id;

        // Delete temp file
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
      }
    }

    const offer = await Offer.create(offerData);

    res.status(201).json({
      success: true,
      message: 'Offer created successfully',
      offer,
    });
  } catch (error) {
    // Clean up temp file if exists
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update offer
// @route   PUT /api/offers/:id
// @access  Private/Admin
exports.updateOffer = async (req, res) => {
  try {
    let offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    const updateData = { ...req.body };

    // Parse displayLocation if it's a string
    if (typeof updateData.displayLocation === 'string') {
      updateData.displayLocation = updateData.displayLocation.split(',').map(loc => loc.trim());
    }

    // Parse applicableCategories if it's a string
    if (typeof updateData.applicableCategories === 'string') {
      updateData.applicableCategories = updateData.applicableCategories
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0);
    }

    // Handle new image upload
    if (req.file) {
      try {
        // Delete old image from cloudinary
        if (offer.imagePublicId) {
          await cloudinary.uploader.destroy(offer.imagePublicId);
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'pokisham/offers',
          transformation: [
            { quality: 'auto:best' },
            { fetch_format: 'auto' }
          ],
        });
        updateData.image = result.secure_url;
        updateData.imagePublicId = result.public_id;

        // Delete temp file
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
      }
    }

    offer = await Offer.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Offer updated successfully',
      offer,
    });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete offer
// @route   DELETE /api/offers/:id
// @access  Private/Admin
exports.deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    // Delete image from cloudinary
    if (offer.imagePublicId) {
      await cloudinary.uploader.destroy(offer.imagePublicId);
    }

    await offer.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Offer deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Toggle offer status
// @route   PUT /api/offers/:id/toggle
// @access  Private/Admin
exports.toggleOfferStatus = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    offer.isActive = !offer.isActive;
    await offer.save();

    res.status(200).json({
      success: true,
      message: `Offer ${offer.isActive ? 'activated' : 'deactivated'} successfully`,
      offer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===== TENANT OFFER FUNCTIONS =====

// @desc    Get tenant's own offers
// @route   GET /api/offers/tenant/my-offers
// @access  Private/Tenant
exports.getTenantOffers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { tenant: req.user._id, offerType: 'tenant' };

    // Filter by status
    if (req.query.status === 'active') {
      const now = new Date();
      query.isActive = true;
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
    } else if (req.query.status === 'inactive') {
      query.isActive = false;
    } else if (req.query.status === 'expired') {
      query.endDate = { $lt: new Date() };
    }

    const offers = await Offer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Offer.countDocuments(query);

    res.status(200).json({
      success: true,
      count: offers.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      offers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create tenant offer
// @route   POST /api/offers/tenant
// @access  Private/Tenant
exports.createTenantOffer = async (req, res) => {
  try {
    const offerData = { ...req.body };
    offerData.createdBy = req.user._id;
    offerData.tenant = req.user._id;
    offerData.offerType = 'tenant';

    // Tenant offers don't show on homepage banner by default
    offerData.displayLocation = offerData.displayLocation || ['checkout'];

    // Handle image upload
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'pokisham/tenant-offers',
          transformation: [
            { quality: 'auto:best' },
            { fetch_format: 'auto' }
          ],
        });
        offerData.image = result.secure_url;
        offerData.imagePublicId = result.public_id;

        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
      }
    }

    const offer = await Offer.create(offerData);

    res.status(201).json({
      success: true,
      message: 'Offer created successfully',
      offer,
    });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update tenant offer
// @route   PUT /api/offers/tenant/:id
// @access  Private/Tenant
exports.updateTenantOffer = async (req, res) => {
  try {
    let offer = await Offer.findOne({ _id: req.params.id, tenant: req.user._id });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found or you do not have permission',
      });
    }

    const updateData = { ...req.body };

    // Handle new image upload
    if (req.file) {
      try {
        if (offer.imagePublicId) {
          await cloudinary.uploader.destroy(offer.imagePublicId);
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'pokisham/tenant-offers',
          transformation: [
            { quality: 'auto:best' },
            { fetch_format: 'auto' }
          ],
        });
        updateData.image = result.secure_url;
        updateData.imagePublicId = result.public_id;

        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
      }
    }

    offer = await Offer.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Offer updated successfully',
      offer,
    });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete tenant offer
// @route   DELETE /api/offers/tenant/:id
// @access  Private/Tenant
exports.deleteTenantOffer = async (req, res) => {
  try {
    const offer = await Offer.findOne({ _id: req.params.id, tenant: req.user._id });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found or you do not have permission',
      });
    }

    if (offer.imagePublicId) {
      await cloudinary.uploader.destroy(offer.imagePublicId);
    }

    await offer.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Offer deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===== COUPON VALIDATION & CHECKOUT FUNCTIONS =====

// @desc    Validate coupon code
// @route   POST /api/offers/validate-coupon
// @access  Private
exports.validateCoupon = async (req, res) => {
  try {
    const { couponCode, cartItems, cartTotal } = req.body;
    const userId = req.user._id;

    if (!couponCode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a coupon code',
      });
    }

    const now = new Date();

    // Find the offer with this coupon code
    const offer = await Offer.findOne({
      couponCode: couponCode.toUpperCase(),
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    if (!offer) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired coupon code',
      });
    }

    // Check usage limit
    if (offer.usageLimit > 0 && offer.usageCount >= offer.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'This coupon has reached its usage limit',
      });
    }

    // Check per-user limit
    if (offer.perUserLimit > 0) {
      const userUsage = offer.usedBy.find(u => u.user.toString() === userId.toString());
      if (userUsage && userUsage.usageCount >= offer.perUserLimit) {
        return res.status(400).json({
          success: false,
          message: 'You have already used this coupon the maximum number of times',
        });
      }
    }

    // Check minimum order amount
    if (offer.minOrderAmount > 0 && cartTotal < offer.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${offer.minOrderAmount} required for this coupon`,
      });
    }

    // Calculate discount
    let discount = 0;
    let applicableAmount = cartTotal;

    // For tenant offers, fetch products from DB and check tenant ownership
    if (offer.offerType === 'tenant' && offer.tenant) {
      // Get product IDs from cart items
      const productIds = cartItems.map(item => item.product?._id || item.product).filter(Boolean);

      // Fetch products with their tenantId
      const products = await Product.find({ _id: { $in: productIds } }).select('_id tenantId');

      // Get all tenant IDs from products
      const tenantIds = products.map(p => p.tenantId).filter(Boolean);

      // Find tenants and check if any belong to the offer's tenant (user)
      const tenants = await Tenant.find({ _id: { $in: tenantIds } }).select('_id userId');

      // Create a map of tenantId -> userId for quick lookup
      const tenantUserMap = {};
      tenants.forEach(t => {
        tenantUserMap[t._id.toString()] = t.userId.toString();
      });

      // Create a map of productId -> tenantUserId
      const productTenantUserMap = {};
      products.forEach(p => {
        if (p.tenantId && tenantUserMap[p.tenantId.toString()]) {
          productTenantUserMap[p._id.toString()] = tenantUserMap[p.tenantId.toString()];
        }
      });

      // Filter cart items to only include tenant's products
      const tenantProductsTotal = cartItems
        .filter(item => {
          const productId = (item.product?._id || item.product)?.toString();
          return productTenantUserMap[productId] === offer.tenant.toString();
        })
        .reduce((sum, item) => sum + (item.price * item.quantity), 0);

      applicableAmount = tenantProductsTotal;

      if (applicableAmount === 0) {
        return res.status(400).json({
          success: false,
          message: 'This coupon is only valid for specific seller products',
        });
      }
    }

    // For category offers, fetch products from DB to verify categories
    if (offer.offerType === 'category' && offer.applicableCategories?.length > 0) {
      // Get product IDs from cart items
      const productIds = cartItems.map(item => item.product?._id || item.product).filter(Boolean);

      // Fetch products with their category
      const products = await Product.find({ _id: { $in: productIds } }).select('_id category');

      // Create a map of productId -> category
      const productCategoryMap = {};
      products.forEach(p => {
        productCategoryMap[p._id.toString()] = p.category?.toString();
      });

      // Convert applicable categories to string array for comparison
      const applicableCategoryStrings = offer.applicableCategories.map(c => c.toString());

      const categoryProductsTotal = cartItems
        .filter(item => {
          const productId = (item.product?._id || item.product)?.toString();
          const category = productCategoryMap[productId];
          return category && applicableCategoryStrings.includes(category);
        })
        .reduce((sum, item) => sum + (item.price * item.quantity), 0);

      applicableAmount = categoryProductsTotal;

      if (applicableAmount === 0) {
        return res.status(400).json({
          success: false,
          message: 'This coupon is only valid for specific categories',
        });
      }
    }

    // Calculate discount based on type
    if (offer.discountType === 'percentage') {
      discount = (applicableAmount * offer.discountValue) / 100;
      // Apply max discount cap if set
      if (offer.maxDiscountAmount > 0 && discount > offer.maxDiscountAmount) {
        discount = offer.maxDiscountAmount;
      }
    } else if (offer.discountType === 'fixed') {
      discount = Math.min(offer.discountValue, applicableAmount);
    }

    res.status(200).json({
      success: true,
      message: 'Coupon applied successfully',
      offer: {
        _id: offer._id,
        title: offer.title,
        couponCode: offer.couponCode,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        offerType: offer.offerType,
      },
      discount: Math.round(discount * 100) / 100,
      applicableAmount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get applicable offers for cart
// @route   POST /api/offers/applicable
// @access  Private
exports.getApplicableOffers = async (req, res) => {
  try {
    const { cartItems, cartTotal } = req.body;
    const now = new Date();

    // Get all active offers
    const offers = await Offer.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      discountType: { $ne: 'none' },
    }).select('title couponCode discountType discountValue offerType minOrderAmount maxDiscountAmount tenant applicableCategories');

    // Pre-fetch product and tenant data for efficiency
    const productIds = cartItems.map(item => item.product?._id || item.product).filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds } }).select('_id tenantId category');

    // Get all tenant IDs from products
    const tenantIds = products.map(p => p.tenantId).filter(Boolean);
    const tenants = await Tenant.find({ _id: { $in: tenantIds } }).select('_id userId');

    // Create maps for quick lookup
    const tenantUserMap = {};
    tenants.forEach(t => {
      tenantUserMap[t._id.toString()] = t.userId.toString();
    });

    const productTenantUserMap = {};
    const productCategoryMap = {};
    products.forEach(p => {
      if (p.tenantId && tenantUserMap[p.tenantId.toString()]) {
        productTenantUserMap[p._id.toString()] = tenantUserMap[p.tenantId.toString()];
      }
      productCategoryMap[p._id.toString()] = p.category?.toString();
    });

    const applicableOffers = [];

    for (const offer of offers) {
      let isApplicable = true;
      let applicableAmount = cartTotal;

      // Check minimum order amount
      if (offer.minOrderAmount > 0 && cartTotal < offer.minOrderAmount) {
        isApplicable = false;
        continue;
      }

      // For tenant offers - check using product->tenant->user mapping
      if (offer.offerType === 'tenant' && offer.tenant) {
        const tenantProductsTotal = cartItems
          .filter(item => {
            const productId = (item.product?._id || item.product)?.toString();
            return productTenantUserMap[productId] === offer.tenant.toString();
          })
          .reduce((sum, item) => sum + (item.price * item.quantity), 0);

        if (tenantProductsTotal === 0) {
          isApplicable = false;
          continue;
        }
        applicableAmount = tenantProductsTotal;
      }

      // For category offers - check using product->category mapping
      if (offer.offerType === 'category' && offer.applicableCategories?.length > 0) {
        const applicableCategoryStrings = offer.applicableCategories.map(c => c.toString());

        const categoryProductsTotal = cartItems
          .filter(item => {
            const productId = (item.product?._id || item.product)?.toString();
            const category = productCategoryMap[productId];
            return category && applicableCategoryStrings.includes(category);
          })
          .reduce((sum, item) => sum + (item.price * item.quantity), 0);

        if (categoryProductsTotal === 0) {
          isApplicable = false;
          continue;
        }
        applicableAmount = categoryProductsTotal;
      }

      if (isApplicable) {
        let potentialDiscount = 0;
        if (offer.discountType === 'percentage') {
          potentialDiscount = (applicableAmount * offer.discountValue) / 100;
          if (offer.maxDiscountAmount > 0 && potentialDiscount > offer.maxDiscountAmount) {
            potentialDiscount = offer.maxDiscountAmount;
          }
        } else if (offer.discountType === 'fixed') {
          potentialDiscount = Math.min(offer.discountValue, applicableAmount);
        }

        applicableOffers.push({
          ...offer.toObject(),
          potentialDiscount: Math.round(potentialDiscount * 100) / 100,
        });
      }
    }

    // Sort by potential discount (highest first)
    applicableOffers.sort((a, b) => b.potentialDiscount - a.potentialDiscount);

    res.status(200).json({
      success: true,
      count: applicableOffers.length,
      offers: applicableOffers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Mark coupon as used (called after successful order)
// @route   POST /api/offers/:id/use
// @access  Private
exports.markCouponUsed = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    // Increment usage count
    offer.usageCount += 1;

    // Track per-user usage
    const userUsageIndex = offer.usedBy.findIndex(u => u.user.toString() === req.user._id.toString());
    if (userUsageIndex > -1) {
      offer.usedBy[userUsageIndex].usageCount += 1;
    } else {
      offer.usedBy.push({ user: req.user._id, usageCount: 1 });
    }

    await offer.save();

    res.status(200).json({
      success: true,
      message: 'Coupon usage recorded',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
