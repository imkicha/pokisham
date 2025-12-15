const Cart = require('../models/Cart');
const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      select: 'name price discountPrice images stock hasVariants variants giftWrapAvailable requiresCustomPhoto',
    });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity, variant, giftWrap } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        (!variant || item.variant?.size === variant?.size)
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity || 1;
      if (giftWrap !== undefined) {
        cart.items[existingItemIndex].giftWrap = giftWrap;
      }
    } else {
      cart.items.push({
        product: productId,
        quantity: quantity || 1,
        variant,
        giftWrap: giftWrap || false,
      });
    }

    await cart.save();

    cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      select: 'name price discountPrice images stock hasVariants variants giftWrapAvailable requiresCustomPhoto',
    });

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update cart item
// @route   PUT /api/cart/:itemId
// @access  Private
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity, giftWrap } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    const item = cart.items.id(req.params.itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart',
      });
    }

    if (quantity !== undefined) {
      item.quantity = quantity;
    }
    if (giftWrap !== undefined) {
      item.giftWrap = giftWrap;
    }

    await cart.save();

    const updatedCart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      select: 'name price discountPrice images stock hasVariants variants giftWrapAvailable requiresCustomPhoto',
    });

    res.status(200).json({
      success: true,
      cart: updatedCart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
exports.removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    cart.items = cart.items.filter(
      (item) => item._id.toString() !== req.params.itemId
    );

    await cart.save();

    const updatedCart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      select: 'name price discountPrice images stock hasVariants variants giftWrapAvailable requiresCustomPhoto',
    });

    res.status(200).json({
      success: true,
      cart: updatedCart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Upload custom photo for cart item
// @route   POST /api/cart/:itemId/custom-photo
// @access  Private
exports.uploadCustomPhoto = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    const item = cart.items.id(req.params.itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a photo',
      });
    }

    // Delete old custom photo if exists
    if (item.customPhoto && item.customPhoto.publicId) {
      try {
        await cloudinary.uploader.destroy(item.customPhoto.publicId);
      } catch (err) {
        console.log('Error deleting old custom photo:', err);
      }
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'pokisham/custom-photos',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto' },
      ],
    });

    // Delete temp file
    fs.unlinkSync(req.file.path);

    // Update cart item with custom photo
    item.customPhoto = {
      url: result.secure_url,
      publicId: result.public_id,
    };

    await cart.save();

    const updatedCart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      select: 'name price discountPrice images stock hasVariants variants giftWrapAvailable requiresCustomPhoto',
    });

    res.status(200).json({
      success: true,
      message: 'Custom photo uploaded successfully',
      cart: updatedCart,
      customPhoto: item.customPhoto,
    });
  } catch (error) {
    // Clean up temp file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.log('Error deleting temp file:', err);
      }
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Remove custom photo from cart item
// @route   DELETE /api/cart/:itemId/custom-photo
// @access  Private
exports.removeCustomPhoto = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    const item = cart.items.id(req.params.itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart',
      });
    }

    // Delete from Cloudinary if exists
    if (item.customPhoto && item.customPhoto.publicId) {
      try {
        await cloudinary.uploader.destroy(item.customPhoto.publicId);
      } catch (err) {
        console.log('Error deleting custom photo from Cloudinary:', err);
      }
    }

    // Remove custom photo from cart item
    item.customPhoto = undefined;

    await cart.save();

    const updatedCart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      select: 'name price discountPrice images stock hasVariants variants giftWrapAvailable requiresCustomPhoto',
    });

    res.status(200).json({
      success: true,
      message: 'Custom photo removed successfully',
      cart: updatedCart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
