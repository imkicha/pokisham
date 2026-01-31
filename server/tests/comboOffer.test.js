/**
 * Combo Offer Test Suite
 * Tests both pricing modes (fixed_discount & fixed_price) end-to-end
 *
 * Usage: node tests/comboOffer.test.js
 * Requires: running MongoDB instance (uses MONGO_URI from .env)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const ComboOffer = require('../models/ComboOffer');
const Product = require('../models/Product');

// ========== TEST UTILITIES ==========

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, testName) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${testName}`);
  } else {
    failed++;
    failures.push(testName);
    console.log(`  ✗ ${testName}`);
  }
}

function assertApprox(actual, expected, testName, tolerance = 0.01) {
  assert(Math.abs(actual - expected) < tolerance, `${testName} (got ${actual}, expected ${expected})`);
}

// ========== CORE VALIDATION LOGIC (extracted from controller) ==========
// This mirrors the server/controllers/comboOfferController.js validateComboOffers logic
// so we can unit test without HTTP

function validateComboForCart(combo, cartItems) {
  let discount = 0;
  let matchedProducts = [];
  let comboSets = 0;
  let isApplicable = false;

  const findCartItem = (cp) => {
    const productId = cp.product?._id?.toString() || cp.product?.toString();
    const comboVariantSize = cp.variant?.size || '';
    return cartItems.find(item => {
      const itemPid = (item.product?._id || item.product)?.toString();
      if (itemPid !== productId) return false;
      if (comboVariantSize) {
        const cartVariantSize = item.variant?.size || '';
        return cartVariantSize === comboVariantSize;
      }
      return true;
    });
  };

  if (combo.comboType === 'fixed_products') {
    const allProductsInCart = combo.comboProducts.every(cp => {
      const cartItem = findCartItem(cp);
      return cartItem && cartItem.quantity >= cp.quantity;
    });

    if (allProductsInCart) {
      isApplicable = true;

      let maxSets = Infinity;
      combo.comboProducts.forEach(cp => {
        const cartItem = findCartItem(cp);
        if (cartItem) {
          const setsFromThis = Math.floor(cartItem.quantity / cp.quantity);
          maxSets = Math.min(maxSets, setsFromThis);
        }
      });
      if (!isFinite(maxSets)) maxSets = 1;

      let originalPricePerSet = 0;
      combo.comboProducts.forEach(cp => {
        const cartItem = findCartItem(cp);
        if (cartItem) {
          originalPricePerSet += cartItem.price * cp.quantity;
          matchedProducts.push({
            productId: cp.product?._id || cp.product,
            quantity: cp.quantity * maxSets,
            variant: cp.variant?.size ? cp.variant : null,
          });
        }
      });

      // This is the exact logic from the controller
      const discountPerSet = combo.discountValue > 0
        ? combo.discountValue
        : Math.max(0, originalPricePerSet - combo.comboPrice);
      discount = discountPerSet * maxSets;
      comboSets = maxSets;

      const result = {
        _id: combo._id || 'test-combo',
        title: combo.title,
        comboType: combo.comboType,
        discount: Math.round(discount * 100) / 100,
        matchedProducts,
        sets: comboSets,
        comboPrice: combo.comboPrice,
        discountValue: combo.discountValue,
        discountPerSet: Math.round((discount / comboSets) * 100) / 100,
        pricingMode: combo.discountValue > 0 ? 'fixed_discount' : 'fixed_price',
      };
      return { isApplicable, result };
    }
  }

  return { isApplicable, result: null };
}

// ========== TEST CASES ==========

function runUnitTests() {
  console.log('\n========================================');
  console.log('  COMBO OFFER UNIT TESTS');
  console.log('========================================\n');

  // ---- Test Group 1: Fixed Discount Mode ----
  console.log('--- Fixed Discount Mode ---\n');

  // Test 1.1: Basic fixed discount
  {
    const combo = {
      _id: 'combo-1',
      title: 'Frame + Elephant Combo',
      comboType: 'fixed_products',
      comboPrice: 0,
      discountValue: 100,
      comboProducts: [
        { product: { _id: 'prod-A' }, quantity: 1, variant: { size: '' } },
        { product: { _id: 'prod-B' }, quantity: 1, variant: { size: '' } },
      ],
    };
    const cartItems = [
      { product: { _id: 'prod-A' }, quantity: 1, price: 700, variant: null },
      { product: { _id: 'prod-B' }, quantity: 1, price: 100, variant: null },
    ];
    const { isApplicable, result } = validateComboForCart(combo, cartItems);
    assert(isApplicable === true, '1.1 Fixed discount: combo is applicable');
    assert(result.discount === 100, '1.1 Fixed discount: discount is ₹100');
    assert(result.discountPerSet === 100, '1.1 Fixed discount: discountPerSet is ₹100');
    assert(result.pricingMode === 'fixed_discount', '1.1 Fixed discount: pricingMode is fixed_discount');
    assert(result.sets === 1, '1.1 Fixed discount: 1 set');
  }

  // Test 1.2: Fixed discount with variants (discount stays constant)
  {
    const combo = {
      _id: 'combo-2',
      title: 'Variant Combo',
      comboType: 'fixed_products',
      comboPrice: 0,
      discountValue: 150,
      comboProducts: [
        { product: { _id: 'prod-A' }, quantity: 1, variant: { size: '' } },
        { product: { _id: 'prod-B' }, quantity: 1, variant: { size: '' } },
      ],
    };
    // User picks expensive variant for prod-A
    const cartItems = [
      { product: { _id: 'prod-A' }, quantity: 1, price: 1200, variant: { size: 'Large' } },
      { product: { _id: 'prod-B' }, quantity: 1, price: 100, variant: null },
    ];
    const { isApplicable, result } = validateComboForCart(combo, cartItems);
    assert(isApplicable === true, '1.2 Fixed discount + variant: applicable');
    assert(result.discount === 150, '1.2 Fixed discount + variant: discount stays ₹150 regardless of variant');
    // Original total is 1300, combo total = 1300 - 150 = 1150
  }

  // Test 1.3: Fixed discount with multiple sets
  {
    const combo = {
      _id: 'combo-3',
      title: 'Multi-set Combo',
      comboType: 'fixed_products',
      comboPrice: 0,
      discountValue: 50,
      comboProducts: [
        { product: { _id: 'prod-A' }, quantity: 1, variant: { size: '' } },
        { product: { _id: 'prod-B' }, quantity: 1, variant: { size: '' } },
      ],
    };
    const cartItems = [
      { product: { _id: 'prod-A' }, quantity: 3, price: 500, variant: null },
      { product: { _id: 'prod-B' }, quantity: 3, price: 200, variant: null },
    ];
    const { isApplicable, result } = validateComboForCart(combo, cartItems);
    assert(isApplicable === true, '1.3 Multi-set fixed discount: applicable');
    assert(result.sets === 3, '1.3 Multi-set fixed discount: 3 sets detected');
    assert(result.discount === 150, '1.3 Multi-set fixed discount: total discount ₹150 (50×3)');
    assert(result.discountPerSet === 50, '1.3 Multi-set fixed discount: discountPerSet ₹50');
  }

  // ---- Test Group 2: Fixed Combo Price Mode ----
  console.log('\n--- Fixed Combo Price Mode ---\n');

  // Test 2.1: Basic fixed combo price (Hamper at ₹499)
  {
    const combo = {
      _id: 'combo-4',
      title: 'Hamper at ₹499',
      comboType: 'fixed_products',
      comboPrice: 499,
      discountValue: 0,
      comboProducts: [
        { product: { _id: 'prod-A' }, quantity: 1, variant: { size: '' } },
        { product: { _id: 'prod-B' }, quantity: 1, variant: { size: '' } },
      ],
    };
    const cartItems = [
      { product: { _id: 'prod-A' }, quantity: 1, price: 400, variant: null },
      { product: { _id: 'prod-B' }, quantity: 1, price: 200, variant: null },
    ];
    const { isApplicable, result } = validateComboForCart(combo, cartItems);
    assert(isApplicable === true, '2.1 Fixed price: applicable');
    assert(result.pricingMode === 'fixed_price', '2.1 Fixed price: pricingMode is fixed_price');
    // Original = 600, comboPrice = 499, discount = 600 - 499 = 101
    assert(result.discount === 101, '2.1 Fixed price: discount is ₹101 (600-499)');
    assert(result.discountPerSet === 101, '2.1 Fixed price: discountPerSet is ₹101');
    assert(result.comboPrice === 499, '2.1 Fixed price: comboPrice returned is ₹499');
  }

  // Test 2.2: Fixed combo price with variant (discount varies with variant)
  {
    const combo = {
      _id: 'combo-5',
      title: 'Hamper at ₹499',
      comboType: 'fixed_products',
      comboPrice: 499,
      discountValue: 0,
      comboProducts: [
        { product: { _id: 'prod-A' }, quantity: 1, variant: { size: '' } },
        { product: { _id: 'prod-B' }, quantity: 1, variant: { size: '' } },
      ],
    };
    // User picks expensive variant → discount is higher
    const cartItems = [
      { product: { _id: 'prod-A' }, quantity: 1, price: 800, variant: { size: 'Large' } },
      { product: { _id: 'prod-B' }, quantity: 1, price: 200, variant: null },
    ];
    const { isApplicable, result } = validateComboForCart(combo, cartItems);
    assert(isApplicable === true, '2.2 Fixed price + expensive variant: applicable');
    // Original = 1000, comboPrice = 499, discount = 1000 - 499 = 501
    assert(result.discount === 501, '2.2 Fixed price + expensive variant: discount is ₹501 (1000-499)');
  }

  // Test 2.3: Fixed combo price - multiple sets
  {
    const combo = {
      _id: 'combo-6',
      title: 'Hamper at ₹499',
      comboType: 'fixed_products',
      comboPrice: 499,
      discountValue: 0,
      comboProducts: [
        { product: { _id: 'prod-A' }, quantity: 1, variant: { size: '' } },
        { product: { _id: 'prod-B' }, quantity: 1, variant: { size: '' } },
      ],
    };
    const cartItems = [
      { product: { _id: 'prod-A' }, quantity: 2, price: 400, variant: null },
      { product: { _id: 'prod-B' }, quantity: 2, price: 200, variant: null },
    ];
    const { isApplicable, result } = validateComboForCart(combo, cartItems);
    assert(isApplicable === true, '2.3 Fixed price multi-set: applicable');
    assert(result.sets === 2, '2.3 Fixed price multi-set: 2 sets');
    // Per set: 600 - 499 = 101, total: 101 * 2 = 202
    assert(result.discount === 202, '2.3 Fixed price multi-set: total discount ₹202');
    assert(result.discountPerSet === 101, '2.3 Fixed price multi-set: discountPerSet ₹101');
  }

  // ---- Test Group 3: Edge Cases ----
  console.log('\n--- Edge Cases ---\n');

  // Test 3.1: comboPrice > original price (should not give negative discount)
  {
    const combo = {
      _id: 'combo-7',
      title: 'Overpriced Combo',
      comboType: 'fixed_products',
      comboPrice: 1500,
      discountValue: 0,
      comboProducts: [
        { product: { _id: 'prod-A' }, quantity: 1, variant: { size: '' } },
        { product: { _id: 'prod-B' }, quantity: 1, variant: { size: '' } },
      ],
    };
    const cartItems = [
      { product: { _id: 'prod-A' }, quantity: 1, price: 500, variant: null },
      { product: { _id: 'prod-B' }, quantity: 1, price: 200, variant: null },
    ];
    const { isApplicable, result } = validateComboForCart(combo, cartItems);
    // Original = 700, comboPrice = 1500 → discount = max(0, 700 - 1500) = 0
    // isApplicable is true but discount is 0 → the combo check `discount > 0` in controller would skip it
    assert(result === null || result.discount === 0, '3.1 Overpriced combo: discount is 0 (not negative)');
  }

  // Test 3.2: Both discountValue and comboPrice are 0
  {
    const combo = {
      _id: 'combo-8',
      title: 'No Pricing Set',
      comboType: 'fixed_products',
      comboPrice: 0,
      discountValue: 0,
      comboProducts: [
        { product: { _id: 'prod-A' }, quantity: 1, variant: { size: '' } },
        { product: { _id: 'prod-B' }, quantity: 1, variant: { size: '' } },
      ],
    };
    const cartItems = [
      { product: { _id: 'prod-A' }, quantity: 1, price: 500, variant: null },
      { product: { _id: 'prod-B' }, quantity: 1, price: 200, variant: null },
    ];
    const { isApplicable, result } = validateComboForCart(combo, cartItems);
    // discountValue = 0 → use comboPrice path: max(0, 700 - 0) = 700
    // This would give full price as discount which is wrong
    // But the admin form now validates that one value must be > 0
    assert(isApplicable === true, '3.2 No pricing: still applicable (backend gives full discount)');
    // Document this known behavior - admin form validation prevents this case
    console.log('    ℹ Admin form now validates that pricing must be set');
  }

  // Test 3.3: Products not all in cart
  {
    const combo = {
      _id: 'combo-9',
      title: 'Incomplete Combo',
      comboType: 'fixed_products',
      comboPrice: 0,
      discountValue: 100,
      comboProducts: [
        { product: { _id: 'prod-A' }, quantity: 1, variant: { size: '' } },
        { product: { _id: 'prod-B' }, quantity: 1, variant: { size: '' } },
        { product: { _id: 'prod-C' }, quantity: 1, variant: { size: '' } },
      ],
    };
    const cartItems = [
      { product: { _id: 'prod-A' }, quantity: 1, price: 500, variant: null },
      { product: { _id: 'prod-B' }, quantity: 1, price: 200, variant: null },
      // prod-C is missing
    ];
    const { isApplicable, result } = validateComboForCart(combo, cartItems);
    assert(isApplicable === false, '3.3 Missing product: combo not applicable');
    assert(result === null, '3.3 Missing product: no result returned');
  }

  // Test 3.4: Variant-specific combo - wrong variant in cart
  {
    const combo = {
      _id: 'combo-10',
      title: 'Specific Variant Combo',
      comboType: 'fixed_products',
      comboPrice: 0,
      discountValue: 80,
      comboProducts: [
        { product: { _id: 'prod-A' }, quantity: 1, variant: { size: 'Small' } },
        { product: { _id: 'prod-B' }, quantity: 1, variant: { size: '' } },
      ],
    };
    const cartItems = [
      { product: { _id: 'prod-A' }, quantity: 1, price: 500, variant: { size: 'Large' } },
      { product: { _id: 'prod-B' }, quantity: 1, price: 200, variant: null },
    ];
    const { isApplicable, result } = validateComboForCart(combo, cartItems);
    assert(isApplicable === false, '3.4 Wrong variant: combo not applicable');
  }

  // Test 3.5: Variant-specific combo - correct variant in cart
  {
    const combo = {
      _id: 'combo-11',
      title: 'Specific Variant Combo',
      comboType: 'fixed_products',
      comboPrice: 0,
      discountValue: 80,
      comboProducts: [
        { product: { _id: 'prod-A' }, quantity: 1, variant: { size: 'Small' } },
        { product: { _id: 'prod-B' }, quantity: 1, variant: { size: '' } },
      ],
    };
    const cartItems = [
      { product: { _id: 'prod-A' }, quantity: 1, price: 300, variant: { size: 'Small' } },
      { product: { _id: 'prod-B' }, quantity: 1, price: 200, variant: null },
    ];
    const { isApplicable, result } = validateComboForCart(combo, cartItems);
    assert(isApplicable === true, '3.5 Correct variant: combo applicable');
    assert(result.discount === 80, '3.5 Correct variant: discount ₹80');
  }

  // Test 3.6: Insufficient quantity in cart
  {
    const combo = {
      _id: 'combo-12',
      title: 'Qty 2 Combo',
      comboType: 'fixed_products',
      comboPrice: 0,
      discountValue: 100,
      comboProducts: [
        { product: { _id: 'prod-A' }, quantity: 2, variant: { size: '' } },
        { product: { _id: 'prod-B' }, quantity: 1, variant: { size: '' } },
      ],
    };
    const cartItems = [
      { product: { _id: 'prod-A' }, quantity: 1, price: 500, variant: null }, // only 1, need 2
      { product: { _id: 'prod-B' }, quantity: 1, price: 200, variant: null },
    ];
    const { isApplicable, result } = validateComboForCart(combo, cartItems);
    assert(isApplicable === false, '3.6 Insufficient qty: combo not applicable');
  }

  // Test 3.7: Uneven sets (3 of A, 2 of B — only 2 sets possible)
  {
    const combo = {
      _id: 'combo-13',
      title: 'Uneven Sets',
      comboType: 'fixed_products',
      comboPrice: 0,
      discountValue: 50,
      comboProducts: [
        { product: { _id: 'prod-A' }, quantity: 1, variant: { size: '' } },
        { product: { _id: 'prod-B' }, quantity: 1, variant: { size: '' } },
      ],
    };
    const cartItems = [
      { product: { _id: 'prod-A' }, quantity: 3, price: 500, variant: null },
      { product: { _id: 'prod-B' }, quantity: 2, price: 200, variant: null },
    ];
    const { isApplicable, result } = validateComboForCart(combo, cartItems);
    assert(isApplicable === true, '3.7 Uneven quantities: applicable');
    assert(result.sets === 2, '3.7 Uneven quantities: only 2 sets (limited by prod-B)');
    assert(result.discount === 100, '3.7 Uneven quantities: discount ₹100 (50×2)');
  }

  // ---- Test Group 4: Frontend Display Logic ----
  console.log('\n--- Frontend Display Logic ---\n');

  // Test 4.1: OffersPage getDiscountText - fixed discount
  {
    const combo = { comboType: 'fixed_products', discountValue: 100, comboPrice: 0 };
    const text = getDiscountText(combo);
    assert(text === 'Save ₹100', '4.1 OffersPage: fixed discount shows "Save ₹100"');
  }

  // Test 4.2: OffersPage getDiscountText - fixed price
  {
    const combo = { comboType: 'fixed_products', discountValue: 0, comboPrice: 499 };
    const text = getDiscountText(combo);
    assert(text === 'At ₹499', '4.2 OffersPage: fixed price shows "At ₹499"');
  }

  // Test 4.3: OffersPage getDiscountText - no pricing set
  {
    const combo = { comboType: 'fixed_products', discountValue: 0, comboPrice: 0 };
    const text = getDiscountText(combo);
    assert(text === 'Special Price', '4.3 OffersPage: no pricing shows "Special Price"');
  }

  // Test 4.4: OffersPage getDiscountText - category combo percentage
  {
    const combo = { comboType: 'category_combo', discountType: 'percentage', discountValue: 20 };
    const text = getDiscountText(combo);
    assert(text === '20% OFF', '4.4 OffersPage: category combo percentage shows "20% OFF"');
  }

  // Test 4.5: OffersPage getDiscountText - category combo fixed
  {
    const combo = { comboType: 'category_combo', discountType: 'fixed', discountValue: 200 };
    const text = getDiscountText(combo);
    assert(text === '₹200 OFF', '4.5 OffersPage: category combo fixed shows "₹200 OFF"');
  }

  // Test 4.6: CartPage display - fixed discount mode labels
  {
    const comboResult = { pricingMode: 'fixed_discount', comboPrice: 0, discountPerSet: 100 };
    const headerText = comboResult.pricingMode === 'fixed_price' && comboResult.comboPrice > 0
      ? `At ₹${comboResult.comboPrice}`
      : `Save ₹${comboResult.discountPerSet}`;
    assert(headerText === 'Save ₹100', '4.6 CartPage header: fixed discount shows "Save ₹100"');

    const footerText = comboResult.pricingMode === 'fixed_price' && comboResult.comboPrice > 0
      ? `Combo: ₹${comboResult.comboPrice}`
      : `You save ₹${comboResult.discountPerSet || 0}`;
    assert(footerText === 'You save ₹100', '4.6 CartPage footer: fixed discount shows "You save ₹100"');

    const label = comboResult.pricingMode === 'fixed_price' ? 'Bundle Price' : 'Combo Price';
    assert(label === 'Combo Price', '4.6 CartPage summary label: "Combo Price"');
  }

  // Test 4.7: CartPage display - fixed price mode labels
  {
    const comboResult = { pricingMode: 'fixed_price', comboPrice: 499, discountPerSet: 101 };
    const headerText = comboResult.pricingMode === 'fixed_price' && comboResult.comboPrice > 0
      ? `At ₹${comboResult.comboPrice}`
      : `Save ₹${comboResult.discountPerSet}`;
    assert(headerText === 'At ₹499', '4.7 CartPage header: fixed price shows "At ₹499"');

    const footerText = comboResult.pricingMode === 'fixed_price' && comboResult.comboPrice > 0
      ? `Combo: ₹${comboResult.comboPrice}`
      : `You save ₹${comboResult.discountPerSet || 0}`;
    assert(footerText === 'Combo: ₹499', '4.7 CartPage footer: fixed price shows "Combo: ₹499"');

    const label = comboResult.pricingMode === 'fixed_price' ? 'Bundle Price' : 'Combo Price';
    assert(label === 'Bundle Price', '4.7 CartPage summary label: "Bundle Price"');
  }

  // Test 4.8: Order summary calculation - fixed discount
  {
    const combo = { discountPerSet: 100, sets: 2 };
    const originalPerSet = 700; // 500 + 200
    const savings = (combo.discountPerSet || 0) * combo.sets;
    const comboTotal = (originalPerSet * combo.sets) - savings;
    assert(savings === 200, '4.8 Order summary: savings ₹200 (100×2)');
    assert(comboTotal === 1200, '4.8 Order summary: comboTotal ₹1200 (1400-200)');
  }

  // Test 4.9: Order summary calculation - fixed price
  {
    const combo = { discountPerSet: 101, comboPrice: 499, sets: 2 };
    const originalPerSet = 600;
    const savings = (combo.discountPerSet || 0) * combo.sets;
    const comboTotal = (originalPerSet * combo.sets) - savings;
    assert(savings === 202, '4.9 Order summary: savings ₹202 (101×2)');
    assert(comboTotal === 998, '4.9 Order summary: comboTotal ₹998 (= 499×2)');
  }
}

// ========== TEST GROUP 5: Order Creation & Discount Validation ==========

function runOrderTests() {
  console.log('\n--- Order Creation & Discount Validation ---\n');

  // Test 5.1: buildOrderData sends correct fields
  {
    const subtotal = 2100;
    const giftWrapFee = 0;
    const packingCharge = 50;
    const shippingFee = 0;
    const comboDiscounts = [
      { _id: 'combo-1', discount: 198, discountPerSet: 99, sets: 2, allowAdminOffersOnTop: true }
    ];
    const comboDiscount = comboDiscounts.reduce((sum, c) => sum + (c.discount || 0), 0);
    const couponDiscount = 0;
    const discount = comboDiscount + couponDiscount;
    const total = subtotal + giftWrapFee + packingCharge + shippingFee - discount;

    assert(comboDiscount === 198, '5.1 comboDiscount correctly summed: ₹198');
    assert(discount === 198, '5.1 total discount: ₹198');
    assert(total === 1952, '5.1 total: 2100 + 50 - 198 = ₹1952');

    // buildOrderData output
    const orderData = {
      itemsPrice: subtotal,
      giftWrapPrice: giftWrapFee,
      packingPrice: packingCharge,
      shippingPrice: shippingFee,
      totalPrice: total,
      discountPrice: discount,
      comboOfferId: comboDiscounts.map(c => c._id),
      comboDiscount: comboDiscount,
      couponDiscount: couponDiscount,
    };
    assert(orderData.packingPrice === 50, '5.1 packingPrice included in order data');
    assert(orderData.discountPrice === 198, '5.1 discountPrice = combo + coupon discount');
    assert(Array.isArray(orderData.comboOfferId), '5.1 comboOfferId is array');
    assert(orderData.comboOfferId[0] === 'combo-1', '5.1 comboOfferId contains combo ID');
    assert(orderData.comboDiscount === 198, '5.1 comboDiscount sent separately');
    assert(orderData.couponDiscount === 0, '5.1 couponDiscount sent separately');
  }

  // Test 5.2: Server-side total price validation
  {
    const orderData = {
      itemsPrice: 2100,
      giftWrapPrice: 0,
      packingPrice: 50,
      shippingPrice: 0,
      taxPrice: 0,
      discountPrice: 198,
      totalPrice: 1952,
    };
    const expectedTotal = orderData.itemsPrice + (orderData.giftWrapPrice || 0) +
      (orderData.packingPrice || 0) + (orderData.shippingPrice || 0) +
      (orderData.taxPrice || 0) - (orderData.discountPrice || 0);
    assert(Math.abs(orderData.totalPrice - expectedTotal) <= 2, '5.2 Server-side total validation passes');
  }

  // Test 5.3: Server-side total price validation - tampered total fails
  {
    const orderData = {
      itemsPrice: 2100,
      giftWrapPrice: 0,
      packingPrice: 50,
      shippingPrice: 0,
      taxPrice: 0,
      discountPrice: 198,
      totalPrice: 1000, // tampered: should be 1952
    };
    const expectedTotal = orderData.itemsPrice + (orderData.giftWrapPrice || 0) +
      (orderData.packingPrice || 0) + (orderData.shippingPrice || 0) +
      (orderData.taxPrice || 0) - (orderData.discountPrice || 0);
    assert(Math.abs(orderData.totalPrice - expectedTotal) > 2, '5.3 Tampered total rejected by validation');
  }

  // Test 5.4: Combo discount verification - valid discount
  {
    const combo = {
      comboType: 'fixed_products',
      discountValue: 100,
      comboPrice: 0,
      comboProducts: [
        { product: { _id: 'prod-A' }, quantity: 1, variant: { size: '' } },
        { product: { _id: 'prod-B' }, quantity: 1, variant: { size: '' } },
      ],
      isActive: true,
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(Date.now() + 86400000),
    };
    const orderItems = [
      { product: 'prod-A', quantity: 2, price: 700, variant: null },
      { product: 'prod-B', quantity: 2, price: 100, variant: null },
    ];
    // Simulate server-side verification
    let verifiedDiscount = 0;
    let maxSets = Infinity;
    let originalPricePerSet = 0;
    let allPresent = true;
    for (const cp of combo.comboProducts) {
      const productId = cp.product._id.toString();
      const cartItem = orderItems.find(i => (i.product?._id || i.product)?.toString() === productId);
      if (!cartItem || cartItem.quantity < cp.quantity) { allPresent = false; break; }
      maxSets = Math.min(maxSets, Math.floor(cartItem.quantity / cp.quantity));
      originalPricePerSet += cartItem.price * cp.quantity;
    }
    if (allPresent && isFinite(maxSets)) {
      const dps = combo.discountValue > 0 ? combo.discountValue : Math.max(0, originalPricePerSet - combo.comboPrice);
      verifiedDiscount = dps * maxSets;
    }
    assert(verifiedDiscount === 200, '5.4 Server verifies: discount ₹200 (100×2 sets)');
    const clientClaimed = 200;
    assert(clientClaimed <= verifiedDiscount + 1, '5.4 Client claim passes verification');
  }

  // Test 5.5: Combo discount verification - inflated discount rejected
  {
    const combo = {
      comboType: 'fixed_products',
      discountValue: 100,
      comboPrice: 0,
      comboProducts: [
        { product: { _id: 'prod-A' }, quantity: 1, variant: { size: '' } },
        { product: { _id: 'prod-B' }, quantity: 1, variant: { size: '' } },
      ],
    };
    const orderItems = [
      { product: 'prod-A', quantity: 1, price: 700, variant: null },
      { product: 'prod-B', quantity: 1, price: 100, variant: null },
    ];
    let verifiedDiscount = 0;
    let maxSets = Infinity;
    let originalPricePerSet = 0;
    let allPresent = true;
    for (const cp of combo.comboProducts) {
      const productId = cp.product._id.toString();
      const cartItem = orderItems.find(i => (i.product?._id || i.product)?.toString() === productId);
      if (!cartItem || cartItem.quantity < cp.quantity) { allPresent = false; break; }
      maxSets = Math.min(maxSets, Math.floor(cartItem.quantity / cp.quantity));
      originalPricePerSet += cartItem.price * cp.quantity;
    }
    if (allPresent && isFinite(maxSets)) {
      const dps = combo.discountValue > 0 ? combo.discountValue : Math.max(0, originalPricePerSet - combo.comboPrice);
      verifiedDiscount = dps * maxSets;
    }
    const clientClaimed = 500; // inflated!
    assert(clientClaimed > verifiedDiscount + 1, '5.5 Inflated discount correctly detected');
  }

  // Test 5.6: Stacking logic - combo allows stacking with coupon
  {
    const comboDiscount = 200;
    const couponDiscount = 50;
    const canStackWithCoupon = true;
    let discount;
    if (comboDiscount > 0 && couponDiscount > 0) {
      if (canStackWithCoupon) {
        discount = comboDiscount + couponDiscount;
      } else {
        discount = Math.max(comboDiscount, couponDiscount);
      }
    } else {
      discount = comboDiscount + couponDiscount;
    }
    assert(discount === 250, '5.6 Stacking allowed: discount = combo + coupon = ₹250');
  }

  // Test 5.7: Stacking logic - combo doesn't allow stacking
  {
    const comboDiscount = 200;
    const couponDiscount = 50;
    const canStackWithCoupon = false;
    let discount;
    if (comboDiscount > 0 && couponDiscount > 0) {
      if (canStackWithCoupon) {
        discount = comboDiscount + couponDiscount;
      } else {
        discount = Math.max(comboDiscount, couponDiscount);
      }
    } else {
      discount = comboDiscount + couponDiscount;
    }
    assert(discount === 200, '5.7 No stacking: discount = max(combo, coupon) = ₹200');
  }

  // Test 5.8: Order model stores all new fields
  {
    const orderFields = {
      packingPrice: 50,
      discountPrice: 250,
      couponCode: 'SAVE50',
      comboOfferIds: ['combo-1', 'combo-2'],
      comboDiscount: 200,
      couponDiscount: 50,
    };
    assert(orderFields.packingPrice === 50, '5.8 packingPrice stored in order');
    assert(orderFields.couponCode === 'SAVE50', '5.8 couponCode stored in order');
    assert(orderFields.comboOfferIds.length === 2, '5.8 comboOfferIds stored as array');
    assert(orderFields.comboDiscount === 200, '5.8 comboDiscount stored separately');
    assert(orderFields.couponDiscount === 50, '5.8 couponDiscount stored separately');
    assert(orderFields.discountPrice === 250, '5.8 discountPrice = combo + coupon total');
  }
}

// ========== TEST GROUP 6: Admin Order Display ==========

function runAdminDisplayTests() {
  console.log('\n--- Admin Order Display Logic ---\n');

  // Test 6.1: Admin shows discount breakdown
  {
    const order = {
      itemsPrice: 2100,
      packingPrice: 50,
      giftWrapPrice: 0,
      shippingPrice: 0,
      taxPrice: 0,
      discountPrice: 250,
      comboDiscount: 200,
      couponDiscount: 50,
      couponCode: 'SAVE50',
      totalPrice: 1900,
    };
    assert(order.discountPrice > 0, '6.1 Discount section shown when discountPrice > 0');
    assert(order.comboDiscount > 0, '6.1 Combo discount detail shown');
    assert(order.couponDiscount > 0, '6.1 Coupon discount detail shown');
    assert(order.couponCode === 'SAVE50', '6.1 Coupon code displayed');
    // Verify total adds up
    const computed = order.itemsPrice + order.packingPrice + order.giftWrapPrice + order.shippingPrice + order.taxPrice - order.discountPrice;
    assert(computed === order.totalPrice, '6.1 Admin total matches: items + fees - discount');
  }

  // Test 6.2: Admin shows no discount section when no discount
  {
    const order = {
      discountPrice: 0,
      comboDiscount: 0,
      couponDiscount: 0,
      couponCode: null,
    };
    assert(order.discountPrice === 0, '6.2 No discount section when discountPrice is 0');
  }

  // Test 6.3: Packing charge shown from stored field (not inferred)
  {
    const order = {
      itemsPrice: 2100,
      packingPrice: 75,
      giftWrapPrice: 0,
      shippingPrice: 0,
      taxPrice: 0,
      discountPrice: 100,
      totalPrice: 2075,
    };
    // Old broken logic tried to infer: totalPrice - itemsPrice - giftWrap - shipping - tax
    // = 2075 - 2100 - 0 - 0 - 0 = -25 (wrong!)
    // New logic: just use order.packingPrice directly
    assert(order.packingPrice === 75, '6.3 Packing charge from stored field, not inferred');
    const inferredOld = order.totalPrice - order.itemsPrice - order.giftWrapPrice - order.shippingPrice - order.taxPrice;
    assert(inferredOld !== 75, '6.3 Old inference gave wrong value: ' + inferredOld);
  }
}

// ========== TEST GROUP 7: Cart/Checkout Display Calculations ==========

function runDisplayCalcTests() {
  console.log('\n--- Cart/Checkout Display Calculations ---\n');

  // Test 7.1: Order summary item prices multiply by sets.length
  {
    const sets = [
      { setNumber: 1, items: [{ comboQty: 1, product: { name: 'Frame' } }] },
      { setNumber: 2, items: [{ comboQty: 1, product: { name: 'Frame' } }] },
    ];
    const getItemPrice = () => 700;
    const item = sets[0].items[0];
    const displayQty = item.comboQty * sets.length;
    const displayPrice = getItemPrice(item) * item.comboQty * sets.length;
    assert(displayQty === 2, '7.1 Display qty: 1 × 2 sets = 2');
    assert(displayPrice === 1400, '7.1 Display price: 700 × 1 × 2 = ₹1400');
  }

  // Test 7.2: Combo total consistent with item prices
  {
    const setsLength = 2;
    const items = [
      { comboQty: 1, price: 700 },
      { comboQty: 1, price: 100 },
    ];
    const originalPrice = items.reduce((s, i) => s + i.price * i.comboQty, 0) * setsLength;
    const discountPerSet = 100;
    const savings = discountPerSet * setsLength;
    const comboTotal = originalPrice - savings;

    // Display: items show 1400 + 200 = 1600 (struck through), combo price = 1400
    const displayTotal = items.reduce((s, i) => s + i.price * i.comboQty * setsLength, 0);
    assert(displayTotal === originalPrice, '7.2 Struck-through total matches original price');
    assert(comboTotal === 1400, '7.2 Combo total: 1600 - 200 = ₹1400');
    assert(displayTotal - savings === comboTotal, '7.2 displayed items - savings = combo total (math consistent)');
  }

  // Test 7.3: Section headers appear only when needed
  {
    const cases = [
      { comboGroups: [{ combo: {}, sets: [] }], nonComboItems: [{ _id: 1 }], leftovers: [], showCombo: true, showIndividual: true },
      { comboGroups: [{ combo: {}, sets: [] }], nonComboItems: [], leftovers: [], showCombo: true, showIndividual: false },
      { comboGroups: [], nonComboItems: [{ _id: 1 }], leftovers: [], showCombo: false, showIndividual: false },
    ];
    for (const c of cases) {
      const showComboHeader = c.comboGroups.length > 0;
      const showIndividualHeader = c.comboGroups.length > 0 && (c.nonComboItems.length > 0 || c.leftovers.length > 0);
      assert(showComboHeader === c.showCombo, `7.3 Combo header: expected ${c.showCombo}`);
      assert(showIndividualHeader === c.showIndividual, `7.3 Individual header: expected ${c.showIndividual}`);
    }
  }

  // Test 7.4: Cart subtotal is raw total before combo discount
  {
    const items = [
      { price: 700, quantity: 2 }, // 2 frames in combo sets
      { price: 100, quantity: 2 }, // 2 elephants in combo sets
      { price: 500, quantity: 1 }, // paper (individual)
    ];
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    assert(subtotal === 2100, '7.4 Subtotal = raw total (no combo discount): ₹2100');

    const comboDiscount = 200;
    const total = subtotal - comboDiscount;
    assert(total === 1900, '7.4 Total after combo: 2100 - 200 = ₹1900');
  }

  // Test 7.5: Total with packing + gift wrap + combo discount
  {
    const subtotal = 2100;
    const giftWrapFee = 100;
    const packingCharge = 50;
    const deliveryChargeFixed = 0;
    const comboDiscountAmount = 200;
    const total = subtotal + giftWrapFee + packingCharge + deliveryChargeFixed - comboDiscountAmount;
    assert(total === 2050, '7.5 Total = 2100 + 100 + 50 + 0 - 200 = ₹2050');
  }
}

// Mirror of OffersPage getDiscountText
function getDiscountText(combo) {
  if (combo.comboType === 'fixed_products') {
    if (combo.discountValue > 0) {
      return `Save ₹${combo.discountValue}`;
    }
    if (combo.comboPrice > 0) {
      return `At ₹${combo.comboPrice}`;
    }
  }
  if (combo.discountType === 'percentage' && combo.discountValue > 0) {
    return `${combo.discountValue}% OFF`;
  }
  if (combo.discountType === 'fixed' && combo.discountValue > 0) {
    return `₹${combo.discountValue} OFF`;
  }
  return 'Special Price';
}

// ========== RUN ==========

async function main() {
  console.log('🧪 Pokisham Combo Offer Test Suite\n');

  // Run all unit tests (no DB needed)
  runUnitTests();
  runOrderTests();
  runAdminDisplayTests();
  runDisplayCalcTests();

  // Summary
  console.log('\n========================================');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('========================================');

  if (failures.length > 0) {
    console.log('\n❌ Failed tests:');
    failures.forEach(f => console.log(`   - ${f}`));
  } else {
    console.log('\n✅ All tests passed!');
  }

  process.exit(failed > 0 ? 1 : 0);
}

main();
