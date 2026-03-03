/**
 * Shipment Model
 *
 * Tracks individual vendor shipments within a multi-vendor order.
 * When a customer orders products from 3 vendors, the parent Order
 * has 3 Shipment documents — one per vendor — each with its own
 * Shiprocket order, AWB, and pickup location.
 *
 * For single-vendor orders, a Shipment is still created for
 * consistency, but the Order.shipping fields are also populated.
 */

const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema(
  {
    // Reference to the parent order
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },

    // The vendor responsible for this shipment
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },

    // Items in this shipment (subset of parent order's items)
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: String,
        quantity: Number,
        price: Number,
        variant: {
          size: String,
        },
        image: String,
      },
    ],

    // ─── Vendor Workflow ──────────────────────────────────────────────
    vendorStatus: {
      type: String,
      enum: [
        'pending',         // Order received, waiting for vendor action
        'accepted',        // Vendor accepted the order
        'packing',         // Vendor is packing
        'ready_to_ship',   // Vendor clicked "Ready to Ship"
        'shipment_created', // Shiprocket order created
        'awb_assigned',    // AWB assigned
        'pickup_scheduled', // Pickup scheduled with courier
        'picked_up',       // Courier picked up
        'in_transit',      // In transit
        'out_for_delivery', // Out for delivery
        'delivered',       // Delivered to customer
        'cancelled',       // Cancelled
        'rto',             // Return to origin
      ],
      default: 'pending',
    },

    // ─── Shiprocket Integration ──────────────────────────────────────
    shiprocketOrderId: { type: String, default: null },
    shipmentId: { type: String, default: null },
    awb: { type: String, default: null, index: true },
    courierName: { type: String, default: null },
    courierCompanyId: { type: Number, default: null },
    shiprocketStatus: { type: String, default: null },
    pickupLocation: { type: String, default: null },

    // Tracking & logistics
    pickupScheduledDate: { type: Date, default: null },
    deliveryEstimate: { type: String, default: null },
    trackingUrl: { type: String, default: null },
    label: { type: String, default: null },
    shippingCharge: { type: Number, default: 0 },

    // Timestamps for status transitions
    readyToShipAt: { type: Date, default: null },
    pickedUpAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },

    // Idempotency — prevent duplicate webhook processing
    lastWebhookStatusId: { type: Number, default: null },
    lastWebhookAt: { type: Date, default: null },

    // Status history for audit trail
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        message: String,
        source: {
          type: String,
          enum: ['vendor', 'system', 'webhook', 'admin'],
          default: 'system',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index for looking up shipments by order + tenant
shipmentSchema.index({ order: 1, tenant: 1 }, { unique: true });

module.exports = mongoose.model('Shipment', shipmentSchema);
