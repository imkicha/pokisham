const Coupon = require('../models/Coupon');
const TreasureConfig = require('../models/TreasureConfig');
const Offer = require('../models/Offer');

// Validate and apply coupon
exports.validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    const userId = req.user._id;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a coupon code'
      });
    }

    const couponCode = code.toUpperCase().trim();
    let couponData = null;

    // 1. First check in Coupon collection
    const coupon = await Coupon.findOne({ code: couponCode, isActive: true });

    if (coupon) {
      couponData = {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderValue: coupon.minOrderValue,
        maxDiscount: coupon.maxDiscount,
        validFrom: coupon.validFrom,
        validUntil: coupon.validUntil,
        usageLimit: coupon.usageLimit,
        usedCount: coupon.usedCount,
        usageLimitPerUser: coupon.usageLimitPerUser,
        usedBy: coupon.usedBy,
        source: 'coupon'
      };
    }

    // 2. Check TreasureConfig if not found
    if (!couponData) {
      const treasureConfig = await TreasureConfig.findOne();
      if (treasureConfig && treasureConfig.isActive && treasureConfig.couponCode === couponCode) {
        const now = new Date();
        const isValid = (!treasureConfig.validFrom || new Date(treasureConfig.validFrom) <= now) &&
                       (!treasureConfig.validUntil || new Date(treasureConfig.validUntil) >= now);

        if (isValid) {
          couponData = {
            code: treasureConfig.couponCode,
            discountType: treasureConfig.discountType,
            discountValue: treasureConfig.discountValue,
            minOrderValue: treasureConfig.minOrderValue,
            maxDiscount: treasureConfig.maxDiscount,
            validFrom: treasureConfig.validFrom,
            validUntil: treasureConfig.validUntil,
            source: 'treasure'
          };
        }
      }
    }

    // 3. Check active Offers if still not found
    if (!couponData) {
      const now = new Date();
      const offer = await Offer.findOne({
        couponCode: couponCode,
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now }
      });

      if (offer && offer.discountType !== 'none') {
        couponData = {
          code: offer.couponCode,
          discountType: offer.discountType,
          discountValue: offer.discountValue,
          minOrderValue: 0,
          maxDiscount: null,
          validFrom: offer.startDate,
          validUntil: offer.endDate,
          source: 'offer'
        };
      }
    }

    // Coupon not found anywhere
    if (!couponData) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code'
      });
    }

    // Validate coupon
    const now = new Date();

    // Check validity dates
    if (couponData.validFrom && new Date(couponData.validFrom) > now) {
      return res.status(400).json({
        success: false,
        message: 'This coupon is not yet valid'
      });
    }

    if (couponData.validUntil && new Date(couponData.validUntil) < now) {
      return res.status(400).json({
        success: false,
        message: 'This coupon has expired'
      });
    }

    // Check minimum order value
    if (cartTotal < couponData.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value of ₹${couponData.minOrderValue} required`
      });
    }

    // Check usage limits (only for Coupon collection coupons)
    if (couponData.source === 'coupon') {
      // Check total usage limit
      if (couponData.usageLimit && couponData.usedCount >= couponData.usageLimit) {
        return res.status(400).json({
          success: false,
          message: 'This coupon has reached its usage limit'
        });
      }

      // Check per-user usage limit
      if (couponData.usageLimitPerUser) {
        const userUsageCount = couponData.usedBy.filter(
          u => u.user.toString() === userId.toString()
        ).length;

        if (userUsageCount >= couponData.usageLimitPerUser) {
          return res.status(400).json({
            success: false,
            message: 'You have already used this coupon'
          });
        }
      }
    }

    // Calculate discount
    let discount = 0;
    if (couponData.discountType === 'percentage') {
      discount = Math.round((cartTotal * couponData.discountValue) / 100);
      // Apply max discount cap if set
      if (couponData.maxDiscount && discount > couponData.maxDiscount) {
        discount = couponData.maxDiscount;
      }
    } else {
      discount = couponData.discountValue;
    }

    // Don't allow discount greater than cart total
    if (discount > cartTotal) {
      discount = cartTotal;
    }

    res.json({
      success: true,
      message: 'Coupon applied successfully!',
      coupon: {
        code: couponData.code,
        discountType: couponData.discountType,
        discountValue: couponData.discountValue,
        discount: discount,
        minOrderValue: couponData.minOrderValue,
        maxDiscount: couponData.maxDiscount
      }
    });

  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate coupon'
    });
  }
};

// Mark coupon as used (call after successful order)
exports.useCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user._id;

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (coupon) {
      coupon.usedCount += 1;
      coupon.usedBy.push({ user: userId });
      await coupon.save();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking coupon as used:', error);
    res.status(500).json({ success: false });
  }
};

// Admin: Get all coupons
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
  }
};

// Admin: Create coupon
exports.createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, coupon });
  } catch (error) {
    console.error('Error creating coupon:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }
    res.status(500).json({ success: false, message: 'Failed to create coupon' });
  }
};

// Admin: Update coupon
exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    res.json({ success: true, coupon });
  } catch (error) {
    console.error('Error updating coupon:', error);
    res.status(500).json({ success: false, message: 'Failed to update coupon' });
  }
};

// Admin: Delete coupon
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ success: false, message: 'Failed to delete coupon' });
  }
};
