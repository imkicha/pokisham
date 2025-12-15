const Order = require('../models/Order');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const { createNotification } = require('./notificationController');

// @desc    Assign/Route order to a tenant (Super Admin)
// @route   POST /api/orders/:id/assign-tenant
// @access  Private/SuperAdmin
const assignOrderToTenant = async (req, res) => {
  try {
    const { tenantId, notifyOnly } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a tenant ID',
      });
    }

    // Verify tenant exists and is approved
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    if (tenant.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Tenant must be approved to receive orders',
      });
    }

    // Find the order
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if order is already assigned (unless notifyOnly mode)
    if (!notifyOnly && order.tenantId && order.routedToTenant) {
      return res.status(400).json({
        success: false,
        message: 'Order is already assigned to a tenant',
      });
    }

    // If notifyOnly, just create notification without assigning
    if (notifyOnly) {
      const tenantUser = await User.findOne({ tenantId: tenant._id });
      if (tenantUser) {
        await createNotification({
          recipient: tenantUser._id,
          type: 'order_assigned',
          title: 'New Order Available',
          message: `Order #${order._id.toString().slice(-6).toUpperCase()} worth ₹${order.totalPrice.toLocaleString('en-IN')} is available. First to accept gets the order!`,
          link: `/tenant/orders/${order._id}`,
          relatedOrder: order._id,
          relatedTenant: tenant._id,
        });
      }

      return res.status(200).json({
        success: true,
        message: `Notification sent to ${tenant.businessName}`,
      });
    }

    // Assign the order to the tenant
    order.tenantId = tenantId;
    order.routedToTenant = true;
    order.orderStatus = 'Pending'; // Reset to Pending for tenant to process

    // Add to status history
    if (order.statusHistory) {
      order.statusHistory.push({
        status: 'Assigned',
        message: `Order assigned to tenant: ${tenant.businessName}`,
        timestamp: Date.now(),
      });
    }

    await order.save();

    // Create notification for tenant
    const tenantUser = await User.findOne({ tenantId: tenant._id });
    if (tenantUser) {
      await createNotification({
        recipient: tenantUser._id,
        type: 'order_assigned',
        title: 'New Order Assigned',
        message: `You have been assigned order #${order._id.toString().slice(-6).toUpperCase()} worth ₹${order.totalPrice.toLocaleString('en-IN')}`,
        link: `/tenant/orders/${order._id}`,
        relatedOrder: order._id,
        relatedTenant: tenant._id,
      });
    }

    console.log(`✅ Order ${order._id} assigned to tenant: ${tenant.businessName}`);
    console.log(`📧 Tenant email: ${tenant.email}`);

    res.status(200).json({
      success: true,
      message: `Order successfully assigned to ${tenant.businessName}`,
      order: {
        _id: order._id,
        orderNumber: order._id.toString().slice(-6).toUpperCase(),
        tenantId: order.tenantId,
        routedToTenant: order.routedToTenant,
        orderStatus: order.orderStatus,
      },
    });
  } catch (error) {
    console.error('Assign Order Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Accept/Claim a broadcasted order (Tenant)
// @route   POST /api/orders/:id/accept
// @access  Private/Tenant
const acceptOrder = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: 'You are not a registered tenant',
      });
    }

    // Verify tenant exists and is approved
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    if (tenant.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved tenants can accept orders',
      });
    }

    // Find the order
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if order is already assigned
    if (order.routedToTenant) {
      return res.status(400).json({
        success: false,
        message: 'This order has already been accepted by another tenant',
      });
    }

    // Assign the order to this tenant
    order.tenantId = tenantId;
    order.routedToTenant = true;
    order.orderStatus = 'Pending'; // Reset to Pending for tenant to process

    // Add to status history
    if (order.statusHistory) {
      order.statusHistory.push({
        status: 'Assigned',
        message: `Order accepted by tenant: ${tenant.businessName}`,
        timestamp: Date.now(),
      });
    }

    await order.save();

    console.log(`✅ Order ${order._id} accepted by tenant: ${tenant.businessName}`);

    res.status(200).json({
      success: true,
      message: `Order successfully accepted!`,
      order: {
        _id: order._id,
        orderNumber: order._id.toString().slice(-6).toUpperCase(),
        tenantId: order.tenantId,
        routedToTenant: order.routedToTenant,
        orderStatus: order.orderStatus,
      },
    });
  } catch (error) {
    console.error('Accept Order Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get orders assigned to tenant (Tenant)
// @route   GET /api/orders/my-orders
// @access  Private/Tenant
const getTenantOrders = async (req, res) => {
  try {
    // This will be called when a tenant requests their orders
    const tenantId = req.user.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: 'You are not a registered tenant',
      });
    }

    const orders = await Order.find({
      tenantId: tenantId,
      routedToTenant: true
    })
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error('Get Tenant Orders Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update order status (Tenant can update their own orders)
// @route   PUT /api/orders/:id/status
// @access  Private/Tenant/Admin
const updateTenantOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    const validStatuses = ['Pending', 'Accepted', 'Processing', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status',
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if tenant owns this order
    if (req.user.role === 'tenant') {
      if (!order.tenantId || order.tenantId.toString() !== req.user.tenantId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own orders',
        });
      }
    }

    order.orderStatus = orderStatus;
    order.statusHistory.push({
      status: orderStatus,
      message: `Order status updated to ${orderStatus}`,
      timestamp: Date.now(),
    });

    if (orderStatus === 'Delivered') {
      order.deliveredAt = Date.now();

      // Calculate and update commission earnings
      if (order.tenantId) {
        const tenant = await Tenant.findById(order.tenantId);
        if (tenant) {
          const commissionRate = tenant.commissionRate || 10;
          const platformCommission = (order.totalPrice * commissionRate) / 100;
          const tenantEarnings = order.totalPrice - platformCommission;

          // Update order with commission details
          order.platformCommission = platformCommission;
          order.tenantEarnings = tenantEarnings;

          console.log(`💰 Commission calculated for order ${order._id}:`);
          console.log(`   Order Total: ₹${order.totalPrice}`);
          console.log(`   Commission Rate: ${commissionRate}%`);
          console.log(`   Platform Earns: ₹${platformCommission.toFixed(2)}`);
          console.log(`   Tenant Earns: ₹${tenantEarnings.toFixed(2)}`);
        }
      }
    }

    if (orderStatus === 'Cancelled') {
      order.cancelledAt = Date.now();
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    console.error('Update Order Status Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  assignOrderToTenant,
  acceptOrder,
  getTenantOrders,
  updateTenantOrderStatus,
};
