const express = require('express');
const router = express.Router();
const {
  register,
  verifyOTP,
  resendOTP,
  login,
  googleAuth,
  getMe,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  forgotPassword,
  resetPassword,
  updateFCMToken,
  getAllUsers,
  deleteUser,
} = require('../controllers/authController');
const { protect, isAdminOrSuperAdmin } = require('../middleware/auth');
const {
  authLimiter,
  otpLimiter,
  passwordResetLimiter,
  bruteForceProtection,
} = require('../middleware/security');

// Public routes with rate limiting
router.post('/register', authLimiter, register);
router.post('/verify-otp', otpLimiter, verifyOTP);
router.post('/resend-otp', otpLimiter, resendOTP);
router.post('/login', authLimiter, bruteForceProtection, login);
router.post('/google', authLimiter, googleAuth);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/fcm-token', protect, updateFCMToken);
router.post('/address', protect, addAddress);
router.put('/address/:addressId', protect, updateAddress);
router.delete('/address/:addressId', protect, deleteAddress);

// Admin routes
router.get('/users', protect, isAdminOrSuperAdmin, getAllUsers);
router.delete('/users/:id', protect, isAdminOrSuperAdmin, deleteUser);

module.exports = router;
