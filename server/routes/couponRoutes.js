const express = require('express');
const router = express.Router();
const { protect, isAdminOrSuperAdmin } = require('../middleware/auth');
const {
  validateCoupon,
  useCoupon,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
} = require('../controllers/couponController');

// User routes (authenticated)
router.post('/validate', protect, validateCoupon);
router.post('/use', protect, useCoupon);

// Admin routes
router.get('/', protect, isAdminOrSuperAdmin, getAllCoupons);
router.post('/', protect, isAdminOrSuperAdmin, createCoupon);
router.put('/:id', protect, isAdminOrSuperAdmin, updateCoupon);
router.delete('/:id', protect, isAdminOrSuperAdmin, deleteCoupon);

module.exports = router;
