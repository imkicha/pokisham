/**
 * Shipping Controller
 *
 * Handles the entire Shiprocket shipping lifecycle:
 *
 * 1. Vendor marks order "Ready to Ship"
 * 2. System checks courier serviceability & selects best courier
 * 3. Creates Shiprocket order with vendor's pickup location
 * 4. Assigns AWB (tracking number)
 * 5. Schedules pickup
 * 6. Webhook receives status updates from Shiprocket
 *
 * Multi-vendor orders are split into individual Shipment documents,
 * each processed independently through the Shiprocket pipeline.
 */

const Order = require('../models/Order');
const Shipment = require('../models/Shipment');
const Tenant = require('../models/Tenant');
const shiprocket = require('../services/shiprocketService');

// ─── Helper: Map Shiprocket status_id → our internal vendorStatus ───────────
// Reference: https://apidocs.shiprocket.in/#702f7ee3-3528-4a1d-b5be-b9b4a8b3b8e2
//
// Shiprocket status IDs are NOT always consistent. The same logical state
// (e.g. "Delivered") may arrive as different IDs depending on courier.
// We map by ID first, then fall back to current_status text matching.
const SHIPROCKET_STATUS_MAP = {
  1:  'awb_assigned',       // AWB Assigned
  2:  'pickup_scheduled',   // Pickup Scheduled / Pickup Generated
  3:  'picked_up',          // Pickup Queued
  4:  'cancelled',          // Cancelled
  5:  'in_transit',         // Shipped
  6:  'delivered',          // Delivered
  7:  'rto',               // RTO Initiated (not "Delivered" — see note below)
  8:  'rto',               // RTO Delivered
  9:  'out_for_delivery',  // Out For Delivery
  10: 'in_transit',         // In Transit (alternative)
  12: 'cancelled',          // Lost
  14: 'rto',               // RTO Acknowledged
  15: 'rto',               // RTO In Transit
  16: 'rto',               // RTO Out For Delivery
  17: 'picked_up',          // Picked Up
  18: 'in_transit',         // In Transit
  19: 'out_for_delivery',  // Out For Delivery
  20: 'in_transit',         // Reached at Destination Hub
  21: 'in_transit',         // Misrouted
  38: 'in_transit',         // Reached Warehouse
  39: 'in_transit',         // In Flight
  40: 'pickup_scheduled',   // Pickup Rescheduled
  41: 'cancelled',          // Pickup Error
  42: 'rto',               // RTO NDR
  43: 'out_for_delivery',  // Out for Delivery — NDR attempt
};

// Fallback: map current_status text → vendorStatus (case-insensitive)
const SHIPROCKET_TEXT_MAP = {
  'delivered':          'delivered',
  'in transit':         'in_transit',
  'shipped':            'in_transit',
  'out for delivery':   'out_for_delivery',
  'picked up':          'picked_up',
  'pickup scheduled':   'pickup_scheduled',
  'pickup generated':   'pickup_scheduled',
  'cancelled':          'cancelled',
  'rto initiated':      'rto',
  'rto delivered':      'rto',
  'rto in transit':     'rto',
  'awb assigned':       'awb_assigned',
};

function mapShiprocketStatus(statusId, statusText) {
  const num = parseInt(statusId, 10);
  const idResult = (!isNaN(num) && SHIPROCKET_STATUS_MAP[num]) ? SHIPROCKET_STATUS_MAP[num] : null;

  // Text-based mapping (more reliable — Shiprocket's IDs can be inconsistent)
  let textResult = null;
  if (statusText) {
    const key = statusText.toLowerCase().trim();
    textResult = SHIPROCKET_TEXT_MAP[key] || null;
    if (!textResult) {
      // Partial match (e.g., "RTO In Transit" contains "rto in transit")
      for (const [pattern, status] of Object.entries(SHIPROCKET_TEXT_MAP)) {
        if (key.includes(pattern)) { textResult = status; break; }
      }
    }
  }

  // If both exist but DISAGREE, trust the text — Shiprocket's status IDs are
  // known to be inconsistent across couriers (e.g., ID 7 can mean "Delivered"
  // for some couriers but "RTO Initiated" per official docs).
  if (textResult && idResult && textResult !== idResult) {
    console.log(`[Shiprocket Webhook] Status conflict — ID ${num} -> "${idResult}", Text "${statusText}" -> "${textResult}". Using text.`);
    return textResult;
  }

  return textResult || idResult || null;
}

// Map our vendorStatus → the Order model's orderStatus enum
function mapToOrderStatus(vendorStatus) {
  const map = {
    pickup_scheduled: 'Shipped',
    picked_up: 'Shipped',
    in_transit: 'Shipped',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return map[vendorStatus] || null;
}

// Ordered list for preventing backward status transitions
const STATUS_ORDER = [
  'pending', 'accepted', 'packing', 'ready_to_ship', 'shipment_created',
  'awb_assigned', 'pickup_scheduled', 'picked_up', 'in_transit',
  'out_for_delivery', 'delivered',
];

// ─── 1. Mark Ready to Ship ──────────────────────────────────────────────────

/**
 * @desc    Vendor marks their shipment as "Ready to Ship"
 *          This triggers the full Shiprocket flow: create order → assign AWB → schedule pickup
 * @route   POST /api/shipping/:orderId/ready-to-ship
 * @access  Private (Tenant)
 */
exports.markReadyToShip = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { weight, length, breadth, height } = req.body; // Optional package dimensions

    const order = await Order.findById(orderId).populate('user', 'name email phone');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Determine the tenant — for tenant users, use their tenantId
    const tenantId = req.user.tenantId;
    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Only vendors can mark orders as ready to ship',
      });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    // Ensure vendor has a Shiprocket pickup location
    if (!tenant.shiprocket?.pickupLocation) {
      return res.status(400).json({
        success: false,
        message: 'Vendor pickup location not configured in Shiprocket. Contact admin.',
      });
    }

    // Find or create the Shipment document for this vendor + order
    let shipment = await Shipment.findOne({ order: orderId, tenant: tenantId });

    if (!shipment) {
      // Extract items belonging to this vendor
      const vendorItems = order.orderItems.filter(
        (item) => item.tenantId && item.tenantId.toString() === tenantId.toString()
      );

      if (vendorItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No items in this order belong to your vendor account',
        });
      }

      shipment = await Shipment.create({
        order: orderId,
        tenant: tenantId,
        items: vendorItems.map((item) => ({
          product: item.product,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          variant: item.variant,
          image: item.image,
        })),
        vendorStatus: 'pending',
        pickupLocation: tenant.shiprocket.pickupLocation,
        statusHistory: [
          { status: 'pending', message: 'Shipment created', source: 'system' },
        ],
      });
    }

    // Prevent duplicate processing
    if (['shipment_created', 'awb_assigned', 'pickup_scheduled', 'picked_up', 'in_transit', 'delivered'].includes(shipment.vendorStatus)) {
      return res.status(400).json({
        success: false,
        message: `Shipment already processed (status: ${shipment.vendorStatus})`,
      });
    }

    // ── Step 1: Check courier serviceability ──────────────────────────
    const bestCourier = await shiprocket.checkServiceability({
      pickupPincode: tenant.address?.pincode,
      deliveryPincode: order.shippingAddress.pincode,
      weight: weight || 0.5,
      codAmount: order.paymentMethod === 'COD' ? order.totalPrice : 0,
    });

    if (!bestCourier) {
      return res.status(400).json({
        success: false,
        message: `No courier available for delivery from ${tenant.address?.pincode} to ${order.shippingAddress.pincode}. Try a different shipping method.`,
      });
    }

    // ── Step 2: Create Shiprocket order ───────────────────────────────
    let srOrder;
    try {
      srOrder = await shiprocket.createShiprocketOrder({
        order,
        tenant,
        items: shipment.items,
        pickupLocation: tenant.shiprocket.pickupLocation,
      });
    } catch (err) {
      console.error('Shiprocket order creation failed:', err.message);

      // Handle specific Shiprocket errors
      if (err.response?.errors) {
        const errorMessages = Object.values(err.response.errors).flat().join(', ');
        return res.status(400).json({
          success: false,
          message: `Shiprocket error: ${errorMessages}`,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to create shipment in Shiprocket. Please try again.',
      });
    }

    const shiprocketOrderId = String(srOrder.order_id);
    const shiprocketShipmentId = String(srOrder.shipment_id);

    // Update shipment with Shiprocket details
    shipment.shiprocketOrderId = shiprocketOrderId;
    shipment.shipmentId = shiprocketShipmentId;
    shipment.vendorStatus = 'shipment_created';
    shipment.readyToShipAt = new Date();
    shipment.statusHistory.push({
      status: 'shipment_created',
      message: `Shiprocket order ${shiprocketOrderId} created`,
      source: 'system',
    });

    // ── Step 3: Assign AWB ────────────────────────────────────────────
    let awbResult;
    try {
      awbResult = await shiprocket.assignAWB(shiprocketShipmentId, bestCourier.courier_company_id);
    } catch (err) {
      console.error('AWB assignment failed:', err.message);
      // Save what we have so far — admin can retry AWB assignment later
      await shipment.save();
      return res.status(200).json({
        success: true,
        message: 'Shiprocket order created but AWB assignment failed. Admin can retry.',
        shipment,
        warning: 'AWB assignment failed — courier may not have slots available',
      });
    }

    const awbData = awbResult?.response?.data;
    shipment.awb = awbData?.awb_code || null;
    shipment.courierName = awbData?.courier_name || bestCourier.courier_name;
    shipment.courierCompanyId = bestCourier.courier_company_id;
    shipment.shippingCharge = bestCourier.freight_charge || 0;
    shipment.vendorStatus = 'awb_assigned';
    shipment.statusHistory.push({
      status: 'awb_assigned',
      message: `AWB ${shipment.awb} assigned via ${shipment.courierName}`,
      source: 'system',
    });

    // ── Step 4: Schedule Pickup ───────────────────────────────────────
    try {
      const pickupResult = await shiprocket.schedulePickup(shiprocketShipmentId);
      shipment.vendorStatus = 'pickup_scheduled';
      shipment.pickupScheduledDate = pickupResult?.response?.pickup_scheduled_date || new Date();
      shipment.statusHistory.push({
        status: 'pickup_scheduled',
        message: 'Pickup scheduled with courier',
        source: 'system',
      });
    } catch (err) {
      console.error('Pickup scheduling failed:', err.message);
      // AWB is assigned — pickup can be retried
      shipment.statusHistory.push({
        status: 'awb_assigned',
        message: 'Pickup scheduling failed — can be retried',
        source: 'system',
      });
    }

    await shipment.save();

    // Update parent order's shipping fields (for single-vendor or as latest status)
    order.shipping = {
      shiprocketOrderId: shipment.shiprocketOrderId,
      shipmentId: shipment.shipmentId,
      awb: shipment.awb,
      courierName: shipment.courierName,
      courierCompanyId: shipment.courierCompanyId,
      shiprocketStatus: shipment.vendorStatus,
      pickupScheduledDate: shipment.pickupScheduledDate,
      readyToShip: true,
      readyToShipAt: shipment.readyToShipAt,
    };

    // Move order status to "Shipped" when pickup is scheduled
    if (shipment.vendorStatus === 'pickup_scheduled' && order.orderStatus !== 'Shipped') {
      order.orderStatus = 'Shipped';
      order.statusHistory.push({
        status: 'Shipped',
        message: `Shipment ready — AWB: ${shipment.awb}, Courier: ${shipment.courierName}`,
      });
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Shipment created successfully',
      shipment: {
        _id: shipment._id,
        vendorStatus: shipment.vendorStatus,
        shiprocketOrderId: shipment.shiprocketOrderId,
        awb: shipment.awb,
        courierName: shipment.courierName,
        pickupScheduledDate: shipment.pickupScheduledDate,
        shippingCharge: shipment.shippingCharge,
      },
    });
  } catch (error) {
    console.error('markReadyToShip error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process shipment',
    });
  }
};

// ─── 2. Check Serviceability ────────────────────────────────────────────────

/**
 * @desc    Check if courier service is available between two pincodes
 * @route   POST /api/shipping/check-serviceability
 * @access  Private (Admin/Tenant)
 */
exports.checkServiceability = async (req, res) => {
  try {
    const { pickupPincode, deliveryPincode, weight, codAmount } = req.body;

    if (!pickupPincode || !deliveryPincode) {
      return res.status(400).json({
        success: false,
        message: 'pickupPincode and deliveryPincode are required',
      });
    }

    // Validate pincode format (6-digit Indian pincode)
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(pickupPincode) || !pincodeRegex.test(deliveryPincode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pincode format. Must be 6 digits.',
      });
    }

    const courier = await shiprocket.checkServiceability({
      pickupPincode,
      deliveryPincode,
      weight: weight || 0.5,
      codAmount: codAmount || 0,
    });

    if (!courier) {
      return res.status(200).json({
        success: true,
        available: false,
        message: 'No courier service available for this route',
      });
    }

    res.status(200).json({
      success: true,
      available: true,
      courier: {
        id: courier.courier_company_id,
        name: courier.courier_name,
        estimatedDays: courier.estimated_delivery_days,
        freightCharge: courier.freight_charge,
        codCharges: courier.cod_charges || 0,
        rating: courier.rating,
      },
    });
  } catch (error) {
    console.error('checkServiceability error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check serviceability',
    });
  }
};

// ─── 3. Get Shipment Details ────────────────────────────────────────────────

/**
 * @desc    Get shipment tracking details for an order
 * @route   GET /api/shipping/:orderId/track
 * @access  Private
 */
exports.getShipmentDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const shipments = await Shipment.find({ order: orderId })
      .populate('tenant', 'businessName ownerName phone')
      .sort({ createdAt: 1 });

    if (shipments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No shipments found for this order',
      });
    }

    // If AWB exists, fetch live tracking from Shiprocket
    const shipmentsWithTracking = await Promise.all(
      shipments.map(async (shipment) => {
        const shipmentObj = shipment.toObject();

        if (shipment.awb) {
          try {
            const tracking = await shiprocket.trackShipment(shipment.awb);
            shipmentObj.liveTracking = tracking?.tracking_data || null;
          } catch (err) {
            shipmentObj.liveTracking = null;
            shipmentObj.trackingError = 'Unable to fetch live tracking';
          }
        }

        return shipmentObj;
      })
    );

    res.status(200).json({
      success: true,
      count: shipmentsWithTracking.length,
      shipments: shipmentsWithTracking,
    });
  } catch (error) {
    console.error('getShipmentDetails error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch shipment details',
    });
  }
};

// ─── 4. Retry AWB / Pickup ──────────────────────────────────────────────────

/**
 * @desc    Retry AWB assignment or pickup scheduling for a failed shipment
 * @route   POST /api/shipping/:shipmentId/retry
 * @access  Private (Admin/Tenant)
 */
exports.retryShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.shipmentId);
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    const order = await Order.findById(shipment.order);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const tenant = await Tenant.findById(shipment.tenant);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // If no AWB yet, assign one
    if (!shipment.awb && shipment.shipmentId) {
      const bestCourier = await shiprocket.checkServiceability({
        pickupPincode: tenant.address?.pincode,
        deliveryPincode: order.shippingAddress.pincode,
        weight: 0.5,
        codAmount: order.paymentMethod === 'COD' ? order.totalPrice : 0,
      });

      if (!bestCourier) {
        return res.status(400).json({
          success: false,
          message: 'No courier available for this route',
        });
      }

      const awbResult = await shiprocket.assignAWB(
        shipment.shipmentId,
        bestCourier.courier_company_id
      );
      const awbData = awbResult?.response?.data;
      shipment.awb = awbData?.awb_code || null;
      shipment.courierName = awbData?.courier_name || bestCourier.courier_name;
      shipment.courierCompanyId = bestCourier.courier_company_id;
      shipment.vendorStatus = 'awb_assigned';
      shipment.statusHistory.push({
        status: 'awb_assigned',
        message: `AWB ${shipment.awb} assigned (retry)`,
        source: 'admin',
      });
    }

    // If AWB assigned but pickup not scheduled, schedule it
    if (shipment.awb && shipment.vendorStatus === 'awb_assigned') {
      const pickupResult = await shiprocket.schedulePickup(shipment.shipmentId);
      shipment.vendorStatus = 'pickup_scheduled';
      shipment.pickupScheduledDate = pickupResult?.response?.pickup_scheduled_date || new Date();
      shipment.statusHistory.push({
        status: 'pickup_scheduled',
        message: 'Pickup scheduled (retry)',
        source: 'admin',
      });
    }

    await shipment.save();

    // Sync back to order
    order.shipping.awb = shipment.awb;
    order.shipping.courierName = shipment.courierName;
    order.shipping.shiprocketStatus = shipment.vendorStatus;
    order.shipping.pickupScheduledDate = shipment.pickupScheduledDate;
    await order.save();

    res.status(200).json({ success: true, shipment });
  } catch (error) {
    console.error('retryShipment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Retry failed',
    });
  }
};

// ─── 5. Cancel Shipment ─────────────────────────────────────────────────────

/**
 * @desc    Cancel a Shiprocket shipment
 * @route   POST /api/shipping/:shipmentId/cancel
 * @access  Private (Admin)
 */
exports.cancelShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.shipmentId);
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    // Can't cancel if already picked up or delivered
    if (['picked_up', 'in_transit', 'out_for_delivery', 'delivered'].includes(shipment.vendorStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel shipment with status: ${shipment.vendorStatus}`,
      });
    }

    // Cancel in Shiprocket if order was created there
    if (shipment.shiprocketOrderId) {
      try {
        await shiprocket.cancelOrder([shipment.shiprocketOrderId]);
      } catch (err) {
        console.error('Shiprocket cancellation failed:', err.message);
        // Continue with local cancellation even if Shiprocket fails
      }
    }

    shipment.vendorStatus = 'cancelled';
    shipment.cancelledAt = new Date();
    shipment.statusHistory.push({
      status: 'cancelled',
      message: req.body.reason || 'Shipment cancelled',
      source: req.user.role === 'tenant' ? 'vendor' : 'admin',
    });

    await shipment.save();

    res.status(200).json({ success: true, message: 'Shipment cancelled', shipment });
  } catch (error) {
    console.error('cancelShipment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel shipment',
    });
  }
};

// ─── 6. Shiprocket Webhook ──────────────────────────────────────────────────

/**
 * @desc    Receive status updates from Shiprocket via webhook
 * @route   POST /api/shiprocket/webhook
 * @access  Public (no auth, no CORS, no rate limit)
 *
 * CRITICAL DESIGN DECISIONS:
 * 1. Route registered in server.js BEFORE all middleware (CORS, helmet,
 *    rate limiter) so Shiprocket's servers are never blocked.
 * 2. ALWAYS returns 200 synchronously — Shiprocket retries on non-200
 *    and eventually disables the webhook.
 * 3. All DB work runs in a fire-and-forget async function after the
 *    response is sent.
 * 4. Empty/test payloads (Shiprocket validation pings) return 200 too.
 * 5. Idempotency: duplicate status_id for the same AWB is skipped.
 * 6. Optional x-api-key header validation when SHIPROCKET_WEBHOOK_SECRET
 *    is set in .env.
 *
 * Real Shiprocket payload example:
 * {
 *   "awb": 59629792084,           // NOTE: can be number or string
 *   "current_status": "Delivered",
 *   "current_status_id": 7,
 *   "shipment_status": "Delivered",
 *   "shipment_status_id": 7,
 *   "order_id": "13905312",
 *   "current_timestamp": "2021-07-02 16:41:59",
 *   "etd": "2021-07-02 16:41:59",
 *   "courier_name": "Delhivery",
 *   "channel_order_id": "PK260301..._<tenantId>",
 *   "scans": [...]
 * }
 */
exports.shiprocketWebhook = (req, res) => {
  // ── 1. ALWAYS return 200 immediately ────────────────────────────────────
  res.status(200).json({ success: true });

  // ── 2. Optional webhook secret validation ───────────────────────────────
  const secret = process.env.SHIPROCKET_WEBHOOK_SECRET;
  if (secret) {
    const headerKey = req.headers['x-api-key'] || req.headers['x-webhook-secret'];
    if (headerKey !== secret) {
      console.warn('[Shiprocket Webhook] Invalid secret from IP:', req.ip);
      return; // silently drop — already sent 200
    }
  }

  // ── 3. Debug log (safe to keep in production — it's one line per event) ─
  console.log('[Shiprocket Webhook] POST received:', {
    ip: req.ip,
    contentType: req.headers['content-type'],
    awb: req.body?.awb || 'none',
    status: req.body?.current_status || 'none',
    statusId: req.body?.current_status_id ?? 'none',
  });

  // ── 4. Fire-and-forget async processing ─────────────────────────────────
  processWebhookEvent(req.body).catch((err) => {
    console.error('[Shiprocket Webhook] Processing error:', err.message || err);
  });
};

/**
 * Background processor — runs after 200 is already sent to Shiprocket.
 * Wrapped in try/catch so no unhandled promise rejections can leak.
 */
async function processWebhookEvent(payload) {
  // ── Handle empty/test payload (Shiprocket validation ping) ────────────
  if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
    console.log('[Shiprocket Webhook] Validation ping — empty payload accepted');
    return;
  }

  // ── Extract fields from Shiprocket payload ────────────────────────────
  // AWB can arrive as number (59629792084) or string — normalize to string
  const awb = payload.awb != null ? String(payload.awb) : null;
  const currentStatus = payload.current_status || payload.shipment_status || null;
  const statusId = payload.current_status_id ?? payload.shipment_status_id ?? null;
  const courierName = payload.courier_name || null;
  const etd = payload.etd || null;
  const srTimestamp = payload.current_timestamp || null;

  if (!awb) {
    console.warn('[Shiprocket Webhook] No AWB in payload:', JSON.stringify(payload).slice(0, 300));
    return;
  }

  console.log(`[Shiprocket Webhook] Processing — AWB: ${awb}, Status: "${currentStatus}" (ID: ${statusId}), Courier: ${courierName}`);

  // ── Find Shipment by AWB ──────────────────────────────────────────────
  const shipment = await Shipment.findOne({ awb });
  if (!shipment) {
    console.warn(`[Shiprocket Webhook] No shipment found for AWB: ${awb} — ignoring`);
    return;
  }

  // ── Map Shiprocket status to our internal vendorStatus ────────────────
  const newStatus = mapShiprocketStatus(statusId, currentStatus);
  if (!newStatus) {
    console.warn(`[Shiprocket Webhook] Unmapped — statusId: ${statusId}, text: "${currentStatus}" for AWB: ${awb}`);
    return;
  }

  // ── Idempotency: skip if we already processed this exact status_id ────
  const numericStatusId = parseInt(statusId, 10);
  if (!isNaN(numericStatusId) && shipment.lastWebhookStatusId === numericStatusId) {
    console.log(`[Shiprocket Webhook] Duplicate statusId ${numericStatusId} for AWB ${awb} — skipping`);
    return;
  }

  // ── Prevent backward status transitions ───────────────────────────────
  // Exception: cancelled/rto can override any status
  const currentIdx = STATUS_ORDER.indexOf(shipment.vendorStatus);
  const newIdx = STATUS_ORDER.indexOf(newStatus);

  if (newIdx >= 0 && currentIdx >= 0 && newIdx <= currentIdx && !['cancelled', 'rto'].includes(newStatus)) {
    console.log(`[Shiprocket Webhook] Backward skip: ${shipment.vendorStatus} -> ${newStatus} for AWB ${awb}`);
    return;
  }

  // ── Update Shipment document ──────────────────────────────────────────
  shipment.vendorStatus = newStatus;
  shipment.shiprocketStatus = currentStatus;
  shipment.lastWebhookStatusId = isNaN(numericStatusId) ? null : numericStatusId;
  shipment.lastWebhookAt = new Date();

  if (courierName) shipment.courierName = courierName;
  if (etd) shipment.deliveryEstimate = etd;

  // Set timestamps for key milestones
  switch (newStatus) {
    case 'picked_up':
      shipment.pickedUpAt = shipment.pickedUpAt || new Date();
      break;
    case 'delivered':
      shipment.deliveredAt = shipment.deliveredAt || new Date();
      break;
    case 'cancelled':
    case 'rto':
      shipment.cancelledAt = shipment.cancelledAt || new Date();
      break;
  }

  shipment.statusHistory.push({
    status: newStatus,
    timestamp: srTimestamp ? new Date(srTimestamp) : new Date(),
    message: `${currentStatus} (Shiprocket status_id: ${statusId})`,
    source: 'webhook',
  });

  await shipment.save();

  // ── Update parent Order ───────────────────────────────────────────────
  const order = await Order.findById(shipment.order);
  if (!order) {
    console.warn(`[Shiprocket Webhook] Parent order ${shipment.order} not found for shipment ${shipment._id}`);
    return;
  }

  const orderStatus = mapToOrderStatus(newStatus);
  if (!orderStatus) return; // no mapping = no order-level change needed

  // Update order-level shipping fields
  order.shipping.shiprocketStatus = newStatus;
  if (courierName) order.shipping.courierName = courierName;
  if (etd) order.shipping.deliveryEstimate = etd;

  // Only advance order status forward (don't overwrite "Delivered" with "Shipped")
  const orderStatusPriority = ['Pending', 'Accepted', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
  const currentOrderIdx = orderStatusPriority.indexOf(order.orderStatus);
  const newOrderIdx = orderStatusPriority.indexOf(orderStatus);

  if (newOrderIdx > currentOrderIdx || ['Cancelled'].includes(orderStatus)) {
    order.orderStatus = orderStatus;

    if (newStatus === 'delivered') {
      order.deliveredAt = order.deliveredAt || new Date();

      // Calculate commission on delivery
      if (order.tenantId) {
        const tenant = await Tenant.findById(order.tenantId);
        if (tenant) {
          order.platformCommission = Math.round((order.totalPrice * tenant.commissionRate) / 100 * 100) / 100;
          order.tenantEarnings = Math.round((order.totalPrice - order.platformCommission) * 100) / 100;
        }
      }
    }

    order.statusHistory.push({
      status: orderStatus,
      message: `${currentStatus} — AWB: ${awb}${courierName ? `, Courier: ${courierName}` : ''}`,
    });
  }

  await order.save();

  console.log(`[Shiprocket Webhook] Done — AWB: ${awb}, Shipment: ${shipment.vendorStatus}, Order: ${order.orderStatus}`);
}

// ─── 7. Get Vendor Shipments ────────────────────────────────────────────────

/**
 * @desc    Get all shipments for the logged-in vendor
 * @route   GET /api/shipping/my-shipments
 * @access  Private (Tenant)
 */
exports.getVendorShipments = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Only vendors can access shipments',
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { tenant: tenantId };
    if (req.query.status) {
      filter.vendorStatus = req.query.status;
    }

    const [shipments, total] = await Promise.all([
      Shipment.find(filter)
        .populate('order', 'orderNumber shippingAddress totalPrice paymentMethod orderStatus')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Shipment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: shipments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      shipments,
    });
  } catch (error) {
    console.error('getVendorShipments error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch shipments',
    });
  }
};
