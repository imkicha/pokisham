/**
 * Shiprocket API Service
 *
 * Centralized service for all Shiprocket API interactions.
 * Handles authentication with automatic token refresh,
 * pickup location management, order creation, courier selection,
 * AWB assignment, and pickup scheduling.
 *
 * Uses a single Shiprocket account — each vendor (tenant) is
 * registered as a separate pickup location.
 */

const https = require('https');

const SHIPROCKET_BASE = 'https://apiv2.shiprocket.in/v1/external';

// ─── In-memory token cache ───────────────────────────────────────────────────
// Shiprocket tokens are valid for ~10 days. We cache the token and its
// expiry timestamp so we only re-authenticate when necessary.
let cachedToken = null;
let tokenExpiresAt = 0; // epoch ms

/**
 * Make an HTTPS request to the Shiprocket API.
 * Returns a parsed JSON body. Throws on non-2xx responses.
 */
function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SHIPROCKET_BASE}${path}`);
    const postData = body ? JSON.stringify(body) : null;

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);

          // Shiprocket returns 200 for most responses, but sometimes
          // embeds errors inside the JSON body
          if (res.statusCode >= 400) {
            const err = new Error(
              parsed.message || parsed.error || `Shiprocket API error (${res.statusCode})`
            );
            err.statusCode = res.statusCode;
            err.response = parsed;
            return reject(err);
          }

          resolve(parsed);
        } catch (parseErr) {
          reject(new Error(`Failed to parse Shiprocket response: ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Shiprocket API request timed out'));
    });

    if (postData) req.write(postData);
    req.end();
  });
}

// ─── Authentication ──────────────────────────────────────────────────────────

/**
 * Get a valid Shiprocket auth token. Uses cached value when possible,
 * otherwise authenticates with email/password from environment variables.
 */
async function getToken() {
  // Return cached token if still valid (with 1-hour safety margin)
  if (cachedToken && Date.now() < tokenExpiresAt - 3600000) {
    return cachedToken;
  }

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Shiprocket credentials not configured. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in .env'
    );
  }

  const data = await request('POST', '/auth/login', { email, password });

  if (!data.token) {
    throw new Error('Shiprocket authentication failed — no token returned');
  }

  cachedToken = data.token;
  // Shiprocket tokens are valid for 10 days; refresh after 9 days
  tokenExpiresAt = Date.now() + 9 * 24 * 60 * 60 * 1000;

  return cachedToken;
}

/**
 * Force-refresh the token (useful after a 401 response).
 */
async function refreshToken() {
  cachedToken = null;
  tokenExpiresAt = 0;
  return getToken();
}

/**
 * Wrapper that auto-retries once on 401 (token expired).
 */
async function authenticatedRequest(method, path, body) {
  let token = await getToken();

  try {
    return await request(method, path, body, token);
  } catch (err) {
    if (err.statusCode === 401) {
      // Token expired mid-session — refresh and retry once
      token = await refreshToken();
      return request(method, path, body, token);
    }
    throw err;
  }
}

// ─── Indian State Helpers ────────────────────────────────────────────────────

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

// Map common abbreviations to full state names
const STATE_ABBREVIATION_MAP = {
  'AP': 'Andhra Pradesh', 'AR': 'Arunachal Pradesh', 'AS': 'Assam',
  'BR': 'Bihar', 'CG': 'Chhattisgarh', 'GA': 'Goa', 'GJ': 'Gujarat',
  'HR': 'Haryana', 'HP': 'Himachal Pradesh', 'JH': 'Jharkhand',
  'KA': 'Karnataka', 'KL': 'Kerala', 'MP': 'Madhya Pradesh',
  'MH': 'Maharashtra', 'MN': 'Manipur', 'ML': 'Meghalaya', 'MZ': 'Mizoram',
  'NL': 'Nagaland', 'OD': 'Odisha', 'OR': 'Odisha', 'PB': 'Punjab',
  'RJ': 'Rajasthan', 'SK': 'Sikkim', 'TN': 'Tamil Nadu', 'TS': 'Telangana',
  'TR': 'Tripura', 'UP': 'Uttar Pradesh', 'UK': 'Uttarakhand',
  'UA': 'Uttarakhand', 'WB': 'West Bengal', 'AN': 'Andaman and Nicobar Islands',
  'CH': 'Chandigarh', 'DN': 'Dadra and Nagar Haveli and Daman and Diu',
  'DD': 'Dadra and Nagar Haveli and Daman and Diu', 'DL': 'Delhi',
  'JK': 'Jammu and Kashmir', 'LA': 'Ladakh', 'LD': 'Lakshadweep',
  'PY': 'Puducherry',
};

/**
 * Resolve a state value to its full name.
 * Accepts abbreviations (TN, KA) or full names.
 * Returns null if unrecognised.
 */
function resolveStateName(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();

  // Check abbreviation map first (case-insensitive)
  const fromAbbr = STATE_ABBREVIATION_MAP[trimmed.toUpperCase()];
  if (fromAbbr) return fromAbbr;

  // Check if it's already a valid full name (case-insensitive match)
  const match = INDIAN_STATES.find(
    (s) => s.toLowerCase() === trimmed.toLowerCase()
  );
  return match || null;
}

// ─── Pickup Locations ────────────────────────────────────────────────────────

/**
 * Validate that a tenant has all fields required for Shiprocket pickup creation.
 * Returns { valid: true } or { valid: false, missing: [...] }.
 */
function validatePickupFields(tenant) {
  const missing = [];
  const addr = tenant.address || {};

  if (!addr.street || addr.street.trim().length < 10) {
    missing.push('address.street (min 10 characters)');
  }
  if (!addr.city || !addr.city.trim()) {
    missing.push('address.city');
  }
  if (!addr.state || !addr.state.trim()) {
    missing.push('address.state');
  } else if (!resolveStateName(addr.state)) {
    missing.push('address.state (must be a valid Indian state name, not abbreviation)');
  }
  if (!addr.pincode || !String(addr.pincode).trim()) {
    missing.push('address.pincode');
  }
  if (!tenant.phone || !tenant.phone.trim()) {
    missing.push('phone');
  }

  return missing.length ? { valid: false, missing } : { valid: true };
}

/**
 * Create a pickup location in Shiprocket for a vendor/tenant.
 *
 * @param {Object} tenant - The Tenant document from MongoDB
 * @returns {Object} Shiprocket API response with pickup_location name
 * @throws {Error} If validation fails or Shiprocket API rejects the request
 */
async function createPickupLocation(tenant) {
  // Validate required fields
  const validation = validatePickupFields(tenant);
  if (!validation.valid) {
    throw new Error(
      `Missing required fields for pickup location: ${validation.missing.join(', ')}`
    );
  }

  // Deterministic pickup name: "tenant_<mongoId>"
  const pickupName = `tenant_${tenant._id}`;

  // Resolve state to full name (never send abbreviation)
  const fullState = resolveStateName(tenant.address.state);

  const payload = {
    pickup_location: pickupName,
    name: tenant.ownerName.trim(),
    email: tenant.email.trim(),
    phone: tenant.phone.trim(),
    address: tenant.address.street.trim(),
    address_2: '',
    city: tenant.address.city.trim(),
    state: fullState,
    country: 'India',
    pin_code: String(tenant.address.pincode).trim(),
  };

  try {
    const result = await authenticatedRequest('POST', '/settings/company/addpickup', payload);
    return { ...result, pickup_location: pickupName };
  } catch (err) {
    // Shiprocket returns 403 for duplicate or invalid pickup locations
    if (err.statusCode === 403) {
      const detail = err.response?.message || err.response?.error || err.message;
      throw new Error(`Shiprocket rejected pickup location (403): ${detail}`);
    }
    throw err;
  }
}

// ─── Courier Serviceability ──────────────────────────────────────────────────

/**
 * Check courier serviceability between two pincodes.
 * Returns the best courier (cheapest with reasonable delivery time).
 *
 * @param {Object} params
 * @param {string} params.pickupPincode  - Vendor's pincode
 * @param {string} params.deliveryPincode - Customer's pincode
 * @param {number} params.weight         - Package weight in kg
 * @param {number} [params.codAmount]    - COD amount (0 for prepaid)
 * @returns {Object|null} Best courier or null if none available
 */
async function checkServiceability({ pickupPincode, deliveryPincode, weight, codAmount = 0 }) {
  const isCod = codAmount > 0 ? 1 : 0;

  const query = new URLSearchParams({
    pickup_postcode: pickupPincode,
    delivery_postcode: deliveryPincode,
    weight: String(weight),
    cod: String(isCod),
  });

  const result = await authenticatedRequest(
    'GET',
    `/courier/serviceability/?${query.toString()}`,
    null
  );

  const couriers = result?.data?.available_courier_companies;
  if (!couriers || couriers.length === 0) {
    return null;
  }

  // Sort by estimated delivery days (ascending), then by freight charge
  couriers.sort((a, b) => {
    const daysDiff = (a.estimated_delivery_days || 99) - (b.estimated_delivery_days || 99);
    if (daysDiff !== 0) return daysDiff;
    return (a.freight_charge || 0) - (b.freight_charge || 0);
  });

  return couriers[0];
}

// ─── Order & Shipment Creation ───────────────────────────────────────────────

/**
 * Create an order in Shiprocket.
 *
 * @param {Object} params
 * @param {Object} params.order       - The MongoDB Order document
 * @param {Object} params.tenant      - The Tenant document (vendor)
 * @param {Array}  params.items       - Order items belonging to this vendor
 * @param {string} params.pickupLocation - Pickup location name in Shiprocket
 * @returns {Object} Shiprocket order creation response
 */
async function createShiprocketOrder({ order, tenant, items, pickupLocation }) {
  // Calculate subtotal for this vendor's items
  const subTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const payload = {
    order_id: `${order.orderNumber}_${tenant._id}`, // unique per vendor split
    order_date: new Date(order.createdAt).toISOString().split('T')[0] + ' ' +
                new Date(order.createdAt).toTimeString().split(' ')[0],
    pickup_location: pickupLocation,
    billing_customer_name: order.shippingAddress.name.split(' ')[0],
    billing_last_name: order.shippingAddress.name.split(' ').slice(1).join(' ') || '',
    billing_address: order.shippingAddress.addressLine1,
    billing_address_2: order.shippingAddress.addressLine2 || '',
    billing_city: order.shippingAddress.city,
    billing_pincode: order.shippingAddress.pincode,
    billing_state: order.shippingAddress.state,
    billing_country: 'India',
    billing_email: '', // Will be populated from user if available
    billing_phone: order.shippingAddress.phone,
    shipping_is_billing: true,
    order_items: items.map((item) => ({
      name: item.name,
      sku: `${item.product}_${item.variant?.size || 'default'}`,
      units: item.quantity,
      selling_price: item.price,
    })),
    payment_method: order.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
    sub_total: subTotal,
    length: 20, // Default dimensions in cm — update if products have actual dimensions
    breadth: 15,
    height: 10,
    weight: 0.5, // Default weight in kg
  };

  return authenticatedRequest('POST', '/orders/create/adhoc', payload);
}

/**
 * Assign an AWB (tracking number) to a Shiprocket shipment.
 *
 * @param {string} shipmentId     - Shiprocket shipment ID
 * @param {number} courierCompanyId - Selected courier company ID
 * @returns {Object} AWB assignment response
 */
async function assignAWB(shipmentId, courierCompanyId) {
  return authenticatedRequest('POST', '/courier/assign/awb', {
    shipment_id: shipmentId,
    courier_id: courierCompanyId,
  });
}

/**
 * Schedule a pickup for a shipment.
 *
 * @param {string} shipmentId - Shiprocket shipment ID
 * @returns {Object} Pickup scheduling response
 */
async function schedulePickup(shipmentId) {
  return authenticatedRequest('POST', '/courier/generate/pickup', {
    shipment_id: [shipmentId],
  });
}

/**
 * Track a shipment by AWB number.
 *
 * @param {string} awb - AWB tracking number
 * @returns {Object} Tracking details
 */
async function trackShipment(awb) {
  return authenticatedRequest('GET', `/courier/track/awb/${awb}`, null);
}

/**
 * Cancel a Shiprocket order.
 *
 * @param {Array<string>} orderIds - Shiprocket order IDs to cancel
 * @returns {Object} Cancellation response
 */
async function cancelOrder(orderIds) {
  return authenticatedRequest('POST', '/orders/cancel', {
    ids: orderIds,
  });
}

module.exports = {
  getToken,
  refreshToken,
  createPickupLocation,
  validatePickupFields,
  resolveStateName,
  checkServiceability,
  createShiprocketOrder,
  assignAWB,
  schedulePickup,
  trackShipment,
  cancelOrder,
};
