const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// @desc    Get all products with filters
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build query
    const queryObj = {};

    // Only show active products for public requests
    // Admin can pass includeInactive=true to see all products
    if (req.query.includeInactive !== 'true') {
      queryObj.isActive = true;
    }

    if (req.query.category) {
      // Find category by slug
      const Category = require('../models/Category');
      const category = await Category.findOne({ slug: req.query.category });
      if (category) {
        queryObj.category = category._id;
      }
    }

    if (req.query.search) {
      queryObj.$text = { $search: req.query.search };
    }

    if (req.query.minPrice || req.query.maxPrice) {
      queryObj.price = {};
      if (req.query.minPrice) queryObj.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) queryObj.price.$lte = Number(req.query.maxPrice);
    }

    if (req.query.material) {
      queryObj.material = req.query.material;
    }

    if (req.query.isFeatured === 'true') {
      queryObj.isFeatured = true;
    }

    if (req.query.isTrending === 'true') {
      queryObj.isTrending = true;
    }

    // Sort
    let sort = {};
    if (req.query.sort === 'price_asc') {
      sort.price = 1;
    } else if (req.query.sort === 'price_desc') {
      sort.price = -1;
    } else if (req.query.sort === 'latest') {
      sort.createdAt = -1;
    } else {
      sort.createdAt = -1;
    }

    const products = await Product.find(queryObj)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(queryObj);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('reviews.user', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create product (Admin/Tenant)
// @route   POST /api/products
// @access  Private/Admin/Tenant
exports.createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };

    // Check if tenant has categories and validate category selection
    if (req.user.role === 'tenant' && req.user.tenantId) {
      const Category = require('../models/Category');

      // Get available categories for tenant (own + global)
      const availableCategories = await Category.find({
        $or: [
          { tenantId: req.user.tenantId },
          { tenantId: null }
        ],
        isActive: true
      }).select('_id name tenantId');

      // If category is provided, validate it
      if (productData.category) {
        const selectedCategory = await Category.findById(productData.category);

        if (!selectedCategory) {
          return res.status(400).json({
            success: false,
            message: 'Selected category not found'
          });
        }

        // Check if category belongs to tenant or is global
        const isTenantCategory = selectedCategory.tenantId &&
                                  selectedCategory.tenantId.toString() === req.user.tenantId.toString();
        const isGlobalCategory = !selectedCategory.tenantId;

        if (!isTenantCategory && !isGlobalCategory) {
          return res.status(403).json({
            success: false,
            message: 'You can only use your own categories or global categories'
          });
        }
      } else {
        // No category provided - check if any categories exist
        if (availableCategories.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No categories available. Please create a category first or select from available categories.',
            action: 'no_categories',
            hasGlobalCategories: false,
            hasTenantCategories: false
          });
        } else {
          // Categories exist but none selected
          return res.status(400).json({
            success: false,
            message: 'Please select a category for your product',
            action: 'select_category',
            availableCategories: availableCategories.map(cat => ({
              _id: cat._id,
              name: cat.name,
              type: cat.tenantId ? 'tenant' : 'global'
            }))
          });
        }
      }
    }

    // Parse tags if it's a string (from FormData)
    if (typeof productData.tags === 'string') {
      productData.tags = productData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    // Convert boolean strings to actual booleans
    if (typeof productData.isFeatured === 'string') {
      productData.isFeatured = productData.isFeatured === 'true';
    }
    if (typeof productData.isTrending === 'string') {
      productData.isTrending = productData.isTrending === 'true';
    }
    if (typeof productData.giftWrapAvailable === 'string') {
      productData.giftWrapAvailable = productData.giftWrapAvailable === 'true';
    }
    if (typeof productData.isActive === 'string') {
      productData.isActive = productData.isActive === 'true';
    }
    if (typeof productData.hasVariants === 'string') {
      productData.hasVariants = productData.hasVariants === 'true';
    }

    // Parse whatsIncluded
    if (productData.whatsIncluded && typeof productData.whatsIncluded === 'string') {
      productData.whatsIncluded = productData.whatsIncluded.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Parse productType and bookingConfig
    if (productData.productType === 'booking') {
      if (productData.bookingConfig && typeof productData.bookingConfig === 'string') {
        productData.bookingConfig = JSON.parse(productData.bookingConfig);
      }
      productData.stock = 9999;
    }

    // Parse variants if they exist
    if (productData.variants && typeof productData.variants === 'string') {
      productData.variants = JSON.parse(productData.variants);
    }

    // Automatically set tenantId if user is a tenant
    if (req.user.role === 'tenant' && req.user.tenantId) {
      productData.tenantId = req.user.tenantId;
      console.log('Setting tenantId:', req.user.tenantId);
    }

    console.log('Creating product with data:', {
      name: productData.name,
      category: productData.category,
      price: productData.price,
      stock: productData.stock,
      tenantId: productData.tenantId,
      userRole: req.user.role
    });

    // Handle multiple image uploads if files are provided
    if (req.files && req.files.length > 0) {
      const fs = require('fs');
      const uploadPromises = req.files.map((file) =>
        cloudinary.uploader.upload(file.path, {
          folder: 'pokisham/products',
        })
      );

      const results = await Promise.all(uploadPromises);

      productData.images = results.map((result) => ({
        url: result.secure_url,
        publicId: result.public_id,
      }));

      // Delete the files from uploads folder after uploading to cloudinary
      req.files.forEach((file) => {
        fs.unlinkSync(file.path);
      });
    } else {
      // Default placeholder image if no images are uploaded
      productData.images = [
        {
          url: 'https://via.placeholder.com/400',
          publicId: 'placeholder',
        },
      ];
    }

    const product = await Product.create(productData);

    // Send notifications to all users about the new product
    try {
      const users = await User.find({ isActive: true }).select('_id');
      const notificationPromises = users.map(user =>
        createNotification({
          recipient: user._id,
          type: 'new_product',
          title: 'New Product Added!',
          message: `Check out our new product: ${product.name}`,
          link: `/product/${product._id}`,
          relatedProduct: product._id,
        })
      );
      // Run notifications in background, don't wait for them
      Promise.all(notificationPromises).catch(err =>
        console.error('Error sending new product notifications:', err)
      );
    } catch (notifError) {
      console.error('Error preparing notifications:', notifError);
    }

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Create Product Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

// @desc    Update product (Admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if tenant is trying to edit another tenant's product
    if (req.user.role === 'tenant') {
      if (!product.tenantId || product.tenantId.toString() !== req.user.tenantId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only edit your own products',
        });
      }
    }

    const productData = { ...req.body };

    // Parse existingImages if it's a string (from FormData)
    let existingImages = [];
    if (productData.existingImages) {
      if (typeof productData.existingImages === 'string') {
        existingImages = JSON.parse(productData.existingImages);
      } else {
        existingImages = productData.existingImages;
      }
    }

    // Parse variants if it's a string (from FormData)
    if (productData.variants && typeof productData.variants === 'string') {
      productData.variants = JSON.parse(productData.variants);
    }

    // Parse whatsIncluded
    if (productData.whatsIncluded && typeof productData.whatsIncluded === 'string') {
      productData.whatsIncluded = productData.whatsIncluded.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Parse productType and bookingConfig
    if (productData.productType === 'booking') {
      if (productData.bookingConfig && typeof productData.bookingConfig === 'string') {
        productData.bookingConfig = JSON.parse(productData.bookingConfig);
      }
      productData.stock = 9999;
    }

    // Convert boolean strings to actual booleans
    if (typeof productData.hasVariants === 'string') {
      productData.hasVariants = productData.hasVariants === 'true';
    }
    if (typeof productData.isActive === 'string') {
      productData.isActive = productData.isActive === 'true';
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const fs = require('fs');
      const uploadPromises = req.files.map((file) =>
        cloudinary.uploader.upload(file.path, {
          folder: 'pokisham/products',
        })
      );
      const results = await Promise.all(uploadPromises);
      const newImages = results.map((result) => ({
        url: result.secure_url,
        publicId: result.public_id,
      }));

      // Delete images that were removed
      const removedImages = product.images.filter(
        (img) => !existingImages.find((ei) => ei.publicId === img.publicId)
      );
      for (const img of removedImages) {
        if (img.publicId) {
          await cloudinary.uploader.destroy(img.publicId);
        }
      }

      // Combine existing and new images
      productData.images = [...existingImages, ...newImages];

      // Clean up uploaded files
      req.files.forEach((file) => {
        fs.unlinkSync(file.path);
      });
    } else {
      // Just update with existing images
      productData.images = existingImages;

      // Delete images that were removed
      const removedImages = product.images.filter(
        (img) => !existingImages.find((ei) => ei.publicId === img.publicId)
      );
      for (const img of removedImages) {
        if (img.publicId) {
          await cloudinary.uploader.destroy(img.publicId);
        }
      }
    }

    // Remove the existingImages field as it's not part of the schema
    delete productData.existingImages;

    product = await Product.findByIdAndUpdate(req.params.id, productData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete product (Admin)
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if tenant is trying to delete another tenant's product
    if (req.user.role === 'tenant') {
      if (!product.tenantId || product.tenantId.toString() !== req.user.tenantId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own products',
        });
      }
    }

    // Delete images from cloudinary
    for (const image of product.images) {
      await cloudinary.uploader.destroy(image.publicId);
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Toggle product active status
// @route   PUT /api/products/:id/toggle-status
// @access  Private/Admin
exports.toggleProductStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if tenant is trying to toggle another tenant's product
    if (req.user.role === 'tenant') {
      if (!product.tenantId || product.tenantId.toString() !== req.user.tenantId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own products',
        });
      }
    }

    product.isActive = !product.isActive;
    await product.save();

    res.status(200).json({
      success: true,
      message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Upload product images
// @route   POST /api/products/:id/images
// @access  Private/Admin
exports.uploadProductImages = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image',
      });
    }

    const uploadPromises = req.files.map((file) =>
      cloudinary.uploader.upload(file.path, {
        folder: 'pokisham/products',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' },
        ],
      })
    );

    const results = await Promise.all(uploadPromises);

    const images = results.map((result) => ({
      url: result.secure_url,
      publicId: result.public_id,
    }));

    product.images.push(...images);
    await product.save();

    res.status(200).json({
      success: true,
      images: product.images,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:imageId
// @access  Private/Admin
exports.deleteProductImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const image = product.images.id(req.params.imageId);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found',
      });
    }

    // Delete from cloudinary
    await cloudinary.uploader.destroy(image.publicId);

    product.images = product.images.filter(
      (img) => img._id.toString() !== req.params.imageId
    );

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create product review
// @route   POST /api/products/:id/reviews
// @access  Private
exports.createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: 'Product already reviewed',
      });
    }

    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.ratings =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get new arrivals (products added in last 7 days)
// @route   GET /api/products/new-arrivals
// @access  Public
exports.getNewArrivals = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const products = await Product.find({
      isActive: true,
      createdAt: { $gte: sevenDaysAgo },
    })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get related products
// @route   GET /api/products/:id/related
// @access  Public
exports.getRelatedProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      isActive: true,
    })
      .limit(8)
      .select('name price discountPrice images ratings numReviews');

    res.status(200).json({
      success: true,
      products: relatedProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get product commission statistics (Super Admin)
// @route   GET /api/products/admin/commission-stats
// @access  Private/SuperAdmin
exports.getProductCommissionStats = async (req, res) => {
  try {
    console.log('📊 Product Commission Stats requested by:', req.user?.email, 'Role:', req.user?.role);
    const Order = require('../models/Order');

    // Get all delivered orders with product details
    const deliveredOrders = await Order.find({
      orderStatus: 'Delivered',
    }).populate('orderItems.product', 'name images')
      .populate('tenantId', 'businessName');

    // Calculate commission per product
    const productCommissionMap = {};

    deliveredOrders.forEach(order => {
      order.orderItems.forEach(item => {
        const productId = item.product?._id?.toString();

        if (!productId) return;

        // Calculate commission for this line item
        const itemTotal = item.price * item.quantity;
        const itemCommission = order.platformCommission
          ? (itemTotal / order.totalPrice) * order.platformCommission
          : 0;

        if (!productCommissionMap[productId]) {
          productCommissionMap[productId] = {
            productId,
            productName: item.name,
            productImage: item.image,
            totalSold: 0,
            totalRevenue: 0,
            totalCommission: 0,
            orderCount: 0,
            tenants: new Set(),
          };
        }

        productCommissionMap[productId].totalSold += item.quantity;
        productCommissionMap[productId].totalRevenue += itemTotal;
        productCommissionMap[productId].totalCommission += itemCommission;
        productCommissionMap[productId].orderCount++;

        if (order.tenantId) {
          productCommissionMap[productId].tenants.add(order.tenantId.businessName);
        }
      });
    });

    // Convert to array and format
    const productStats = Object.values(productCommissionMap).map(stat => ({
      productId: stat.productId,
      productName: stat.productName,
      productImage: stat.productImage,
      totalSold: stat.totalSold,
      totalRevenue: Math.round(stat.totalRevenue * 100) / 100,
      totalCommission: Math.round(stat.totalCommission * 100) / 100,
      orderCount: stat.orderCount,
      tenants: Array.from(stat.tenants),
    }));

    // Sort by total revenue (highest first)
    productStats.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Calculate overall stats
    const overallStats = {
      totalProducts: productStats.length,
      totalRevenue: productStats.reduce((sum, p) => sum + p.totalRevenue, 0),
      totalCommission: productStats.reduce((sum, p) => sum + p.totalCommission, 0),
      totalUnitsSold: productStats.reduce((sum, p) => sum + p.totalSold, 0),
    };

    res.status(200).json({
      success: true,
      overallStats,
      products: productStats,
    });
  } catch (error) {
    console.error('Get Product Commission Stats Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
