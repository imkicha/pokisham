import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiGift, FiImage, FiUpload, FiX } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Breadcrumb from '../../components/common/Breadcrumb';
import API from '../../api/axios';
import toast from 'react-hot-toast';

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, loading, updateCartItem, removeFromCart, getCartTotal, fetchCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [updatingItems, setUpdatingItems] = useState({});
  const [uploadingPhoto, setUploadingPhoto] = useState({});
  const fileInputRefs = useRef({});

  useEffect(() => {
    document.title = 'Shopping Cart - Pokisham';
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    setUpdatingItems({ ...updatingItems, [itemId]: true });
    const item = cart.items.find((i) => i._id === itemId);
    await updateCartItem(itemId, newQuantity, item.giftWrap);
    setUpdatingItems({ ...updatingItems, [itemId]: false });
  };

  const handleGiftWrapToggle = async (itemId) => {
    setUpdatingItems({ ...updatingItems, [itemId]: true });
    const item = cart.items.find((i) => i._id === itemId);
    await updateCartItem(itemId, item.quantity, !item.giftWrap);
    setUpdatingItems({ ...updatingItems, [itemId]: false });
  };

  const handleRemoveItem = async (itemId) => {
    await removeFromCart(itemId);
  };

  const handleCustomPhotoUpload = async (itemId, file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size should be less than 10MB');
      return;
    }

    setUploadingPhoto((prev) => ({ ...prev, [itemId]: true }));

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const { data } = await API.post(`/cart/${itemId}/custom-photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success) {
        toast.success('Photo uploaded successfully!');
        fetchCart();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const handleRemoveCustomPhoto = async (itemId) => {
    if (!window.confirm('Are you sure you want to remove this photo?')) return;

    setUploadingPhoto((prev) => ({ ...prev, [itemId]: true }));

    try {
      const { data } = await API.delete(`/cart/${itemId}/custom-photo`);

      if (data.success) {
        toast.success('Photo removed successfully!');
        fetchCart();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove photo');
    } finally {
      setUploadingPhoto((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const getItemPrice = (item) => {
    if (item.variant && item.product.hasVariants) {
      const variant = item.product.variants.find((v) => v.size === item.variant.size);
      return variant ? variant.price : item.product.price;
    }
    return item.product.discountPrice || item.product.price;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Filter out items with null products (products that were deleted)
  const validItems = cart?.items?.filter((item) => item.product !== null) || [];

  if (!cart || !cart.items || validItems.length === 0) {
    return (
      <div className="container-custom py-8 sm:py-12">
        <div className="text-center py-12 sm:py-16">
          <FiShoppingBag className="w-16 h-16 sm:w-24 sm:h-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-display font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6 sm:mb-8">Add some products to get started!</p>
          <Link to="/products" className="btn-primary inline-block">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = getCartTotal();
  const giftWrapFee = validItems.filter((item) => item.giftWrap).length * 50;
  const shippingFee = subtotal >= 999 ? 0 : 100;
  const total = subtotal + giftWrapFee + shippingFee;

  const breadcrumbs = [{ label: 'Shopping Cart' }];

  return (
    <>
      <Breadcrumb items={breadcrumbs} />
      <div className="min-h-screen bg-gray-50 py-4 sm:py-12">
        <div className="container-custom px-3 sm:px-4">
          <h1 className="text-2xl sm:text-4xl font-display font-bold text-gray-900 mb-4 sm:mb-8">Shopping Cart</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              {validItems.map((item) => (
                <div key={item._id} className="bg-white rounded-lg shadow-md p-3 sm:p-6 animate-slide-up">
                  {/* Top Row: Image + Details */}
                  <div className="flex gap-3 sm:gap-4">
                    {/* Product Image */}
                    <Link
                      to={`/product/${item.product._id}`}
                      className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-gray-200"
                    >
                      <img
                        src={item.product.images?.[0]?.url || '/placeholder.png'}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/product/${item.product._id}`}
                        className="text-sm sm:text-lg font-semibold text-gray-900 hover:text-primary-600 line-clamp-2 block"
                      >
                        {item.product.name}
                      </Link>

                      {item.variant && (
                        <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">Size: {item.variant.size}</p>
                      )}

                      <p className="text-base sm:text-lg font-bold text-primary-600 mt-1">
                        ₹{getItemPrice(item)}
                      </p>
                    </div>

                    {/* Desktop: Quantity, Remove, Total - Hidden on mobile */}
                    <div className="hidden sm:flex flex-col items-end justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                          disabled={updatingItems[item._id] || item.quantity <= 1}
                          className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FiMinus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                          disabled={updatingItems[item._id]}
                          className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FiPlus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item._id)}
                        className="text-red-600 hover:text-red-800 flex items-center gap-1 text-sm"
                      >
                        <FiTrash2 className="w-4 h-4" />
                        Remove
                      </button>

                      {/* Item Total */}
                      <p className="text-lg font-bold text-gray-900">
                        ₹{getItemPrice(item) * item.quantity}
                      </p>
                    </div>
                  </div>

                  {/* Mobile: Quantity controls, Remove, Total */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 sm:hidden">
                    {/* Quantity Controls */}
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                        disabled={updatingItems[item._id] || item.quantity <= 1}
                        className="p-1.5 hover:bg-gray-100 disabled:opacity-50"
                      >
                        <FiMinus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                        disabled={updatingItems[item._id]}
                        className="p-1.5 hover:bg-gray-100 disabled:opacity-50"
                      >
                        <FiPlus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Item Total */}
                    <p className="text-base font-bold text-gray-900">
                      ₹{getItemPrice(item) * item.quantity}
                    </p>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveItem(item._id)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Gift Wrap Option */}
                  {item.product.giftWrapAvailable && (
                    <div className="mt-3 pt-3 border-t border-gray-100 sm:border-0 sm:pt-0">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.giftWrap}
                          onChange={() => handleGiftWrapToggle(item._id)}
                          disabled={updatingItems[item._id]}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <FiGift className="w-4 h-4 text-gray-600" />
                        <span className="text-xs sm:text-sm text-gray-700">
                          Add gift wrap (+₹50)
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Custom Photo Upload for Frame Products */}
                  {item.product.requiresCustomPhoto && (
                    <div className="mt-3 p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <FiImage className="w-4 h-4 text-blue-600" />
                        <span className="text-xs sm:text-sm font-medium text-blue-800">
                          Custom Photo Required
                        </span>
                      </div>

                      {item.customPhoto?.url ? (
                        <div className="flex items-center gap-3">
                          <img
                            src={item.customPhoto.url}
                            alt="Custom"
                            className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg border-2 border-blue-300"
                          />
                          <div className="flex-1">
                            <p className="text-xs text-green-600 font-medium">Photo uploaded!</p>
                            <button
                              onClick={() => handleRemoveCustomPhoto(item._id)}
                              disabled={uploadingPhoto[item._id]}
                              className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 mt-1"
                            >
                              <FiX className="w-3 h-3" />
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            ref={(el) => (fileInputRefs.current[item._id] = el)}
                            onChange={(e) => handleCustomPhotoUpload(item._id, e.target.files[0])}
                            className="hidden"
                          />
                          <button
                            onClick={() => fileInputRefs.current[item._id]?.click()}
                            disabled={uploadingPhoto[item._id]}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {uploadingPhoto[item._id] ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <FiUpload className="w-4 h-4" />
                                Upload Photo
                              </>
                            )}
                          </button>
                          <p className="text-xs text-gray-500 mt-1">
                            This photo will be printed on your frame
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 sticky top-24">
                <h2 className="text-lg sm:text-xl font-display font-bold text-gray-900 mb-3 sm:mb-4">
                  Order Summary
                </h2>

                <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b">
                  <div className="flex justify-between text-sm sm:text-base text-gray-700">
                    <span>Subtotal ({validItems.length} items)</span>
                    <span>₹{subtotal}</span>
                  </div>

                  {giftWrapFee > 0 && (
                    <div className="flex justify-between text-sm sm:text-base text-gray-700">
                      <span>Gift Wrap</span>
                      <span>₹{giftWrapFee}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm sm:text-base text-gray-700">
                    <span>Shipping</span>
                    <span className={shippingFee === 0 ? 'text-green-600 font-semibold' : ''}>
                      {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                    </span>
                  </div>

                  {subtotal < 999 && (
                    <p className="text-xs sm:text-sm text-gray-600">
                      Add ₹{999 - subtotal} more for free shipping
                    </p>
                  )}
                </div>

                <div className="flex justify-between text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-6">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>

                {/* Warning for missing custom photos */}
                {validItems.some(item => item.product.requiresCustomPhoto && !item.customPhoto?.url) && (
                  <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-xs sm:text-sm text-orange-800">
                      <span className="font-medium">Photo required:</span> Please upload photos for all custom frame products before checkout.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => {
                    const missingPhotos = validItems.filter(
                      item => item.product.requiresCustomPhoto && !item.customPhoto?.url
                    );
                    if (missingPhotos.length > 0) {
                      toast.error('Please upload photos for all custom frame products');
                      return;
                    }
                    navigate('/checkout');
                  }}
                  className="btn-primary w-full mb-2 sm:mb-3 py-3 text-sm sm:text-base"
                >
                  Proceed to Checkout
                </button>

                <Link to="/products" className="btn-outline w-full block text-center py-3 text-sm sm:text-base">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CartPage;
