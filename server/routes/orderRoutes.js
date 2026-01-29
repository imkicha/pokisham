const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder,
  verifyPayment,
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  getDashboardStats,
  generateOrderInvoice,
  getNotificationTemplates,
  sendOrderNotification,
  shareInvoice,
  createBookingOrder,
  forwardToVendor,
} = require('../controllers/orderController');
const {
  assignOrderToTenant,
  acceptOrder,
  getTenantOrders,
  updateTenantOrderStatus,
} = require('../controllers/tenantOrderController');
const { protect, authorize, isSuperAdmin, isAdminOrSuperAdmin } = require('../middleware/auth');

router.post('/razorpay', protect, createRazorpayOrder);
router.post('/verify-payment', protect, verifyPayment);
router.route('/').post(protect, createOrder).get(protect, isAdminOrSuperAdmin, getAllOrders);
router.get('/myorders', protect, getMyOrders);
router.get('/admin/stats', protect, isAdminOrSuperAdmin, getDashboardStats);
router.get('/notification-templates', protect, isAdminOrSuperAdmin, getNotificationTemplates);
router.post('/booking', protect, createBookingOrder);

// Tenant order routes
router.get('/my-orders', protect, getTenantOrders); // Tenant gets their assigned orders
router.post('/:id/assign-tenant', protect, isSuperAdmin, assignOrderToTenant); // Super Admin assigns order to tenant
router.post('/:id/accept', protect, acceptOrder); // Tenant accepts/claims a broadcasted order

// IMPORTANT: More specific routes must come BEFORE generic routes
router.put('/:id/tenant-status', protect, updateTenantOrderStatus); // Tenant updates order status
router.post('/:id/forward-vendor', protect, isAdminOrSuperAdmin, forwardToVendor);
router.put('/:id/status', protect, isAdminOrSuperAdmin, updateOrderStatus); // Admin/SuperAdmin updates order status
router.put('/:id/cancel', protect, cancelOrder);

router.get('/:id/invoice', protect, generateOrderInvoice);
router.post('/:id/share-invoice', protect, isAdminOrSuperAdmin, shareInvoice);
router.post('/:id/notify', protect, isAdminOrSuperAdmin, sendOrderNotification);
router.get('/:id', protect, getOrderById);

module.exports = router;
