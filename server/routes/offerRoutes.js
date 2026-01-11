const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getActiveOffers,
  getAllOffers,
  getOffer,
  createOffer,
  updateOffer,
  deleteOffer,
  toggleOfferStatus,
  // Tenant offer functions
  getTenantOffers,
  createTenantOffer,
  updateTenantOffer,
  deleteTenantOffer,
  // Coupon validation functions
  validateCoupon,
  getApplicableOffers,
  markCouponUsed,
} = require('../controllers/offerController');
const { protect, authorize } = require('../middleware/auth');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Public routes
router.get('/', getActiveOffers);

// ===== COUPON & CHECKOUT ROUTES (must come before :id routes) =====
router.post('/validate-coupon', protect, validateCoupon);
router.post('/applicable', protect, getApplicableOffers);

// ===== TENANT ROUTES (must come before :id routes) =====
router.get('/tenant/my-offers', protect, authorize('tenant'), getTenantOffers);
router.post('/tenant', protect, authorize('tenant'), upload.single('image'), createTenantOffer);
router.put('/tenant/:id', protect, authorize('tenant'), upload.single('image'), updateTenantOffer);
router.delete('/tenant/:id', protect, authorize('tenant'), deleteTenantOffer);

// ===== ADMIN ROUTES (must come before :id routes) =====
router.get('/admin/all', protect, authorize('admin', 'superadmin'), getAllOffers);
router.post('/', protect, authorize('admin', 'superadmin'), upload.single('image'), createOffer);

// ===== ROUTES WITH :id PARAMETER (must come last) =====
router.get('/:id', getOffer);
router.put('/:id', protect, authorize('admin', 'superadmin'), upload.single('image'), updateOffer);
router.delete('/:id', protect, authorize('admin', 'superadmin'), deleteOffer);
router.put('/:id/toggle', protect, authorize('admin', 'superadmin'), toggleOfferStatus);
router.post('/:id/use', protect, markCouponUsed);

module.exports = router;
