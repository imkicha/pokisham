const PopupConfig = require('../models/PopupConfig');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// @desc    Get popup config (public)
// @route   GET /api/popup/active
// @access  Public
exports.getActivePopup = async (req, res) => {
  try {
    const config = await PopupConfig.getConfig();

    if (!config.isActive || config.posters.length === 0) {
      return res.status(200).json({ success: true, active: false, posters: [] });
    }

    const sorted = [...config.posters].sort((a, b) => a.order - b.order);

    res.status(200).json({
      success: true,
      active: true,
      posters: sorted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get popup config (admin)
// @route   GET /api/popup/config
// @access  Private/Admin
exports.getPopupConfig = async (req, res) => {
  try {
    const config = await PopupConfig.getConfig();
    res.status(200).json({ success: true, config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle popup active status
// @route   PUT /api/popup/toggle
// @access  Private/Admin
exports.togglePopup = async (req, res) => {
  try {
    const config = await PopupConfig.getConfig();
    config.isActive = !config.isActive;
    await config.save();
    res.status(200).json({ success: true, isActive: config.isActive });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add poster to popup
// @route   POST /api/popup/poster
// @access  Private/Admin
exports.addPoster = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image' });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'pokisham/popup',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });

    fs.unlink(req.file.path, () => {});

    const config = await PopupConfig.getConfig();
    config.posters.push({
      image: result.secure_url,
      imagePublicId: result.public_id,
      title: req.body.title || '',
      link: req.body.link || '/offers',
      order: config.posters.length,
    });
    await config.save();

    res.status(201).json({ success: true, config });
  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update poster
// @route   PUT /api/popup/poster/:posterId
// @access  Private/Admin
exports.updatePoster = async (req, res) => {
  try {
    const config = await PopupConfig.getConfig();
    const poster = config.posters.id(req.params.posterId);

    if (!poster) {
      return res.status(404).json({ success: false, message: 'Poster not found' });
    }

    if (req.file) {
      // Delete old image
      if (poster.imagePublicId) {
        await cloudinary.uploader.destroy(poster.imagePublicId).catch(() => {});
      }
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'pokisham/popup',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      });
      fs.unlink(req.file.path, () => {});
      poster.image = result.secure_url;
      poster.imagePublicId = result.public_id;
    }

    if (req.body.title !== undefined) poster.title = req.body.title;
    if (req.body.link !== undefined) poster.link = req.body.link;
    if (req.body.order !== undefined) poster.order = Number(req.body.order);

    await config.save();
    res.status(200).json({ success: true, config });
  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete poster
// @route   DELETE /api/popup/poster/:posterId
// @access  Private/Admin
exports.deletePoster = async (req, res) => {
  try {
    const config = await PopupConfig.getConfig();
    const poster = config.posters.id(req.params.posterId);

    if (!poster) {
      return res.status(404).json({ success: false, message: 'Poster not found' });
    }

    if (poster.imagePublicId) {
      await cloudinary.uploader.destroy(poster.imagePublicId).catch(() => {});
    }

    config.posters.pull(req.params.posterId);
    await config.save();

    res.status(200).json({ success: true, config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
