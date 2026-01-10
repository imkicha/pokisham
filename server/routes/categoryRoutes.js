const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getTenantCategories,
  canCreateProducts,
  getNavbarCategories,
  updateNavbarCategories,
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Navbar routes (public GET, admin PUT)
router.get('/navbar', getNavbarCategories);
router.put('/navbar', protect, authorize('admin', 'superadmin'), updateNavbarCategories);

// Tenant-specific routes (must come before /:id routes)
router.get('/tenant/my-categories', protect, authorize('tenant'), getTenantCategories);
router.get('/tenant/can-create-products', protect, authorize('tenant'), canCreateProducts);

// Public and tenant routes
router.route('/')
  .get(getCategories)
  .post(protect, authorize('admin', 'superadmin', 'tenant'), upload.single('image'), createCategory);

router
  .route('/:id')
  .get(getCategory)
  .put(protect, authorize('admin', 'superadmin', 'tenant'), upload.single('image'), updateCategory)
  .delete(protect, authorize('admin', 'superadmin', 'tenant'), deleteCategory);

module.exports = router;
