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

// ─── Helper: Map Shiprocket status to our internal vendorStatus ─────────────
function mapShiprocketStatus(srStatus) {
  const statusNum = parseInt(srStatus, 10);
  const map = {
    1: 'awb_assigned',       // AWB Assigned
    2: 'pickup_scheduled',   // Pickup Scheduled
    3: 'picked_up',          // Pickup Queued (treated as picked up)
    4: 'cancelled',          // Cancelled
    5: 'in_transit',         // Shipped / In Transit
    6: 'delivered',          // Delivered
    7: 'rto',               // RTO Initiated
    8: 'rto',               // RTO Delivered
    9: 'out_for_delivery',  // Out For Delivery
    17: 'picked_up',        // Picked Up
    18: 'in_transit',       // In Transit
    19: 'out_for_delivery', // Out For Delivery
    20: 'in_transit',       // In Transit (Reached at Destination Hub)
    38: 'in_transit',       // In Transit (Reached Warehouse)
  };
  return map[statusNum] || null;
}

// Map our vendorStatus to the Order model's orderStatus
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
 * CRITICAL: This route is registered in server.js BEFORE all middleware
 * (CORS, helmet, rate limiter, etc.) so Shiprocket's servers can reach it.
 *
 * Shiprocket sends a POST when shipment status changes. During webhook
 * setup, Shiprocket sends a validation ping (empty or test body) — we
 * must return 200 for that too.
 *
 * Webhook payload format (real event):
 * {
 *   "awb": "123456789",
 *   "current_status": "Delivered",
 *   "current_status_id": 7,
 *   "shipment_id": "...",
 *   "order_id": "...",
 *   "etd": "2024-01-15 18:00",
 *   "scans": [...]
 * }
 */
exports.shiprocketWebhook = (req, res) => {
  // ALWAYS return 200 immediately — Shiprocket expects a fast response.
  // If we delay or return non-200, Shiprocket marks the webhook as failed.
  res.status(200).json({ success: true });

  // Log every hit for debugging (remove in production once stable)
  console.log('[Shiprocket Webhook] Hit received:', {
    method: req.method,
    contentType: req.headers['content-type'],
    bodyKeys: req.body ? Object.keys(req.body) : 'no body',
    ip: req.ip,
  });

  // Process the event asynchronously (after response is sent)
  processWebhookEvent(req.body).catch((err) => {
    console.error('[Shiprocket Webhook] Background processing error:', err);
  });
};

/**
 * Async background processor for webhook events.
 * Separated from the handler so the 200 response is never delayed.
 */
async function processWebhookEvent(payload) {
  // Handle empty body (Shiprocket validation ping)
  if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
    console.log('[Shiprocket Webhook] Empty/test payload — validation ping accepted');
    return;
  }

  const awb = payload.awb;
  if (!awb) {
    console.warn('[Shiprocket Webhook] Payload without AWB:', JSON.stringify(payload).slice(0, 300));
    return;
  }

  console.log(`[Shiprocket Webhook] AWB: ${awb}, Status: ${payload.current_status} (ID: ${payload.current_status_id})`);

  // Find our shipment by AWB
  const shipment = await Shipment.findOne({ awb: String(awb) });
  if (!shipment) {
    console.warn(`[Shiprocket Webhook] No shipment found for AWB: ${awb}`);
    return;
  }

  // Map Shiprocket status to our internal status
  const newStatus = mapShiprocketStatus(payload.current_status_id);
  if (!newStatus) {
    console.log(`[Shiprocket Webhook] Unmapped status ID: ${payload.current_status_id} for AWB: ${awb}`);
    return;
  }

  // Don't go backwards in status (e.g., from delivered back to in_transit)
  const statusOrder = [
    'pending', 'accepted', 'packing', 'ready_to_ship', 'shipment_created',
    'awb_assigned', 'pickup_scheduled', 'picked_up', 'in_transit',
    'out_for_delivery', 'delivered',
  ];
  const currentIdx = statusOrder.indexOf(shipment.vendorStatus);
  const newIdx = statusOrder.indexOf(newStatus);

  if (newIdx <= currentIdx && !['cancelled', 'rto'].includes(newStatus)) {
    console.log(`[Shiprocket Webhook] Skipping backward status: ${shipment.vendorStatus} -> ${newStatus}`);
    return;
  }

  // Update shipment
  shipment.vendorStatus = newStatus;
  shipment.shiprocketStatus = payload.current_status;
  shipment.deliveryEstimate = payload.etd || shipment.deliveryEstimate;

  if (newStatus === 'picked_up') {
    shipment.pickedUpAt = new Date();
  } else if (newStatus === 'delivered') {
    shipment.deliveredAt = new Date();
  }

  shipment.statusHistory.push({
    status: newStatus,
    message: `${payload.current_status} (via Shiprocket webhook)`,
    source: 'webhook',
  });

  await shipment.save();

  // Update the parent Order status
  const order = await Order.findById(shipment.order);
  if (order) {
    const orderStatus = mapToOrderStatus(newStatus);
    if (orderStatus) {
      order.orderStatus = orderStatus;
      order.shipping.shiprocketStatus = newStatus;

      if (newStatus === 'delivered') {
        order.deliveredAt = new Date();

        // Calculate commission on delivery (if assigned to a tenant)
        if (order.tenantId) {
          const tenant = await Tenant.findById(order.tenantId);
          if (tenant) {
            order.platformCommission = (order.totalPrice * tenant.commissionRate) / 100;
            order.tenantEarnings = order.totalPrice - order.platformCommission;
          }
        }
      }

      order.statusHistory.push({
        status: orderStatus,
        message: `${payload.current_status} — AWB: ${awb}`,
      });

      await order.save();
    }
  }

  console.log(`[Shiprocket Webhook] Updated shipment ${shipment._id} -> ${newStatus}`);
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
