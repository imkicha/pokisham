const express = require('express');
const router = express.Router();
const { protect, isAdminOrSuperAdmin } = require('../middleware/auth');
const {
  getTreasureConfig,
  getAdminTreasureConfig,
  updateTreasureConfig
} = require('../controllers/treasureConfigController');

// Public route - get treasure config for frontend
router.get('/', getTreasureConfig);

// Admin routes
router.get('/admin', protect, isAdminOrSuperAdmin, getAdminTreasureConfig);
router.put('/admin', protect, isAdminOrSuperAdmin, updateTreasureConfig);

module.exports = router;
