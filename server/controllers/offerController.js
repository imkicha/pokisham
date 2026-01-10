const Offer = require('../models/Offer');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// @desc    Get all active offers (public)
// @route   GET /api/offers
// @access  Public
exports.getActiveOffers = async (req, res) => {
  try {
    const now = new Date();
    const location = req.query.location || 'homepage_banner';

    const offers = await Offer.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      displayLocation: location,
    })
      .sort({ priority: -1, createdAt: -1 })
      .limit(10);

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
