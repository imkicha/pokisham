const Category = require('../models/Category');
const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    // Show ALL active categories regardless of user role or tenant
    const query = { isActive: true };

    const categories = await Category.find(query)
      .populate('createdBy', 'name email')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create category (Admin/Tenant)
// @route   POST /api/categories
// @access  Private/Admin/Tenant
exports.createCategory = async (req, res) => {
  try {
    const categoryData = { ...req.body };

    // Set createdBy to current user
    categoryData.createdBy = req.user._id;

    // If user is a tenant, set tenantId
    if (req.user.role === 'tenant' && req.user.tenantId) {
      categoryData.tenantId = req.user.tenantId;
    } else {
      // Admin creates global categories
      categoryData.tenantId = null;
    }

    // Handle image upload if file is provided
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'pokisham/categories',
          transformation: [{ width: 800, height: 600, crop: 'fill' }],
        });
        categoryData.image = result.secure_url;

        // Delete file from uploads folder
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        // Continue without image if upload fails
      }
    }

    const category = await Category.create(categoryData);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    // Clean up uploaded file if it exists
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update category (Admin/Tenant)
// @route   PUT /api/categories/:id
// @access  Private/Admin/Tenant
exports.updateCategory = async (req, res) => {
  try {
    let category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Authorization check: Tenant can only update their own categories
    if (req.user.role === 'tenant') {
      if (!category.tenantId || category.tenantId.toString() !== req.user.tenantId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this category',
        });
      }
    }

    const updateData = { ...req.body };

    // Handle image upload if file is provided
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'pokisham/categories',
          transformation: [{ width: 800, height: 600, crop: 'fill' }],
        });
        updateData.image = result.secure_url;

        // Delete file from uploads folder
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
      }
    }

    category = await Category.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category,
    });
  } catch (error) {
    // Clean up uploaded file if it exists
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete category (Admin/Tenant)
// @route   DELETE /api/categories/:id
// @access  Private/Admin/Tenant
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Authorization check: Tenant can only delete their own categories
    if (req.user.role === 'tenant') {
      if (!category.tenantId || category.tenantId.toString() !== req.user.tenantId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this category',
        });
      }
    }

    // Check if any products are using this category
    const productsCount = await Product.countDocuments({ category: req.params.id });

    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. ${productsCount} products are using this category.`,
      });
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get tenant categories with count
// @route   GET /api/categories/tenant/my-categories
// @access  Private/Tenant
exports.getTenantCategories = async (req, res) => {
  try {
    if (req.user.role !== 'tenant' || !req.user.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Tenant role required.',
      });
    }

    const categories = await Category.find({
      tenantId: req.user.tenantId,
      isActive: true,
    }).sort({ createdAt: -1 });

    // Get product count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.countDocuments({
          category: category._id,
          isActive: true,
        });

        return {
          ...category.toObject(),
          productCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: categories.length,
      categories: categoriesWithCount,
      canCreateProducts: categories.length > 0,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Check if tenant can create products
// @route   GET /api/categories/tenant/can-create-products
// @access  Private/Tenant
exports.canCreateProducts = async (req, res) => {
  try {
    if (req.user.role !== 'tenant' || !req.user.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Tenant role required.',
      });
    }

    const categoriesCount = await Category.countDocuments({
      tenantId: req.user.tenantId,
      isActive: true,
    });

    res.status(200).json({
      success: true,
      canCreate: categoriesCount > 0,
      categoriesCount,
      message: categoriesCount === 0
        ? 'Please create at least one category before adding products'
        : `You have ${categoriesCount} ${categoriesCount === 1 ? 'category' : 'categories'} and can create products`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get navbar categories (public)
// @route   GET /api/categories/navbar
// @access  Public
exports.getNavbarCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      isActive: true,
      showInNavbar: true,
    })
      .select('name slug')
      .sort({ navbarOrder: 1, name: 1 });

    res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update navbar categories (Admin only)
// @route   PUT /api/categories/navbar
// @access  Private/Admin
exports.updateNavbarCategories = async (req, res) => {
  try {
    const { categoryIds } = req.body;

    if (!Array.isArray(categoryIds)) {
      return res.status(400).json({
        success: false,
        message: 'categoryIds must be an array',
      });
    }

    // First, remove all categories from navbar
    await Category.updateMany(
      { showInNavbar: true },
      { showInNavbar: false, navbarOrder: 0 }
    );

    // Then, add selected categories to navbar with order
    for (let i = 0; i < categoryIds.length; i++) {
      await Category.findByIdAndUpdate(categoryIds[i], {
        showInNavbar: true,
        navbarOrder: i + 1,
      });
    }

    // Return updated navbar categories
    const navbarCategories = await Category.find({
      showInNavbar: true,
    })
      .select('name slug navbarOrder')
      .sort({ navbarOrder: 1 });

    res.status(200).json({
      success: true,
      message: 'Navbar categories updated successfully',
      categories: navbarCategories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
