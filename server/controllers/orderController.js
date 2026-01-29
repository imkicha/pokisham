const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const User = require('../models/User');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { generateInvoice, generateInvoiceBuffer } = require('../utils/invoiceGenerator');
const cloudinary = require('../config/cloudinary');
const { sendOrderConfirmationSMS, sendNewOrderNotificationToAdmins } = require('../utils/sms');
const { sendOrderConfirmation, sendOrderStatusEmail, getWhatsAppMessage, getOrderStatusTemplates } = require('../utils/email');

// Initialize Razorpay (lazy initialization)
let razorpay = null;

const getRazorpayInstance = () => {
  if (!razorpay && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
};

// @desc    Create Razorpay order
// @route   POST /api/orders/razorpay
// @access  Private
exports.createRazorpayOrder = async (req, res) => {
  try {
    const razorpayInstance = getRazorpayInstance();

    if (!razorpayInstance) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env',
      });
    }

    const { amount } = req.body;

    const options = {
      amount: amount * 100, // amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpayInstance.orders.create(options);

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/orders/verify-payment
// @access  Private
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid signature',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      paymentInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      giftWrapPrice,
      discountPrice,
      totalPrice,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items',
      });
    }

    // Validate stock availability
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.name} not found`,
        });
      }

      // Check stock based on whether product has variants
      if (product.hasVariants && item.variant) {
        const variant = product.variants.find((v) => v.size === item.variant.size);
        if (!variant) {
          return res.status(404).json({
            success: false,
            message: `Variant ${item.variant.size} not found for ${item.name}`,
          });
        }
        if (variant.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${item.name} (${item.variant.size})`,
          });
        }
      } else {
        if (product.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${item.name}`,
          });
        }
      }
    }

    // Generate order number
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    const orderNumber = `PK${year}${month}${day}${random}`;

    const order = await Order.create({
      user: req.user._id,
      orderNumber,
      orderItems,
      shippingAddress,
      paymentMethod,
      paymentInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      giftWrapPrice,
      discountPrice,
      totalPrice,
      statusHistory: [
        {
          status: 'Pending',
          message: 'Order placed successfully',
        },
      ],
    });

    // Update product stock
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        if (product.hasVariants && item.variant) {
          const variant = product.variants.find((v) => v.size === item.variant.size);
          if (variant) {
            variant.stock -= item.quantity;
          }
        } else {
          product.stock -= item.quantity;
        }
        await product.save();
      }
    }

    // Clear user cart
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    // Send notifications to user (Email + Push)
    try {
      const user = await User.findById(req.user._id);
      if (user) {
        // 1. Send Email notification
        if (user.email) {
          await sendOrderConfirmation(user.email, user.name, order);
          console.log('Order confirmation email sent to:', user.email);
        }

        // 2. Send Firebase Push notification to customer
        const phoneNumber = user.phone || shippingAddress.phone;
        await sendOrderConfirmationSMS(
          phoneNumber,
          user.name,
          order.orderNumber,
          order.totalPrice,
          user.fcmToken || null
        );

        // 3. Send notification to all admins
        const admins = await User.find({
          role: { $in: ['admin', 'superadmin'] },
          fcmToken: { $ne: '' }
        }).select('fcmToken');

        const adminTokens = admins.map(a => a.fcmToken).filter(Boolean);
        if (adminTokens.length > 0) {
          await sendNewOrderNotificationToAdmins(
            adminTokens,
            user.name,
            order.orderNumber,
            order.totalPrice
          );
          console.log('Admin notification sent to', adminTokens.length, 'admins');
        }
      }
    } catch (notificationError) {
      console.error('Failed to send order notifications:', notificationError);
    }

    res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('tenantId', 'businessName ownerName');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if user is authorized to view this order
    const isOrderOwner = order.user && order.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    const isAssignedTenant = req.user.role === 'tenant' &&
                             order.tenantId &&
                             order.tenantId._id.toString() === req.user.tenantId?.toString();
    const isUnassignedOrderForTenant = req.user.role === 'tenant' && !order.routedToTenant;

    // Debug logging
    console.log('🔍 Authorization check for order:', order._id);
    console.log('User role:', req.user.role);
    console.log('User tenantId:', req.user.tenantId);
    console.log('Order tenantId:', order.tenantId?._id);
    console.log('Order routedToTenant:', order.routedToTenant);
    console.log('isOrderOwner:', isOrderOwner);
    console.log('isAdmin:', isAdmin);
    console.log('isAssignedTenant:', isAssignedTenant);
    console.log('isUnassignedOrderForTenant:', isUnassignedOrderForTenant);

    if (!isOrderOwner && !isAdmin && !isAssignedTenant && !isUnassignedOrderForTenant) {
      console.log('❌ Authorization DENIED');
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order',
      });
    }

    console.log('✅ Authorization GRANTED');

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const queryObj = {};

    if (req.query.status) {
      queryObj.orderStatus = req.query.status;
    }

    if (req.query.paymentMethod) {
      queryObj.paymentMethod = req.query.paymentMethod;
    }

    if (req.query.orderType) {
      queryObj.orderType = req.query.orderType;
    }

    const orders = await Order.find(queryObj)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(queryObj);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, message } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.orderStatus = status;
    order.statusHistory.push({
      status,
      message: message || `Order status updated to ${status}`,
    });

    if (status === 'Delivered' || status === 'Completed') {
      order.deliveredAt = Date.now();
    }

    if (status === 'Cancelled') {
      order.cancelledAt = Date.now();
      order.cancellationReason = message;

      // Restore product stock (skip for booking orders)
      if (order.orderType !== 'booking') {
        for (const item of order.orderItems) {
          const product = await Product.findById(item.product);
          if (product) {
            if (product.hasVariants && item.variant) {
              const variant = product.variants.find((v) => v.size === item.variant.size);
              if (variant) {
                variant.stock += item.quantity;
              }
            } else {
              product.stock += item.quantity;
            }
            await product.save();
          }
        }
      }
    }

    await order.save();

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if user is authorized
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order',
      });
    }

    // Check if order can be cancelled
    if (['Delivered', 'Cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.orderStatus}`,
      });
    }

    order.orderStatus = 'Cancelled';
    order.cancelledAt = Date.now();
    order.cancellationReason = reason || 'Cancelled by user';
    order.statusHistory.push({
      status: 'Cancelled',
      message: reason || 'Cancelled by user',
    });

    // Restore product stock (skip for booking orders)
    if (order.orderType !== 'booking') {
      for (const item of order.orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
          if (product.hasVariants && item.variant) {
            const variant = product.variants.find((v) => v.size === item.variant.size);
            if (variant) {
              variant.stock += item.quantity;
            }
          } else {
            product.stock += item.quantity;
          }
          await product.save();
        }
      }
    }

    await order.save();

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get dashboard stats (Admin)
// @route   GET /api/orders/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    // Total counts
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments({ role: 'user' });

    const pendingOrders = await Order.countDocuments({ orderStatus: 'Pending' });
    const deliveredOrders = await Order.countDocuments({ orderStatus: 'Delivered' });
    const totalBookingOrders = await Order.countDocuments({ orderType: 'booking' });
    const pendingBookingOrders = await Order.countDocuments({ orderType: 'booking', orderStatus: 'Pending' });

    const revenueData = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

    // Low stock products
    const lowStockProducts = await Product.find({ stock: { $lte: 10 }, isActive: true })
      .select('name stock sku')
      .limit(10);

    // Popular products
    const popularProducts = await Product.find({ isActive: true })
      .sort({ numReviews: -1, ratings: -1 })
      .select('name price images ratings numReviews')
      .limit(10);

    // Recent orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        totalProducts,
        totalUsers,
        pendingOrders,
        deliveredOrders,
        totalRevenue,
        totalBookingOrders,
        pendingBookingOrders,
        lowStockProducts,
        popularProducts,
        recentOrders,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Generate invoice for order
// @route   GET /api/orders/:id/invoice
// @access  Private
exports.generateOrderInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if user owns this order or is admin/superadmin
    if (order.user._id.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order',
      });
    }

    // Generate and send the invoice
    generateInvoice(order, res);
  } catch (error) {
    console.error('Invoice generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get order status notification templates
// @route   GET /api/orders/notification-templates
// @access  Private/Admin
exports.getNotificationTemplates = async (req, res) => {
  try {
    const templates = getOrderStatusTemplates();
    res.status(200).json({
      success: true,
      templates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Send order status notification (Email/WhatsApp)
// @route   POST /api/orders/:id/notify
// @access  Private/Admin
exports.sendOrderNotification = async (req, res) => {
  try {
    const { type, trackingNumber } = req.body; // type: 'email' | 'whatsapp' | 'both'

    const order = await Order.findById(req.params.id).populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const customer = order.user;
    const status = order.orderStatus;
    const results = { email: null, whatsapp: null };

    // Send Email notification
    if (type === 'email' || type === 'both') {
      if (customer?.email) {
        const emailResult = await sendOrderStatusEmail(
          customer.email,
          customer.name,
          order,
          status,
          trackingNumber
        );
        results.email = emailResult;
      } else {
        results.email = { success: false, error: 'No email address available' };
      }
    }

    // Generate WhatsApp message (opens WhatsApp Web/App)
    if (type === 'whatsapp' || type === 'both') {
      // Prioritize shipping address phone (what they entered at checkout)
      const phone = order.shippingAddress?.phone || customer?.phone;
      if (phone) {
        const message = getWhatsAppMessage(customer?.name || order.shippingAddress?.name || order.shippingAddress?.fullName, order, status, trackingNumber);
        if (message) {
          // Format phone number (remove +, spaces, etc.)
          const cleanPhone = phone.replace(/[^0-9]/g, '');
          const whatsappPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
          const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;
          results.whatsapp = { success: true, url: whatsappUrl, message };
        } else {
          results.whatsapp = { success: false, error: 'No template for this status' };
        }
      } else {
        results.whatsapp = { success: false, error: 'No phone number available' };
      }
    }

    res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Share invoice via WhatsApp (upload to Cloudinary and return URL)
// @route   POST /api/orders/:id/share-invoice
// @access  Private/Admin
exports.shareInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if user owns this order or is admin/superadmin
    if (order.user._id.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order',
      });
    }

    // Generate PDF buffer
    const pdfBuffer = await generateInvoiceBuffer(order);

    // Convert buffer to base64 data URI for Cloudinary upload
    const base64Pdf = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;

    // Upload to Cloudinary with proper settings for PDF
    const uploadResult = await cloudinary.uploader.upload(base64Pdf, {
      resource_type: 'raw',
      folder: 'pokisham/invoices',
      public_id: `invoice-${order.orderNumber}`,
      overwrite: true,
      type: 'upload',
      access_mode: 'public',
    });

    // Get customer phone - prioritize shipping address phone (what they entered at checkout)
    const phone = order.shippingAddress?.phone || order.user?.phone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const whatsappPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

    // Create download URL with fl_attachment flag for direct download
    // This forces the browser to download the file instead of trying to display it
    const downloadUrl = uploadResult.secure_url.replace('/upload/', '/upload/fl_attachment/');

    // Create WhatsApp message with PDF link
    const customerName = order.shippingAddress?.name || order.shippingAddress?.fullName || order.user?.name || 'Customer';
    const message = `📄 *Invoice - Order #${order.orderNumber}*\n\nHi ${customerName},\n\nPlease find your invoice below:\n\n🛒 Order: #${order.orderNumber}\n💰 Total: ₹${order.totalPrice}\n📅 Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}\n📦 Status: ${order.orderStatus}\n\n📎 Download Invoice:\n${downloadUrl}\n\nThank you for shopping with Pokisham! 🛍️`;

    const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;

    res.status(200).json({
      success: true,
      invoiceUrl: downloadUrl,
      whatsappUrl,
      message,
    });
  } catch (error) {
    console.error('Share invoice error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create booking order
// @route   POST /api/orders/booking
// @access  Private
exports.createBookingOrder = async (req, res) => {
  try {
    const { productId, customerName, customerPhone, eventDate, quantity, city, notes } = req.body;

    // Validate required fields
    if (!productId || !customerName || !customerPhone || !eventDate || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: productId, customerName, customerPhone, eventDate, quantity',
      });
    }

    // Validate product exists and is a booking product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (product.productType !== 'booking') {
      return res.status(400).json({ success: false, message: 'This product does not support booking' });
    }

    const config = product.bookingConfig || {};

    // Validate event date (must be at least leadTimeDays from today)
    const leadTimeDays = config.leadTimeDays || 2;
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + leadTimeDays);
    minDate.setHours(0, 0, 0, 0);
    const eventDateObj = new Date(eventDate);
    if (eventDateObj < minDate) {
      return res.status(400).json({
        success: false,
        message: `Event date must be at least ${leadTimeDays} days from today`,
      });
    }

    // Validate quantity
    const minQty = config.minQuantity || 1;
    const maxQty = config.maxQuantity || 100;
    if (quantity < minQty || quantity > maxQty) {
      return res.status(400).json({
        success: false,
        message: `Quantity must be between ${minQty} and ${maxQty}`,
      });
    }

    // Validate city if availableCities is set
    if (config.availableCities && config.availableCities.length > 0 && city) {
      const cityLower = city.toLowerCase();
      const validCity = config.availableCities.some(c => c.toLowerCase() === cityLower);
      if (!validCity) {
        return res.status(400).json({
          success: false,
          message: `Service not available in ${city}. Available cities: ${config.availableCities.join(', ')}`,
        });
      }
    }

    // Calculate pricing
    const unitPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
    const totalPrice = unitPrice * quantity;
    const commissionPercentage = config.commissionPercentage || 10;
    const platformCommission = Math.round((totalPrice * commissionPercentage / 100) * 100) / 100;
    const vendorEarnings = Math.round((totalPrice - platformCommission) * 100) / 100;

    const order = await Order.create({
      user: req.user._id,
      orderType: 'booking',
      orderItems: [
        {
          product: product._id,
          name: product.name,
          quantity,
          image: product.images[0]?.url || '',
          price: unitPrice,
        },
      ],
      bookingDetails: {
        customerName,
        customerPhone,
        eventDate: eventDateObj,
        quantity,
        city: city || '',
        notes: notes || '',
      },
      shippingAddress: {
        name: customerName,
        phone: customerPhone,
        addressLine1: city || 'Booking Order',
        city: city || 'N/A',
        state: 'N/A',
        pincode: '000000',
      },
      paymentMethod: 'COD',
      paymentInfo: { status: 'pending' },
      itemsPrice: totalPrice,
      taxPrice: 0,
      shippingPrice: 0,
      totalPrice,
      platformCommission,
      tenantEarnings: vendorEarnings,
      orderStatus: 'Pending',
      statusHistory: [
        {
          status: 'Pending',
          message: 'Booking order placed successfully',
        },
      ],
    });

    // Send notifications
    try {
      const user = await User.findById(req.user._id);
      if (user) {
        if (user.email) {
          await sendOrderConfirmation(user.email, user.name, order);
        }
        const phoneNumber = user.phone || customerPhone;
        await sendOrderConfirmationSMS(
          phoneNumber,
          user.name,
          order.orderNumber,
          order.totalPrice,
          user.fcmToken || null
        );
        const admins = await User.find({
          role: { $in: ['admin', 'superadmin'] },
          fcmToken: { $ne: '' }
        }).select('fcmToken');
        const adminTokens = admins.map(a => a.fcmToken).filter(Boolean);
        if (adminTokens.length > 0) {
          await sendNewOrderNotificationToAdmins(adminTokens, user.name, order.orderNumber, order.totalPrice);
        }
      }
    } catch (notificationError) {
      console.error('Failed to send booking notifications:', notificationError);
    }

    res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Create Booking Order Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Forward booking order to vendor via WhatsApp
// @route   POST /api/orders/:id/forward-vendor
// @access  Private/Admin
exports.forwardToVendor = async (req, res) => {
  try {
    const { vendorName, vendorPhone } = req.body;

    if (!vendorName || !vendorPhone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide vendorName and vendorPhone',
      });
    }

    const order = await Order.findById(req.params.id).populate('user', 'name phone');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.orderType !== 'booking') {
      return res.status(400).json({ success: false, message: 'This is not a booking order' });
    }

    // Update vendor info
    order.vendorInfo = {
      vendorName,
      vendorPhone,
      forwardedAt: new Date(),
      forwardedBy: req.user._id,
    };
    order.orderStatus = 'Sent to Vendor';
    order.statusHistory.push({
      status: 'Sent to Vendor',
      message: `Order forwarded to vendor: ${vendorName}`,
    });

    await order.save();

    // Build WhatsApp message
    const bd = order.bookingDetails || {};
    const eventDateStr = bd.eventDate ? new Date(bd.eventDate).toLocaleDateString('en-IN') : 'N/A';
    const productImage = order.orderItems[0]?.image || '';

    const message = `*New Booking Order - ${order.orderNumber}*\n\n` +
      `Product: ${order.orderItems[0]?.name || 'N/A'}\n` +
      `Quantity: ${bd.quantity || 'N/A'}\n` +
      `Event Date: ${eventDateStr}\n` +
      `City: ${bd.city || 'N/A'}\n` +
      `Customer: ${bd.customerName || 'N/A'}\n` +
      `Phone: ${bd.customerPhone || 'N/A'}\n` +
      `Total: Rs.${order.totalPrice}\n` +
      (bd.notes ? `Notes: ${bd.notes}\n` : '') +
      (productImage ? `\nProduct Image: ${productImage}\n` : '') +
      `\nPlease confirm availability.`;

    const cleanPhone = vendorPhone.replace(/[^0-9]/g, '');
    const whatsappPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;

    res.status(200).json({
      success: true,
      order,
      whatsappUrl,
    });
  } catch (error) {
    console.error('Forward to vendor error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
