const Contact = require('../models/Contact');
const { sendContactReply } = require('../utils/email');

// @desc    Submit a contact message (public)
// @route   POST /api/contact
// @access  Public
exports.submitContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required',
      });
    }

    const contact = await Contact.create({
      name,
      email,
      phone,
      subject,
      message,
    });

    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully! We will get back to you soon.',
      contact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all contact messages
// @route   GET /api/contact
// @access  Private (Admin/SuperAdmin)
exports.getContacts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('repliedBy', 'name email');

    const total = await Contact.countDocuments(query);
    const unreadCount = await Contact.countDocuments({ status: 'unread' });

    res.status(200).json({
      success: true,
      contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single contact message
// @route   GET /api/contact/:id
// @access  Private (Admin/SuperAdmin)
exports.getContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id).populate(
      'repliedBy',
      'name email'
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found',
      });
    }

    // Mark as read if unread
    if (contact.status === 'unread') {
      contact.status = 'read';
      await contact.save();
    }

    res.status(200).json({
      success: true,
      contact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update contact message status
// @route   PUT /api/contact/:id
// @access  Private (Admin/SuperAdmin)
exports.updateContact = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found',
      });
    }

    if (status) {
      contact.status = status;
      if (status === 'replied') {
        contact.repliedAt = new Date();
        contact.repliedBy = req.user._id;
      }
    }

    if (adminNotes !== undefined) {
      contact.adminNotes = adminNotes;
    }

    await contact.save();

    const updatedContact = await Contact.findById(req.params.id).populate(
      'repliedBy',
      'name email'
    );

    res.status(200).json({
      success: true,
      message: 'Contact message updated',
      contact: updatedContact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete contact message
// @route   DELETE /api/contact/:id
// @access  Private (Admin/SuperAdmin)
exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found',
      });
    }

    await contact.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Contact message deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get unread count
// @route   GET /api/contact/unread-count
// @access  Private (Admin/SuperAdmin)
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Contact.countDocuments({ status: 'unread' });

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Reply to contact message via email
// @route   POST /api/contact/:id/reply
// @access  Private (Admin/SuperAdmin)
exports.replyToContact = async (req, res) => {
  try {
    const { replyMessage } = req.body;

    if (!replyMessage || !replyMessage.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reply message is required',
      });
    }

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found',
      });
    }

    // Get subject label
    const subjectLabels = {
      general: 'General Inquiry',
      order: 'Order Related',
      product: 'Product Question',
      custom: 'Custom Order',
      feedback: 'Feedback',
      other: 'Other',
    };
    const subjectLabel = subjectLabels[contact.subject] || contact.subject || 'Your Inquiry';

    // Send email
    await sendContactReply(
      contact.email,
      contact.name,
      subjectLabel,
      replyMessage,
      contact.message
    );

    // Update contact status
    contact.status = 'replied';
    contact.repliedAt = new Date();
    contact.repliedBy = req.user._id;
    contact.adminNotes = contact.adminNotes
      ? `${contact.adminNotes}\n\n--- Reply sent ---\n${replyMessage}`
      : `--- Reply sent ---\n${replyMessage}`;

    await contact.save();

    const updatedContact = await Contact.findById(req.params.id).populate(
      'repliedBy',
      'name email'
    );

    res.status(200).json({
      success: true,
      message: 'Reply sent successfully!',
      contact: updatedContact,
    });
  } catch (error) {
    console.error('Reply error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send reply',
    });
  }
};
