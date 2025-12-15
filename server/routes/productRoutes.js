const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  deleteProductImage,
  createProductReview,
  getRelatedProducts,
  getProductCommissionStats,
} = require('../controllers/productController');
const { protect, authorize, isAdminOrSuperAdmin, canManageProducts, isSuperAdmin } = require('../middleware/auth');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Admin routes - MUST come before generic routes
router.get('/admin/commission-stats', protect, isSuperAdmin, getProductCommissionStats);

router.route('/').get(getProducts).post(protect, canManageProducts, upload.array('images', 10), createProduct);

router
  .route('/:id')
  .get(getProduct)
  .put(protect, canManageProducts, upload.array('images', 10), updateProduct)
  .delete(protect, canManageProducts, deleteProduct);

router.post(
  '/:id/images',
  protect,
  canManageProducts,
  upload.array('images', 5),
  uploadProductImages
);

router.delete('/:id/images/:imageId', protect, canManageProducts, deleteProductImage);

router.post('/:id/reviews', protect, createProductReview);

router.get('/:id/related', getRelatedProducts);

module.exports = router;
