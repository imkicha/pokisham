const express = require('express');
const router = express.Router();
const {
  applyAsTenant,
  getAllTenants,
  getTenant,
  approveTenant,
  rejectTenant,
  suspendTenant,
  reactivateTenant,
  updateTenant,
  getTenantStats,
  updateCommissionRate,
} = require('../controllers/tenantController');
const { protect, isSuperAdmin } = require('../middleware/auth');

// Public routes
router.post('/apply', applyAsTenant);

// Protected routes
router.get('/', protect, isSuperAdmin, getAllTenants);
router.get('/:id', protect, getTenant);
router.put('/:id', protect, updateTenant);
router.get('/:id/stats', protect, getTenantStats);

// Super Admin only routes
router.put('/:id/approve', protect, isSuperAdmin, approveTenant);
router.put('/:id/reject', protect, isSuperAdmin, rejectTenant);
router.put('/:id/suspend', protect, isSuperAdmin, suspendTenant);
router.put('/:id/reactivate', protect, isSuperAdmin, reactivateTenant);
router.put('/:id/commission', protect, isSuperAdmin, updateCommissionRate);

module.exports = router;
