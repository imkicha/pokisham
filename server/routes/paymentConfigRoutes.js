const express = require('express');
const router = express.Router();
const {
  getActivePaymentConfig,
  getPaymentConfig,
  updatePaymentConfig,
} = require('../controllers/paymentConfigController');
const { protect, authorize } = require('../middleware/auth');

// Public
router.get('/active', getActivePaymentConfig);

// Admin
router.get('/', protect, authorize('admin', 'superadmin'), getPaymentConfig);
router.put('/', protect, authorize('admin', 'superadmin'), updatePaymentConfig);

module.exports = router;
