import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiPackage, FiCheckCircle } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Breadcrumb from '../../components/common/Breadcrumb';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import packingImage from '../../assets/images/pokisham_packing-removebg-preview.png';

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
  const shippingFee = subtotal >= 999 ? 0 : 100;
  const total = subtotal + giftWrapFee + shippingFee;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
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
        paymentMethod: paymentMethod.toUpperCase(),
        paymentInfo: { status: 'pending' },
        itemsPrice: subtotal,
        giftWrapPrice: giftWrapFee,
        shippingPrice: shippingFee,
        totalPrice: total,
        taxPrice: 0,
        discountPrice: 0,
      };

      const { data } = await API.post('/orders', orderData);

      if (data.success) {
        setOrderId(data.order._id);

        // 🔥 IMPORTANT — clear cart FIRST, then show success
        await clearCart();

        // show success screen
        setOrderSuccess(true);
        setLoading(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
      setLoading(false);
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

              <label className="flex items-center p-4 border rounded-lg cursor-pointer">
                <input type="radio" name="paymentMethod" value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4" />
                <span className="ml-3 font-medium">Cash on Delivery</span>
                {paymentMethod === 'cod' && <FiCheck className="ml-auto" />}
              </label>

              <label className="flex items-center p-4 border rounded-lg opacity-50 mt-2">
                <input type="radio" disabled className="h-4 w-4" />
                <span className="ml-3 font-medium">Online Payment (Coming Soon)</span>
              </label>
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

              <div className="space-y-3 mb-4 pb-4 border-b">
                <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>

                {giftWrapFee > 0 && (
                  <div className="flex justify-between"><span>Gift Wrap</span><span>₹{giftWrapFee}</span></div>
                )}

                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold mb-6">
                <span>Total</span><span>₹{total}</span>
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary w-full disabled:opacity-50">
                {loading ? 'Placing Order...' : 'Place Order'}
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
