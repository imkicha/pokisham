const TreasureConfig = require('../models/TreasureConfig');

// Get treasure config (for frontend - public)
exports.getTreasureConfig = async (req, res) => {
  try {
    const config = await TreasureConfig.getConfig();

    // Check if config is active and valid
    const now = new Date();
    const isValid = config.isActive &&
      (!config.validFrom || new Date(config.validFrom) <= now) &&
      (!config.validUntil || new Date(config.validUntil) >= now);

    if (!isValid) {
      return res.json({
        success: true,
        config: null,
        message: 'No active treasure available'
      });
    }

    // Return only public fields
    res.json({
      success: true,
      config: {
        couponCode: config.couponCode,
        discountType: config.discountType,
        discountValue: config.discountValue,
        minOrderValue: config.minOrderValue,
        maxDiscount: config.maxDiscount,
        treasureImage: config.treasureImage,
        title: config.title,
        description: config.description,
        appearanceInterval: config.appearanceInterval
      }
    });
  } catch (error) {
    console.error('Error fetching treasure config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch treasure config'
    });
  }
};

// Get full treasure config (for admin)
exports.getAdminTreasureConfig = async (req, res) => {
  try {
    const config = await TreasureConfig.getConfig();

    res.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Error fetching treasure config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch treasure config'
    });
  }
};

// Update treasure config (admin only)
exports.updateTreasureConfig = async (req, res) => {
  try {
    const {
      isActive,
      couponCode,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      treasureImage,
      title,
      description,
      appearanceInterval,
      validFrom,
      validUntil
    } = req.body;

    let config = await TreasureConfig.findOne();

    if (!config) {
      config = new TreasureConfig();
    }

    // Update fields
    if (typeof isActive !== 'undefined') config.isActive = isActive;
    if (couponCode) config.couponCode = couponCode.toUpperCase();
    if (discountType) config.discountType = discountType;
    if (typeof discountValue !== 'undefined') config.discountValue = discountValue;
    if (typeof minOrderValue !== 'undefined') config.minOrderValue = minOrderValue;
    if (typeof maxDiscount !== 'undefined') config.maxDiscount = maxDiscount;
    if (treasureImage) config.treasureImage = treasureImage;
    if (title) config.title = title;
    if (description) config.description = description;
    if (typeof appearanceInterval !== 'undefined') config.appearanceInterval = appearanceInterval;
    if (validFrom) config.validFrom = validFrom;
    if (typeof validUntil !== 'undefined') config.validUntil = validUntil;

    await config.save();

    res.json({
      success: true,
      message: 'Treasure config updated successfully',
      config
    });
  } catch (error) {
    console.error('Error updating treasure config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update treasure config'
    });
  }
};
