const express = require('express');
const router = express.Router();
const {
  markReadyToShip,
  checkServiceability,
  getShipmentDetails,
  retryShipment,
  cancelShipment,
  getVendorShipments,
} = require('../controllers/shippingController');
const { protect, isAdminOrSuperAdmin } = require('../middleware/auth');

// ─── Vendor Routes ───────────────────────────────────────────────────────────

// Vendor marks order as ready to ship (triggers Shiprocket flow)
router.post('/:orderId/ready-to-ship', protect, markReadyToShip);

// Vendor views their shipments
router.get('/my-shipments', protect, getVendorShipments);

// ─── Shared Routes ───────────────────────────────────────────────────────────

// Check courier serviceability between pincodes
router.post('/check-serviceability', protect, checkServiceability);

// Track shipment details for an order
router.get('/:orderId/track', protect, getShipmentDetails);

// ─── Admin Routes ────────────────────────────────────────────────────────────

// Retry failed AWB assignment or pickup scheduling
router.post('/:shipmentId/retry', protect, isAdminOrSuperAdmin, retryShipment);

// Cancel a shipment
router.post('/:shipmentId/cancel', protect, isAdminOrSuperAdmin, cancelShipment);

module.exports = router;
