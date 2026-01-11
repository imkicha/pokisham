const ComboOffer = require('../models/ComboOffer');
const Product = require('../models/Product');
const Tenant = require('../models/Tenant');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// ===== ADMIN FUNCTIONS =====

// @desc    Get all combo offers (admin)
// @route   GET /api/combo-offers/admin/all
// @access  Private/Admin
exports.getAllComboOffers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by status
    if (req.query.status === 'active') {
      const now = new Date();
      query.isActive = true;
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
    } else if (req.query.status === 'inactive') {
      query.isActive = false;
    } else if (req.query.status === 'expired') {
      query.endDate = { $lt: new Date() };
    }

    // Filter by combo type
    if (req.query.comboType) {
      query.comboType = req.query.comboType;
    }

    // Filter by global/tenant
    if (req.query.isGlobal === 'true') {
      query.isGlobal = true;
    } else if (req.query.isGlobal === 'false') {
      query.isGlobal = false;
    }

    const comboOffers = await ComboOffer.find(query)
      .populate('createdBy', 'name email')
      .populate('tenant', 'name email')
      .populate('comboProducts.product', 'name price images')
      .populate('applicableCategories', 'name')
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ComboOffer.countDocuments(query);

    res.status(200).json({
      success: true,
      count: comboOffers.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      comboOffers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create combo offer (admin)
// @route   POST /api/combo-offers
// @access  Private/Admin
exports.createComboOffer = async (req, res) => {
  try {
    const comboData = { ...req.body };
    comboData.createdBy = req.user._id;
    comboData.isGlobal = true;

    // Parse comboProducts if it's a string
    if (typeof comboData.comboProducts === 'string') {
      try {
        comboData.comboProducts = JSON.parse(comboData.comboProducts);
      } catch (e) {
        comboData.comboProducts = [];
      }
    }

    // Parse applicableCategories if it's a string
    if (typeof comboData.applicableCategories === 'string') {
      comboData.applicableCategories = comboData.applicableCategories
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0);
    }

    // Handle image upload
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'pokisham/combo-offers',
          transformation: [
            { quality: 'auto:best' },
            { fetch_format: 'auto' }
          ],
        });
        comboData.image = result.secure_url;
        comboData.imagePublicId = result.public_id;

        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
      }
    }

    const comboOffer = await ComboOffer.create(comboData);

    res.status(201).json({
      success: true,
      message: 'Combo offer created successfully',
      comboOffer,
    });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update combo offer (admin)
// @route   PUT /api/combo-offers/:id
// @access  Private/Admin
exports.updateComboOffer = async (req, res) => {
  try {
    let comboOffer = await ComboOffer.findById(req.params.id);

    if (!comboOffer) {
      return res.status(404).json({
        success: false,
        message: 'Combo offer not found',
      });
    }

    const updateData = { ...req.body };

    // Parse comboProducts if it's a string
    if (typeof updateData.comboProducts === 'string') {
      try {
        updateData.comboProducts = JSON.parse(updateData.comboProducts);
      } catch (e) {
        // Keep existing if parse fails
      }
    }

    // Parse applicableCategories if it's a string
    if (typeof updateData.applicableCategories === 'string') {
      updateData.applicableCategories = updateData.applicableCategories
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0);
    }

    // Handle new image upload
    if (req.file) {
      try {
        if (comboOffer.imagePublicId) {
          await cloudinary.uploader.destroy(comboOffer.imagePublicId);
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'pokisham/combo-offers',
          transformation: [
            { quality: 'auto:best' },
            { fetch_format: 'auto' }
          ],
        });
        updateData.image = result.secure_url;
        updateData.imagePublicId = result.public_id;

        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
      }
    }

    comboOffer = await ComboOffer.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Combo offer updated successfully',
      comboOffer,
    });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete combo offer (admin)
// @route   DELETE /api/combo-offers/:id
// @access  Private/Admin
exports.deleteComboOffer = async (req, res) => {
  try {
    const comboOffer = await ComboOffer.findById(req.params.id);

    if (!comboOffer) {
      return res.status(404).json({
        success: false,
        message: 'Combo offer not found',
      });
    }

    if (comboOffer.imagePublicId) {
      await cloudinary.uploader.destroy(comboOffer.imagePublicId);
    }

    await comboOffer.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Combo offer deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Toggle combo offer status
// @route   PUT /api/combo-offers/:id/toggle
// @access  Private/Admin
exports.toggleComboOfferStatus = async (req, res) => {
  try {
    const comboOffer = await ComboOffer.findById(req.params.id);

    if (!comboOffer) {
      return res.status(404).json({
        success: false,
        message: 'Combo offer not found',
      });
    }

    comboOffer.isActive = !comboOffer.isActive;
    await comboOffer.save();

    res.status(200).json({
      success: true,
      message: `Combo offer ${comboOffer.isActive ? 'activated' : 'deactivated'} successfully`,
      comboOffer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===== TENANT FUNCTIONS =====

// @desc    Get tenant's own combo offers
// @route   GET /api/combo-offers/tenant/my-combos
// @access  Private/Tenant
exports.getTenantComboOffers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { tenant: req.user._id, isGlobal: false };

    // Filter by status
    if (req.query.status === 'active') {
      const now = new Date();
      query.isActive = true;
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
    } else if (req.query.status === 'inactive') {
      query.isActive = false;
    } else if (req.query.status === 'expired') {
      query.endDate = { $lt: new Date() };
    }

    if (req.query.comboType) {
      query.comboType = req.query.comboType;
    }

    const comboOffers = await ComboOffer.find(query)
      .populate('comboProducts.product', 'name price images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ComboOffer.countDocuments(query);

    res.status(200).json({
      success: true,
      count: comboOffers.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      comboOffers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create tenant combo offer
// @route   POST /api/combo-offers/tenant
// @access  Private/Tenant
exports.createTenantComboOffer = async (req, res) => {
  try {
    const comboData = { ...req.body };
    comboData.createdBy = req.user._id;
    comboData.tenant = req.user._id;
    comboData.isGlobal = false;

    // Parse comboProducts if it's a string
    if (typeof comboData.comboProducts === 'string') {
      try {
        comboData.comboProducts = JSON.parse(comboData.comboProducts);
      } catch (e) {
        comboData.comboProducts = [];
      }
    }

    // For tenant combos, validate that all products belong to the tenant
    if (comboData.comboType === 'fixed_products' && comboData.comboProducts?.length > 0) {
      // Get tenant's tenantId from Tenant model
      const tenant = await Tenant.findOne({ userId: req.user._id });
      if (!tenant) {
        return res.status(400).json({
          success: false,
          message: 'Tenant profile not found',
        });
      }

      const productIds = comboData.comboProducts.map(p => p.product);
      const products = await Product.find({ _id: { $in: productIds } });

      // Check if all products belong to this tenant
      const invalidProducts = products.filter(p =>
        !p.tenantId || p.tenantId.toString() !== tenant._id.toString()
      );

      if (invalidProducts.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'You can only create combos with your own products',
        });
      }
    }

    // Handle image upload
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'pokisham/tenant-combo-offers',
          transformation: [
            { quality: 'auto:best' },
            { fetch_format: 'auto' }
          ],
        });
        comboData.image = result.secure_url;
        comboData.imagePublicId = result.public_id;

        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
      }
    }

    const comboOffer = await ComboOffer.create(comboData);

    res.status(201).json({
      success: true,
      message: 'Combo offer created successfully',
      comboOffer,
    });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update tenant combo offer
// @route   PUT /api/combo-offers/tenant/:id
// @access  Private/Tenant
exports.updateTenantComboOffer = async (req, res) => {
  try {
    let comboOffer = await ComboOffer.findOne({ _id: req.params.id, tenant: req.user._id });

    if (!comboOffer) {
      return res.status(404).json({
        success: false,
        message: 'Combo offer not found or you do not have permission',
      });
    }

    const updateData = { ...req.body };

    // Parse comboProducts if it's a string
    if (typeof updateData.comboProducts === 'string') {
      try {
        updateData.comboProducts = JSON.parse(updateData.comboProducts);
      } catch (e) {
        // Keep existing
      }
    }

    // Handle new image upload
    if (req.file) {
      try {
        if (comboOffer.imagePublicId) {
          await cloudinary.uploader.destroy(comboOffer.imagePublicId);
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'pokisham/tenant-combo-offers',
          transformation: [
            { quality: 'auto:best' },
            { fetch_format: 'auto' }
          ],
        });
        updateData.image = result.secure_url;
        updateData.imagePublicId = result.public_id;

        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
      }
    }

    comboOffer = await ComboOffer.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Combo offer updated successfully',
      comboOffer,
    });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete tenant combo offer
// @route   DELETE /api/combo-offers/tenant/:id
// @access  Private/Tenant
exports.deleteTenantComboOffer = async (req, res) => {
  try {
    const comboOffer = await ComboOffer.findOne({ _id: req.params.id, tenant: req.user._id });

    if (!comboOffer) {
      return res.status(404).json({
        success: false,
        message: 'Combo offer not found or you do not have permission',
      });
    }

    if (comboOffer.imagePublicId) {
      await cloudinary.uploader.destroy(comboOffer.imagePublicId);
    }

    await comboOffer.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Combo offer deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===== CHECKOUT & VALIDATION FUNCTIONS =====

// @desc    Validate and get applicable combo offers for cart
// @route   POST /api/combo-offers/validate
// @access  Private
exports.validateComboOffers = async (req, res) => {
  try {
    const { cartItems, cartTotal } = req.body;
    const userId = req.user._id;
    const now = new Date();

    // Get product IDs from cart
    const cartProductIds = cartItems.map(item =>
      (item.product?._id || item.product)?.toString()
    ).filter(Boolean);

    // Fetch products with their tenantId and category
    const products = await Product.find({ _id: { $in: cartProductIds } })
      .select('_id tenantId category price');

    // Create maps for quick lookup
    const productMap = {};
    products.forEach(p => {
      productMap[p._id.toString()] = p;
    });

    // Get tenant info
    const tenantIds = products.map(p => p.tenantId).filter(Boolean);
    const tenants = await Tenant.find({ _id: { $in: tenantIds } }).select('_id userId');
    const tenantUserMap = {};
    tenants.forEach(t => {
      tenantUserMap[t._id.toString()] = t.userId.toString();
    });

    // Get all active combo offers
    const comboOffers = await ComboOffer.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .populate('comboProducts.product', 'name price')
      .sort({ priority: -1 });

    const applicableCombos = [];

    for (const combo of comboOffers) {
      // Check usage limits
      if (combo.usageLimit > 0 && combo.usageCount >= combo.usageLimit) {
        continue;
      }

      if (combo.perUserLimit > 0) {
        const userUsage = combo.usedBy.find(u => u.user.toString() === userId.toString());
        if (userUsage && userUsage.usageCount >= combo.perUserLimit) {
          continue;
        }
      }

      let isApplicable = false;
      let discount = 0;
      let matchedProducts = [];

      // Check based on combo type
      if (combo.comboType === 'fixed_products') {
        // All combo products must be in cart with required quantities
        const comboProductIds = combo.comboProducts.map(cp => cp.product?._id?.toString());
        const allProductsInCart = combo.comboProducts.every(cp => {
          const productId = cp.product?._id?.toString();
          const cartItem = cartItems.find(item =>
            (item.product?._id || item.product)?.toString() === productId
          );
          return cartItem && cartItem.quantity >= cp.quantity;
        });

        if (allProductsInCart) {
          isApplicable = true;
          // Calculate original price of combo items
          let originalTotal = 0;
          combo.comboProducts.forEach(cp => {
            const cartItem = cartItems.find(item =>
              (item.product?._id || item.product)?.toString() === cp.product?._id?.toString()
            );
            if (cartItem) {
              originalTotal += cartItem.price * cp.quantity;
              matchedProducts.push({
                productId: cp.product?._id,
                name: cp.product?.name,
                quantity: cp.quantity,
              });
            }
          });
          discount = originalTotal - combo.comboPrice;
        }
      } else if (combo.comboType === 'category_combo') {
        // Check if minimum items from applicable categories are in cart
        const categoryIds = combo.applicableCategories.map(c => c.toString());
        let categoryItemCount = 0;
        let categoryTotal = 0;

        cartItems.forEach(item => {
          const productId = (item.product?._id || item.product)?.toString();
          const product = productMap[productId];
          if (product && categoryIds.includes(product.category?.toString())) {
            categoryItemCount += item.quantity;
            categoryTotal += item.price * item.quantity;
            matchedProducts.push({
              productId: product._id,
              quantity: item.quantity,
            });
          }
        });

        if (categoryItemCount >= combo.minItemsFromCategory) {
          isApplicable = true;
          if (combo.discountType === 'percentage') {
            discount = (categoryTotal * combo.discountValue) / 100;
            if (combo.maxDiscountAmount > 0 && discount > combo.maxDiscountAmount) {
              discount = combo.maxDiscountAmount;
            }
          } else {
            discount = Math.min(combo.discountValue, categoryTotal);
          }
        }
      } else if (combo.comboType === 'any_n_products') {
        // For tenant combos, count products from that tenant
        // For global combos, count all products
        let applicableCount = 0;
        let applicableTotal = 0;

        cartItems.forEach(item => {
          const productId = (item.product?._id || item.product)?.toString();
          const product = productMap[productId];

          if (product) {
            let isProductApplicable = false;

            if (combo.isGlobal) {
              // Global combo - all products count
              isProductApplicable = true;
            } else if (combo.tenant) {
              // Tenant combo - only tenant's products count
              const productTenantId = product.tenantId?.toString();
              const tenantUserId = productTenantId ? tenantUserMap[productTenantId] : null;
              if (tenantUserId === combo.tenant.toString()) {
                isProductApplicable = true;
              }
            }

            if (isProductApplicable) {
              applicableCount += item.quantity;
              applicableTotal += item.price * item.quantity;
              matchedProducts.push({
                productId: product._id,
                quantity: item.quantity,
              });
            }
          }
        });

        if (applicableCount >= combo.minProducts) {
          isApplicable = true;
          if (combo.discountType === 'percentage') {
            discount = (applicableTotal * combo.discountValue) / 100;
            if (combo.maxDiscountAmount > 0 && discount > combo.maxDiscountAmount) {
              discount = combo.maxDiscountAmount;
            }
          } else {
            discount = Math.min(combo.discountValue, applicableTotal);
          }
        }
      }

      if (isApplicable && discount > 0) {
        applicableCombos.push({
          _id: combo._id,
          title: combo.title,
          description: combo.description,
          comboType: combo.comboType,
          badge: combo.badge,
          discount: Math.round(discount * 100) / 100,
          allowAdminOffersOnTop: combo.allowAdminOffersOnTop,
          isGlobal: combo.isGlobal,
          matchedProducts,
        });
      }
    }

    // Sort by discount (highest first)
    applicableCombos.sort((a, b) => b.discount - a.discount);

    res.status(200).json({
      success: true,
      count: applicableCombos.length,
      combos: applicableCombos,
      bestCombo: applicableCombos[0] || null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Mark combo as used (called after successful order)
// @route   POST /api/combo-offers/:id/use
// @access  Private
exports.markComboUsed = async (req, res) => {
  try {
    const comboOffer = await ComboOffer.findById(req.params.id);

    if (!comboOffer) {
      return res.status(404).json({
        success: false,
        message: 'Combo offer not found',
      });
    }

    // Increment usage count
    comboOffer.usageCount += 1;

    // Track per-user usage
    const userUsageIndex = comboOffer.usedBy.findIndex(u =>
      u.user.toString() === req.user._id.toString()
    );
    if (userUsageIndex > -1) {
      comboOffer.usedBy[userUsageIndex].usageCount += 1;
    } else {
      comboOffer.usedBy.push({ user: req.user._id, usageCount: 1 });
    }

    await comboOffer.save();

    res.status(200).json({
      success: true,
      message: 'Combo usage recorded',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get tenant's products for combo selection
// @route   GET /api/combo-offers/tenant/my-products
// @access  Private/Tenant
exports.getTenantProductsForCombo = async (req, res) => {
  try {
    // Get tenant's tenantId
    const tenant = await Tenant.findOne({ userId: req.user._id });
    if (!tenant) {
      return res.status(400).json({
        success: false,
        message: 'Tenant profile not found',
      });
    }

    const products = await Product.find({ tenantId: tenant._id, isActive: true })
      .select('_id name price discountPrice images')
      .sort({ createdAt: -1 });

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
