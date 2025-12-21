const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderNumber: {
      type: String,
      unique: true,
    },
    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        image: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        variant: {
          size: String,
        },
        giftWrap: {
          type: Boolean,
          default: false,
        },
        customPhoto: {
          url: String,
          publicId: String,
        },
        tenantId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Tenant',
        },
      },
    ],
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      default: null, // null for multi-tenant orders
    },
    isMultiTenant: {
      type: Boolean,
      default: false,
    },
    parentOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    routedToTenant: {
      type: Boolean,
      default: false,
    },
    shippingAddress: {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      addressLine1: {
        type: String,
        required: true,
      },
      addressLine2: String,
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      pincode: {
        type: String,
        required: true,
      },
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['UPI', 'Card', 'NetBanking', 'COD'],
    },
    paymentInfo: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending',
      },
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    giftWrapPrice: {
      type: Number,
      default: 0.0,
    },
    packingPrice: {
      type: Number,
      default: 0.0,
    },
    discountPrice: {
      type: Number,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    orderStatus: {
      type: String,
      required: true,
      enum: ['Pending', 'Accepted', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    statusHistory: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        message: String,
      },
    ],
    platformCommission: {
      type: Number,
      default: 0.0,
    },
    tenantEarnings: {
      type: Number,
      default: 0.0,
    },
    deliveredAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
  },
  {
    timestamps: true,
  }
);

// Generate order number before saving
orderSchema.pre('save', async function () {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `PK${year}${month}${day}${random}`;
  }
});

module.exports = mongoose.model('Order', orderSchema);
