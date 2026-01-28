const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getActivePopup,
  getPopupConfig,
  togglePopup,
  addPoster,
  updatePoster,
  deletePoster,
} = require('../controllers/popupController');
const { protect, authorize } = require('../middleware/auth');

const upload = multer({ dest: 'uploads/' });

// Public
router.get('/active', getActivePopup);

// Admin
router.get('/config', protect, authorize('admin', 'superadmin'), getPopupConfig);
router.put('/toggle', protect, authorize('admin', 'superadmin'), togglePopup);
router.post('/poster', protect, authorize('admin', 'superadmin'), upload.single('image'), addPoster);
router.put('/poster/:posterId', protect, authorize('admin', 'superadmin'), upload.single('image'), updatePoster);
router.delete('/poster/:posterId', protect, authorize('admin', 'superadmin'), deletePoster);

module.exports = router;
