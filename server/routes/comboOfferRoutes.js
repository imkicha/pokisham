const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  // Admin functions
  getAllComboOffers,
  createComboOffer,
  updateComboOffer,
  deleteComboOffer,
  toggleComboOfferStatus,
  // Tenant functions
  getTenantComboOffers,
  createTenantComboOffer,
  updateTenantComboOffer,
  deleteTenantComboOffer,
  getTenantProductsForCombo,
  // Validation functions
  validateComboOffers,
  markComboUsed,
} = require('../controllers/comboOfferController');
const { protect, authorize } = require('../middleware/auth');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// ===== VALIDATION ROUTES (must come before :id routes) =====
router.post('/validate', protect, validateComboOffers);

// ===== TENANT ROUTES (must come before :id routes) =====
router.get('/tenant/my-combos', protect, authorize('tenant'), getTenantComboOffers);
router.get('/tenant/my-products', protect, authorize('tenant'), getTenantProductsForCombo);
router.post('/tenant', protect, authorize('tenant'), upload.single('image'), createTenantComboOffer);
router.put('/tenant/:id', protect, authorize('tenant'), upload.single('image'), updateTenantComboOffer);
router.delete('/tenant/:id', protect, authorize('tenant'), deleteTenantComboOffer);

// ===== ADMIN ROUTES (must come before :id routes) =====
router.get('/admin/all', protect, authorize('admin', 'superadmin'), getAllComboOffers);
router.post('/', protect, authorize('admin', 'superadmin'), upload.single('image'), createComboOffer);

// ===== ROUTES WITH :id PARAMETER (must come last) =====
router.put('/:id', protect, authorize('admin', 'superadmin'), upload.single('image'), updateComboOffer);
router.delete('/:id', protect, authorize('admin', 'superadmin'), deleteComboOffer);
router.put('/:id/toggle', protect, authorize('admin', 'superadmin'), toggleComboOfferStatus);
router.post('/:id/use', protect, markComboUsed);

module.exports = router;
