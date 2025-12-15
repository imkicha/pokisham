const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }
};

// Admin authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

// Check if user is super admin
exports.isSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super Admin only.',
    });
  }
  next();
};

// Check if user is tenant
exports.isTenant = (req, res, next) => {
  if (req.user.role !== 'tenant') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Tenant only.',
    });
  }
  next();
};

// Check if user is super admin or admin
exports.isAdminOrSuperAdmin = (req, res, next) => {
  if (!['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin access required.',
    });
  }
  next();
};

// Check if user is admin, super admin, or tenant (can manage products)
exports.canManageProducts = (req, res, next) => {
  if (!['admin', 'superadmin', 'tenant'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You need to be a seller to manage products.',
    });
  }
  next();
};
