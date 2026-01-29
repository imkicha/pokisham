const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Create tenant application
// @route   POST /api/tenants/apply
// @access  Public
exports.applyAsTenant = async (req, res) => {
  try {
    const {
      businessName,
      ownerName,
      email,
      phone,
      address,
      gstNumber,
      panNumber,
      bankDetails,
      password,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Check if tenant already exists
    const existingTenant = await Tenant.findOne({ email });
    if (existingTenant) {
      return res.status(400).json({
        success: false,
        message: 'A tenant application with this email already exists',
      });
    }

    // Validate required fields
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Create user account for tenant
    const user = await User.create({
      name: ownerName,
      email,
      phone,
      password,
      role: 'user', // Will be updated to 'tenant' after approval
    });

    // Create tenant profile
    const tenant = await Tenant.create({
      businessName,
      ownerName,
      email,
      phone,
      address,
      gstNumber,
      panNumber,
      bankDetails,
      userId: user._id,
      status: 'pending',
    });

    // Link user to tenant
    user.tenantId = tenant._id;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Tenant application submitted successfully. Awaiting approval.',
      tenant,
    });
  } catch (error) {
    console.error('Tenant application error:', error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email or phone already exists',
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit application',
    });
  }
};

// @desc    Get all tenants (Super Admin)
// @route   GET /api/tenants
// @access  Private/SuperAdmin
exports.getAllTenants = async (req, res) => {
  try {
    const { status, search } = req.query;

    let query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const tenants = await Tenant.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    // Calculate commission statistics for each tenant from delivered orders
    const Order = require('../models/Order');
    const tenantsWithStats = await Promise.all(
      tenants.map(async (tenant) => {
        const deliveredOrders = await Order.find({
          tenantId: tenant._id,
          orderStatus: 'Delivered',
        });

        const totalRevenue = deliveredOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
        const totalCommission = deliveredOrders.reduce((sum, order) => sum + (order.platformCommission || 0), 0);
        const totalOrders = deliveredOrders.length;

        return {
          ...tenant.toObject(),
          totalRevenue,
          totalCommission,
          totalOrders,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: tenantsWithStats.length,
      tenants: tenantsWithStats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single tenant
// @route   GET /api/tenants/:id
// @access  Private
exports.getTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).populate('userId', 'name email phone');

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    // Check authorization
    if (req.user.role === 'tenant' && req.user.tenantId.toString() !== tenant._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this tenant',
      });
    }

    res.status(200).json({
      success: true,
      tenant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Approve tenant (Super Admin)
// @route   PUT /api/tenants/:id/approve
// @access  Private/SuperAdmin
exports.approveTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    tenant.status = 'approved';
    await tenant.save();

    // Update user role to tenant and set isVerified to true
    await User.findByIdAndUpdate(tenant.userId, {
      role: 'tenant',
      isVerified: true
    });

    res.status(200).json({
      success: true,
      message: 'Tenant approved successfully',
      tenant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Reject tenant (Super Admin)
// @route   PUT /api/tenants/:id/reject
// @access  Private/SuperAdmin
exports.rejectTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    tenant.status = 'rejected';
    await tenant.save();

    res.status(200).json({
      success: true,
      message: 'Tenant rejected',
      tenant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Suspend tenant (Super Admin)
// @route   PUT /api/tenants/:id/suspend
// @access  Private/SuperAdmin
exports.suspendTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    tenant.status = 'suspended';
    tenant.isActive = false;
    await tenant.save();

    // Block user access by setting role back to 'user' and marking as not verified
    await User.findByIdAndUpdate(tenant.userId, {
      role: 'user',
      isVerified: false
    });

    res.status(200).json({
      success: true,
      message: 'Tenant suspended',
      tenant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Reactivate tenant (Super Admin)
// @route   PUT /api/tenants/:id/reactivate
// @access  Private/SuperAdmin
exports.reactivateTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    tenant.status = 'approved';
    tenant.isActive = true;
    await tenant.save();

    // Restore user access
    await User.findByIdAndUpdate(tenant.userId, {
      role: 'tenant',
      isVerified: true
    });

    res.status(200).json({
      success: true,
      message: 'Tenant reactivated successfully',
      tenant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update tenant
// @route   PUT /api/tenants/:id
// @access  Private
exports.updateTenant = async (req, res) => {
  try {
    let tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    // Check authorization
    if (req.user.role === 'tenant' && req.user.tenantId.toString() !== tenant._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this tenant',
      });
    }

    // Track if email or phone changed
    const oldEmail = tenant.email;
    const oldPhone = tenant.phone;
    const oldName = tenant.ownerName;

    tenant = await Tenant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Sync updated fields to the linked User account so tenant can login with new credentials
    if (tenant.userId) {
      const userUpdate = {};
      if (req.body.email && req.body.email !== oldEmail) {
        userUpdate.email = req.body.email;
      }
      if (req.body.phone && req.body.phone !== oldPhone) {
        userUpdate.phone = req.body.phone;
      }
      if (req.body.ownerName && req.body.ownerName !== oldName) {
        userUpdate.name = req.body.ownerName;
      }
      if (Object.keys(userUpdate).length > 0) {
        await User.findByIdAndUpdate(tenant.userId, userUpdate);
      }
    }

    res.status(200).json({
      success: true,
      tenant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get tenant dashboard stats
// @route   GET /api/tenants/:id/stats
// @access  Private/Tenant
exports.getTenantStats = async (req, res) => {
  try {
    const tenantId = req.params.id;

    // Check authorization
    if (req.user.role === 'tenant' && req.user.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    // Get product count
    const productCount = await Product.countDocuments({ tenantId });

    // Get order stats
    const orders = await Order.find({ tenantId });
    const pendingOrders = orders.filter(o => ['Pending', 'Processing'].includes(o.orderStatus)).length;
    const completedOrders = orders.filter(o => o.orderStatus === 'Delivered').length;

    // Calculate revenue
    const totalRevenue = orders.reduce((sum, order) => {
      if (order.orderStatus === 'Delivered') {
        return sum + order.totalPrice;
      }
      return sum;
    }, 0);

    const commissionAmount = (totalRevenue * tenant.commissionRate) / 100;
    const netRevenue = totalRevenue - commissionAmount;

    res.status(200).json({
      success: true,
      stats: {
        productCount,
        totalOrders: orders.length,
        pendingOrders,
        completedOrders,
        totalRevenue,
        commissionRate: tenant.commissionRate,
        commissionAmount,
        netRevenue,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update commission rate (Super Admin)
// @route   PUT /api/tenants/:id/commission
// @access  Private/SuperAdmin
exports.updateCommissionRate = async (req, res) => {
  try {
    const { commissionRate } = req.body;

    if (commissionRate < 0 || commissionRate > 100) {
      return res.status(400).json({
        success: false,
        message: 'Commission rate must be between 0 and 100',
      });
    }

    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { commissionRate },
      { new: true }
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Commission rate updated',
      tenant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
