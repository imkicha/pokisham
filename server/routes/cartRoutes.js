const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  uploadCustomPhoto,
  removeCustomPhoto,
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

// Multer config for custom photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `custom-photo-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed!'));
  },
});

router.route('/').get(protect, getCart).post(protect, addToCart).delete(protect, clearCart);

router.route('/:itemId').put(protect, updateCartItem).delete(protect, removeFromCart);

// Custom photo routes
router.post('/:itemId/custom-photo', protect, upload.single('photo'), uploadCustomPhoto);
router.delete('/:itemId/custom-photo', protect, removeCustomPhoto);

module.exports = router;
