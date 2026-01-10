const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder,
  verifyPayment,
  getRazorpayKey,
  handlePaymentFailure,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Public route to get Razorpay key
router.get('/key', getRazorpayKey);

// Protected routes
router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyPayment);
router.post('/failed', protect, handlePaymentFailure);

module.exports = router;
