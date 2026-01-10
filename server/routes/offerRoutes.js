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
} = require('../controllers/offerController');
const { protect, authorize } = require('../middleware/auth');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Public routes
router.get('/', getActiveOffers);

// Admin routes - MUST come before /:id route
router.get('/admin/all', protect, authorize('admin', 'superadmin'), getAllOffers);
router.post('/', protect, authorize('admin', 'superadmin'), upload.single('image'), createOffer);

// Routes with :id parameter - MUST come after specific routes
router.get('/:id', getOffer);
router.put('/:id', protect, authorize('admin', 'superadmin'), upload.single('image'), updateOffer);
router.delete('/:id', protect, authorize('admin', 'superadmin'), deleteOffer);
router.put('/:id/toggle', protect, authorize('admin', 'superadmin'), toggleOfferStatus);

module.exports = router;
