import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiPackage, FiCheckCircle, FiTag, FiX, FiCreditCard, FiShield } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Breadcrumb from '../../components/common/Breadcrumb';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import packingImage from '../../assets/images/pokisham_packing-removebg-preview.png';

// Load Razorpay script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('cod');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Razorpay state
  const [razorpayKey, setRazorpayKey] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // ------------------------------
  // 🚀 useEffect FIX
  // ------------------------------
  useEffect(() => {
    document.title = 'Checkout - Pokisham';

    // Stop ALL redirects after success
    if (orderSuccess) return;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Don't redirect on empty cart AFTER success
    if (!cart || !cart.items || cart.items.length === 0) {
      navigate('/cart');
      return;
    }

    // Pre-fill
    if (user) {
      setShippingAddress((prev) => ({
        ...prev,
        fullName: user.name || '',
        phone: user.phone || '',
      }));
    }

    // Load Razorpay key
    const fetchRazorpayKey = async () => {
      try {
        const { data } = await API.get('/payment/key');
        if (data.success) {
          setRazorpayKey(data.key);
        }
      } catch (error) {
        console.error('Failed to fetch Razorpay key:', error);
      }
    };
    fetchRazorpayKey();
  }, [isAuthenticated, cart, user, navigate, orderSuccess]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress({
      ...shippingAddress,
      [name]: value,
    });
  };

  const getItemPrice = (item) => {
    if (item.variant && item.product.hasVariants) {
      const variant = item.product.variants.find((v) => v.size === item.variant.size);
      return variant ? variant.price : item.product.price;
    }
    return item.product.discountPrice || item.product.price;
  };

  const subtotal = getCartTotal();
  const giftWrapFee = cart?.items?.filter((item) => item.giftWrap).length * 50 || 0;

  // Calculate packing charges from products
  const packingCharge = cart?.items?.reduce((acc, item) => {
    const productPackingCharge = item.product.packingCharge || 0;
    return acc + (productPackingCharge * item.quantity);
  }, 0) || 0;

  // Check if any product has "to_pay" delivery type
  const hasToPayDelivery = cart?.items?.some((item) => {
    const chargeType = item.product.deliveryChargeType || 'to_pay';
    return chargeType === 'to_pay';
  }) || false;

  // Calculate fixed delivery charges (added to total)
  const deliveryChargeFixed = cart?.items?.reduce((acc, item) => {
    const chargeType = item.product.deliveryChargeType || 'to_pay';
    if (chargeType === 'fixed') {
      const productDeliveryCharge = item.product.deliveryCharge || 0;
      return acc + (productDeliveryCharge * item.quantity);
    }
    return acc;
  }, 0) || 0;

  // Fixed delivery charge is added to total, "to_pay" is just an indicator
  const shippingFee = deliveryChargeFixed;

  // Calculate discount from coupon
  const discount = appliedCoupon ? appliedCoupon.discount : 0;

  const total = subtotal + giftWrapFee + packingCharge + deliveryChargeFixed - discount;

  // Apply coupon handler
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      const { data } = await API.post('/coupons/validate', {
        code: couponCode.trim(),
        cartTotal: subtotal
      });

      if (data.success) {
        setAppliedCoupon(data.coupon);
        toast.success(`Coupon applied! You save ₹${data.coupon.discount}`);
        setCouponCode('');
      }
    } catch (error) {
      setCouponError(error.response?.data?.message || 'Invalid coupon code');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  // Remove coupon handler
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
    toast.success('Coupon removed');
  };

  // Helper function to build order data
  const buildOrderData = useCallback(() => {
    return {
      orderItems: cart.items.map((item) => ({
        product: item.product._id,
        name: item.product.name,
        quantity: item.quantity,
        image: item.product.images?.[0]?.url || '',
        price: getItemPrice(item),
        variant: item.variant,
        giftWrap: item.giftWrap,
        customPhoto: item.customPhoto || null,
      })),
      shippingAddress: {
        name: shippingAddress.fullName,
        phone: shippingAddress.phone,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode,
      },
      itemsPrice: subtotal,
      giftWrapPrice: giftWrapFee,
      packingPrice: packingCharge,
      shippingPrice: shippingFee,
      totalPrice: total,
      taxPrice: 0,
      discountPrice: discount,
      couponCode: appliedCoupon?.code || null,
    };
  }, [cart, shippingAddress, subtotal, giftWrapFee, packingCharge, shippingFee, total, discount, appliedCoupon]);

  // Handle order completion (common for both COD and Online)
  const handleOrderSuccess = async (orderId) => {
    setOrderId(orderId);

    // Mark coupon as used if applied
    if (appliedCoupon) {
      try {
        await API.post('/coupons/use', { code: appliedCoupon.code });
      } catch (err) {
        console.error('Failed to mark coupon as used:', err);
      }
    }

    // Clear cart and show success
    await clearCart();
    setOrderSuccess(true);
    setLoading(false);
    setProcessingPayment(false);
  };

  // Handle Razorpay payment
  const handleRazorpayPayment = async (orderId) => {
    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway. Please try again.');
        setProcessingPayment(false);
        return;
      }

      // Create Razorpay order
      const { data: razorpayOrder } = await API.post('/payment/create-order', {
        amount: total,
        currency: 'INR',
        receipt: `order_${orderId}`,
        notes: {
          orderId: orderId,
        },
      });

      if (!razorpayOrder.success) {
        toast.error('Failed to create payment order');
        setProcessingPayment(false);
        return;
      }

      // Configure Razorpay options
      const options = {
        key: razorpayKey,
        amount: razorpayOrder.order.amount,
        currency: razorpayOrder.order.currency,
        name: 'Pokisham',
        description: 'Order Payment',
        order_id: razorpayOrder.order.id,
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyResponse = await API.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderId,
            });

            if (verifyResponse.data.success) {
              toast.success('Payment successful!');
              await handleOrderSuccess(orderId);
            } else {
              toast.error('Payment verification failed');
              setProcessingPayment(false);
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed');
            setProcessingPayment(false);
          }
        },
        prefill: {
          name: shippingAddress.fullName,
          contact: shippingAddress.phone,
          email: user?.email || '',
        },
        notes: {
          address: `${shippingAddress.addressLine1}, ${shippingAddress.city}`,
        },
        theme: {
          color: '#7C3AED',
        },
        modal: {
          ondismiss: async function () {
            // Handle payment cancellation
            try {
              await API.post('/payment/failed', {
                orderId: orderId,
                error: { description: 'Payment cancelled by user' },
              });
            } catch (err) {
              console.error('Failed to update order status:', err);
            }
            toast.error('Payment cancelled');
            setProcessingPayment(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on('payment.failed', async function (response) {
        try {
          await API.post('/payment/failed', {
            orderId: orderId,
            error: response.error,
          });
        } catch (err) {
          console.error('Failed to update order status:', err);
        }
        toast.error(response.error.description || 'Payment failed');
        setProcessingPayment(false);
      });

      razorpay.open();
    } catch (error) {
      console.error('Razorpay error:', error);
      toast.error('Payment failed. Please try again.');
      setProcessingPayment(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        ...buildOrderData(),
        paymentMethod: paymentMethod === 'online' ? 'ONLINE' : 'COD',
        paymentInfo: { status: paymentMethod === 'online' ? 'pending' : 'pending' },
      };

      const { data } = await API.post('/orders', orderData);

      if (data.success) {
        if (paymentMethod === 'online') {
          // Handle online payment with Razorpay
          setProcessingPayment(true);
          setLoading(false);
          await handleRazorpayPayment(data.order._id);
        } else {
          // COD - complete order directly
          await handleOrderSuccess(data.order._id);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
      setLoading(false);
      setProcessingPayment(false);
    }
  };

  // --------------------------------------------
  // 🚀 SUCCESS SCREEN ALWAYS COMES FIRST RETURNS
  // --------------------------------------------
  if (orderSuccess) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 animate-gradient p-4">

        {/* Party Popper Confetti Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Confetti pieces */}
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#ff9ff3', '#54a0ff', '#feca57', '#ff6348', '#1dd1a1'][Math.floor(Math.random() * 10)],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                borderRadius: Math.random() > 0.5 ? '50%' : '0',
                transform: `rotate(${Math.random() * 360}deg)`,
                boxShadow: '0 0 10px rgba(255,255,255,0.6)'
              }}
            />
          ))}

          {/* Party Streamers */}
          {[...Array(20)].map((_, i) => (
            <div
              key={`streamer-${i}`}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                width: '3px',
                height: `${Math.random() * 40 + 20}px`,
                backgroundColor: ['#ff6b6b', '#4ecdc4', '#f9ca24', '#6c5ce7', '#ff9ff3'][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 1.5}s`,
                animationDuration: `${2.5 + Math.random() * 2}s`,
                borderRadius: '10px',
                opacity: 0.8
              }}
            />
          ))}

          {/* Floating Ribbons */}
          {[...Array(15)].map((_, i) => (
            <div
              key={`ribbon-${i}`}
              className="absolute animate-confetti text-2xl md:text-4xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 3}s`,
              }}
            >
              🎀
            </div>
          ))}
        </div>

        <div className="text-center max-w-lg w-full relative z-10">

          {/* Packing Illustration */}
          <div className="mb-4 md:mb-6 animate-fade-in">
            <img
              src={packingImage}
              alt="Your gift is being packed"
              className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 mx-auto object-contain drop-shadow-2xl"
            />
          </div>

          <div className="flex items-center justify-center gap-2 mb-3 md:mb-4">
            <FiCheckCircle className="w-8 h-8 md:w-10 md:h-10 text-white animate-bounce" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white animate-fade-in drop-shadow-lg">
              Order Placed Successfully!
            </h1>
          </div>

          <p className="text-base sm:text-lg md:text-xl text-white mb-2 animate-fade-in-delay drop-shadow-md">
            Your gift is being carefully packed with love
          </p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8 animate-fade-in-delay drop-shadow-md">
            Thank you for shopping with Pokisham
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(`/orders/${orderId}`)}
              className="bg-white text-purple-600 px-6 py-3 rounded-full font-semibold text-base sm:text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 animate-scale-in"
            >
              Track Order
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-white/20 text-white border-2 border-white px-6 py-3 rounded-full font-semibold text-base sm:text-lg shadow-xl hover:bg-white/30 transform hover:scale-105 transition-all duration-300 animate-scale-in"
            >
              Continue Shopping
            </button>
          </div>
        </div>

      </div>
    );
  }

  // --------------------------------------------
  // 🚫 DON'T render checkout if cart is empty AND no success
  // --------------------------------------------
  if (!orderSuccess && (!cart || !cart.items || cart.items.length === 0)) {
    return null;
  }

  // --------------------------------------------
  // 🧾 CHECKOUT SCREEN
  // --------------------------------------------
  const breadcrumbs = [
    { label: 'Shopping Cart', path: '/cart' },
    { label: 'Checkout' }
  ];

  return (
    <>
      <Breadcrumb items={breadcrumbs} />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-custom">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-8">Checkout</h1>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT SIDE */}
          <div className="lg:col-span-2 space-y-6">

            {/* Shipping */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-display font-bold text-gray-900 mb-4">Shipping Address</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="md:col-span-2">
                  <label className="block mb-2">Full Name*</label>
                  <input type="text" name="fullName" value={shippingAddress.fullName}
                    onChange={handleInputChange} required className="w-full px-4 py-2 border rounded-md"
                    placeholder="John Doe" />
                </div>

                <div className="md:col-span-2">
                  <label className="block mb-2">Phone Number*</label>
                  <input type="tel" name="phone" pattern="[0-9]{10}" value={shippingAddress.phone}
                    onChange={handleInputChange} required className="w-full px-4 py-2 border rounded-md"
                    placeholder="9876543210" />
                </div>

                <div className="md:col-span-2">
                  <label className="block mb-2">Address Line 1*</label>
                  <input type="text" name="addressLine1" value={shippingAddress.addressLine1}
                    onChange={handleInputChange} required className="w-full px-4 py-2 border rounded-md"
                    placeholder="House No, Street Name" />
                </div>

                <div className="md:col-span-2">
                  <label className="block mb-2">Address Line 2</label>
                  <input type="text" name="addressLine2" value={shippingAddress.addressLine2}
                    onChange={handleInputChange} className="w-full px-4 py-2 border rounded-md"
                    placeholder="Landmark, Area" />
                </div>

                <div>
                  <label className="block mb-2">City*</label>
                  <input type="text" name="city" value={shippingAddress.city}
                    onChange={handleInputChange} required className="w-full px-4 py-2 border rounded-md"
                    placeholder="Chennai" />
                </div>

                <div>
                  <label className="block mb-2">State*</label>
                  <input type="text" name="state" value={shippingAddress.state}
                    onChange={handleInputChange} required className="w-full px-4 py-2 border rounded-md"
                    placeholder="Tamil Nadu" />
                </div>

                <div>
                  <label className="block mb-2">Pincode*</label>
                  <input type="text" name="pincode" pattern="[0-9]{6}" value={shippingAddress.pincode}
                    onChange={handleInputChange} required className="w-full px-4 py-2 border rounded-md"
                    placeholder="600001" />
                </div>

              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-display font-bold text-gray-900 mb-4">Payment Method</h2>

              <div className="space-y-3">
                {/* Online Payment Option */}
                <label
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'online'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 text-primary-600"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <FiCreditCard className="w-5 h-5 text-primary-600" />
                      <span className="font-medium">Pay Online</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Recommended</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">UPI, Cards, Net Banking, Wallets</p>
                  </div>
                  {paymentMethod === 'online' && <FiCheck className="text-primary-600 w-5 h-5" />}
                </label>

                {/* COD Option */}
                <label
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 text-primary-600"
                  />
                  <div className="ml-3 flex-1">
                    <span className="font-medium">Cash on Delivery</span>
                    <p className="text-xs text-gray-500 mt-1">Pay when you receive your order</p>
                  </div>
                  {paymentMethod === 'cod' && <FiCheck className="text-primary-600 w-5 h-5" />}
                </label>
              </div>

              {/* Security Badge */}
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                <FiShield className="w-4 h-4 text-green-600" />
                <span>100% Secure Payments powered by Razorpay</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE SUMMARY */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">

              <h2 className="text-xl font-bold mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4 pb-4 border-b max-h-60 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item._id} className="flex gap-3">

                    <img src={item.product.images?.[0]?.url} alt=""
                      className="w-16 h-16 rounded object-cover border" />

                    <div className="flex-1">
                      <h3 className="text-sm font-medium">{item.product.name}</h3>
                      {item.variant && (
                        <p className="text-xs text-gray-600">Size: {item.variant.size}</p>
                      )}
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>

                    <div className="font-semibold">₹{getItemPrice(item) * item.quantity}</div>

                  </div>
                ))}
              </div>

              {/* Coupon Code Section */}
              <div className="mb-4 pb-4 border-b">
                <div className="flex items-center gap-2 mb-2">
                  <FiTag className="w-4 h-4 text-primary-600" />
                  <span className="font-medium text-sm">Apply Coupon</span>
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                    <div>
                      <p className="font-medium text-green-700">{appliedCoupon.code}</p>
                      <p className="text-xs text-green-600">You save ₹{appliedCoupon.discount}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponError('');
                        }}
                        placeholder="Enter coupon code"
                        className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
                      >
                        {couponLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-red-500 mt-1">{couponError}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-4 pb-4 border-b">
                <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>

                {packingCharge > 0 && (
                  <div className="flex justify-between"><span>Packing Charges</span><span>₹{packingCharge}</span></div>
                )}

                {giftWrapFee > 0 && (
                  <div className="flex justify-between"><span>Gift Wrap</span><span>₹{giftWrapFee}</span></div>
                )}

                {deliveryChargeFixed > 0 && (
                  <div className="flex justify-between">
                    <span>Delivery Charge</span>
                    <span className="text-sm font-medium text-green-600">₹{deliveryChargeFixed}</span>
                  </div>
                )}

                {hasToPayDelivery && (
                  <>
                    <div className="flex justify-between text-gray-500">
                      <span>Delivery</span>
                      <span className="text-sm font-medium text-orange-600">To Pay</span>
                    </div>
                    <p className="text-xs text-orange-500">*Delivery charge to be paid on arrival</p>
                  </>
                )}

                {deliveryChargeFixed === 0 && !hasToPayDelivery && (
                  <div className="flex justify-between text-gray-500">
                    <span>Delivery</span>
                    <span className="text-sm font-medium text-green-600">Free</span>
                  </div>
                )}

                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-₹{discount}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-lg font-bold mb-6">
                <span>Total</span><span>₹{total}</span>
              </div>

              <button
                type="submit"
                disabled={loading || processingPayment}
                className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading || processingPayment ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    {processingPayment ? 'Processing Payment...' : 'Placing Order...'}
                  </>
                ) : paymentMethod === 'online' ? (
                  <>
                    <FiCreditCard className="w-5 h-5" />
                    Pay ₹{total}
                  </>
                ) : (
                  'Place Order'
                )}
              </button>

            </div>
          </div>

        </form>
      </div>
    </div>
    </>
  );
};

export default CheckoutPage;
