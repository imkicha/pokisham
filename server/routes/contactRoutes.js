const express = require('express');
const router = express.Router();
const {
  submitContact,
  getContacts,
  getContact,
  updateContact,
  deleteContact,
  getUnreadCount,
  replyToContact,
} = require('../controllers/contactController');
const { protect, isAdminOrSuperAdmin } = require('../middleware/auth');

// Public route - anyone can submit a contact message
router.post('/', submitContact);

// Admin/SuperAdmin routes
router.get('/unread-count', protect, isAdminOrSuperAdmin, getUnreadCount);
router.get('/', protect, isAdminOrSuperAdmin, getContacts);
router.get('/:id', protect, isAdminOrSuperAdmin, getContact);
router.put('/:id', protect, isAdminOrSuperAdmin, updateContact);
router.post('/:id/reply', protect, isAdminOrSuperAdmin, replyToContact);
router.delete('/:id', protect, isAdminOrSuperAdmin, deleteContact);

module.exports = router;
