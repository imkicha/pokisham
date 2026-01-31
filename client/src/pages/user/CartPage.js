import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiGift, FiImage, FiUpload, FiX, FiPercent, FiPackage } from 'react-icons/fi';
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
  const [comboDiscounts, setComboDiscounts] = useState([]);
  const [removingSet, setRemovingSet] = useState(null);
  const fileInputRefs = useRef({});

  useEffect(() => {
    document.title = 'Shopping Cart - Pokisham';
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Validate combo offers when cart changes
  const validateCombos = useCallback(async () => {
    const validItems = cart?.items?.filter((item) => item.product !== null) || [];
    if (validItems.length === 0) {
      setComboDiscounts([]);
      return;
    }

    try {
      const cartItems = validItems.map((item) => {
        let price;
        if (item.variant && item.product.hasVariants) {
          const variant = item.product.variants?.find((v) => v.size === item.variant.size);
          price = variant ? variant.price : item.product.price;
        } else {
          price = item.product.discountPrice || item.product.price;
        }
        return {
          product: { _id: item.product._id },
          quantity: item.quantity,
          price,
          variant: item.variant || null,
        };
      });

      const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const { data } = await API.post('/combo-offers/validate', { cartItems, cartTotal });
      if (data.success && data.combos?.length > 0) {
        setComboDiscounts(data.combos);
      } else {
        setComboDiscounts([]);
      }
    } catch {
      setComboDiscounts([]);
    }
  }, [cart]);

  useEffect(() => {
    if (isAuthenticated && cart?.items?.length > 0) {
      validateCombos();
    }
  }, [isAuthenticated, cart, validateCombos]);

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

  const handleRemoveComboSet = async (comboId, setNumber) => {
    const combo = comboDiscounts.find(c => c._id === comboId);
    if (!combo?.matchedProducts?.length) return;
    setRemovingSet(`${comboId}-${setNumber}`);
    try {
      const qtyPerProduct = {};
      combo.matchedProducts.forEach(mp => {
        const pid = (mp.productId?._id || mp.productId)?.toString();
        qtyPerProduct[pid] = Math.floor(mp.quantity / (combo.sets || 1));
      });

      const validItems = cart?.items?.filter((item) => item.product !== null) || [];
      for (const item of validItems) {
        const pid = item.product._id.toString();
        const perSet = qtyPerProduct[pid];
        if (!perSet) continue;
        const newQty = item.quantity - perSet;
        if (newQty <= 0) {
          await removeFromCart(item._id);
        } else {
          await updateCartItem(item._id, newQty, item.giftWrap);
        }
      }
      toast.success('Combo set removed');
    } catch {
      toast.error('Failed to remove combo set');
    } finally {
      setRemovingSet(null);
    }
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

  // Calculate packing charges from products
  const packingCharge = validItems.reduce((acc, item) => {
    const productPackingCharge = item.product.packingCharge || 0;
    return acc + (productPackingCharge * item.quantity);
  }, 0);

  // Check if any product has "to_pay" delivery type
  const hasToPayDelivery = validItems.some((item) => {
    const chargeType = item.product.deliveryChargeType || 'to_pay';
    return chargeType === 'to_pay';
  });

  // Calculate fixed delivery charges (added to total)
  const deliveryChargeFixed = validItems.reduce((acc, item) => {
    const chargeType = item.product.deliveryChargeType || 'to_pay';
    if (chargeType === 'fixed') {
      const productDeliveryCharge = item.product.deliveryCharge || 0;
      return acc + (productDeliveryCharge * item.quantity);
    }
    return acc;
  }, 0);

  const comboDiscountAmount = comboDiscounts.reduce((sum, c) => sum + (c.discount || 0), 0);
  const total = subtotal + giftWrapFee + packingCharge + deliveryChargeFixed - comboDiscountAmount;

  // Build combo set grouping for display (supports multiple combos)
  const allComboSets = comboDiscounts.length > 0
    ? (() => {
        const allAllocatedIds = new Map(); // productId -> total allocated qty across all combos
        const comboGroups = [];

        for (const combo of comboDiscounts) {
          if (!combo.matchedProducts?.length) continue;
          const sets = combo.sets || 1;

          const qtyPerProduct = {};
          combo.matchedProducts.forEach(mp => {
            const pid = (mp.productId?._id || mp.productId)?.toString();
            qtyPerProduct[pid] = Math.floor(mp.quantity / sets);
          });

          const comboItems = validItems.filter(item => {
            const pid = item.product._id.toString();
            return qtyPerProduct[pid] > 0;
          });

          const setsArr = [];
          for (let s = 0; s < sets; s++) {
            setsArr.push({
              setNumber: s + 1,
              items: comboItems.map(item => ({
                ...item,
                comboQty: qtyPerProduct[item.product._id.toString()] || 1,
              })),
            });
          }

          // Track allocated qty
          comboItems.forEach(item => {
            const pid = item.product._id.toString();
            const totalUsed = (qtyPerProduct[pid] || 1) * sets;
            allAllocatedIds.set(pid, (allAllocatedIds.get(pid) || 0) + totalUsed);
          });

          comboGroups.push({ combo, sets: setsArr });
        }

        // Non-combo items: items not in any combo
        const nonComboItems = validItems.filter(item => {
          const pid = item.product._id.toString();
          return !allAllocatedIds.has(pid);
        });

        // Leftover qty: items partially in combos
        const leftovers = [];
        validItems.forEach(item => {
          const pid = item.product._id.toString();
          const allocated = allAllocatedIds.get(pid) || 0;
          if (allocated > 0 && item.quantity > allocated) {
            leftovers.push({ ...item, leftoverQty: item.quantity - allocated });
          }
        });

        return { comboGroups, nonComboItems, leftovers };
      })()
    : null;

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
              {/* Combo Offers Section */}
              {allComboSets && allComboSets.comboGroups.length > 0 && (
                <div className="flex items-center gap-2 pb-1">
                  <FiPackage className="w-4 h-4 text-green-600" />
                  <h2 className="text-sm sm:text-base font-semibold text-green-800">Combo Offers</h2>
                  <div className="flex-1 h-px bg-green-200" />
                </div>
              )}
              {allComboSets && allComboSets.comboGroups.map(({ combo, sets }) =>
                sets.map((set) => (
                  <div key={`${combo._id}-set-${set.setNumber}`} className="bg-white rounded-lg shadow-md overflow-hidden animate-slide-up">
                    {/* Set Header */}
                    <div className="bg-green-50 border-b border-green-200 px-3 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FiPackage className="w-4 h-4 text-green-600" />
                        <span className="text-xs sm:text-sm font-semibold text-green-800">
                          {combo.title}{sets.length > 1 ? ` — Set ${set.setNumber}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {combo.discountPerSet > 0 && (
                          <span className="text-xs sm:text-sm font-bold text-green-700">
                            {combo.pricingMode === 'fixed_price' && combo.comboPrice > 0
                              ? `At ₹${combo.comboPrice}`
                              : `Save ₹${combo.discountPerSet}`}
                          </span>
                        )}
                        <button
                          onClick={() => handleRemoveComboSet(combo._id, set.setNumber)}
                          disabled={removingSet === `${combo._id}-${set.setNumber}`}
                          className="text-red-400 hover:text-red-600 disabled:opacity-50 p-1"
                          title="Remove this set"
                        >
                          {removingSet === `${combo._id}-${set.setNumber}` ? (
                            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FiTrash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Set Items */}
                    <div className="divide-y divide-gray-100">
                      {set.items.map((item) => (
                        <div key={`${item._id}-${combo._id}-set-${set.setNumber}`} className="px-3 sm:px-5 py-2.5 sm:py-3">
                          <div className="flex gap-3 items-center">
                            <Link
                              to={`/product/${item.product._id}`}
                              className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border border-gray-200"
                            >
                              <img
                                src={item.product.images?.[0]?.url || '/placeholder.png'}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            </Link>
                            <div className="flex-1 min-w-0">
                              <Link
                                to={`/product/${item.product._id}`}
                                className="text-sm font-medium text-gray-900 hover:text-primary-600 line-clamp-1 block"
                              >
                                {item.product.name}
                              </Link>
                              {item.product.hasVariants && item.product.variants?.length > 0 && (
                                <select
                                  value={item.variant?.size || ''}
                                  onChange={async (e) => {
                                    const newSize = e.target.value;
                                    await updateCartItem(item._id, item.quantity, item.giftWrap, { size: newSize });
                                    await fetchCart();
                                  }}
                                  className="mt-0.5 text-xs px-1.5 py-0.5 border border-gray-200 rounded bg-gray-50 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                >
                                  {item.product.variants.map((v) => (
                                    <option key={v.size} value={v.size}>
                                      {v.size} — ₹{v.price}
                                    </option>
                                  ))}
                                </select>
                              )}
                              <p className="text-xs text-gray-500 mt-0.5">
                                Qty: {item.comboQty} × ₹{getItemPrice(item)}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-gray-700">
                              ₹{getItemPrice(item) * item.comboQty}
                            </p>
                          </div>

                          {/* Custom Photo Upload for combo frame products */}
                          {item.product.requiresCustomPhoto && (
                            <div className="mt-2 ml-15 sm:ml-[68px] p-2 bg-blue-50 rounded-lg border border-blue-200">
                              {item.customPhoto?.url ? (
                                <div className="flex items-center gap-2">
                                  <img
                                    src={item.customPhoto.url}
                                    alt="Custom"
                                    className="w-10 h-10 object-cover rounded border-2 border-blue-300"
                                  />
                                  <p className="text-xs text-green-600 font-medium flex-1">Photo uploaded!</p>
                                  <button
                                    onClick={() => handleRemoveCustomPhoto(item._id)}
                                    disabled={uploadingPhoto[item._id]}
                                    className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                                  >
                                    <FiX className="w-3 h-3" />
                                    Remove
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <FiImage className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                  <span className="text-xs text-blue-800 flex-1">Upload your photo</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    ref={(el) => (fileInputRefs.current[`combo-${item._id}`] = el)}
                                    onChange={(e) => handleCustomPhotoUpload(item._id, e.target.files[0])}
                                    className="hidden"
                                  />
                                  <button
                                    onClick={() => fileInputRefs.current[`combo-${item._id}`]?.click()}
                                    disabled={uploadingPhoto[item._id]}
                                    className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                                  >
                                    {uploadingPhoto[item._id] ? (
                                      <>
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Uploading...
                                      </>
                                    ) : (
                                      <>
                                        <FiUpload className="w-3 h-3" />
                                        Upload
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Set Footer */}
                    <div className="bg-green-50/50 border-t border-green-100 px-3 sm:px-5 py-1.5 sm:py-2 flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs text-gray-500">
                        Original: ₹{set.items.reduce((s, i) => s + getItemPrice(i) * i.comboQty, 0)}
                      </span>
                      <span className="text-[10px] sm:text-xs font-semibold text-green-700">
                        {combo.pricingMode === 'fixed_price' && combo.comboPrice > 0
                          ? `Combo: ₹${combo.comboPrice}`
                          : `You save ₹${combo.discountPerSet || 0}`}
                      </span>
                    </div>
                  </div>
                ))
              )}

              {/* Individual Items Section */}
              {allComboSets && allComboSets.comboGroups.length > 0 && (allComboSets.nonComboItems.length > 0 || allComboSets.leftovers.length > 0) && (
                <div className="flex items-center gap-2 pt-2 pb-1">
                  <FiShoppingBag className="w-4 h-4 text-gray-500" />
                  <h2 className="text-sm sm:text-base font-semibold text-gray-700">Individual Items</h2>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              )}
              {(allComboSets ? [...allComboSets.nonComboItems, ...allComboSets.leftovers] : validItems).map((item) => {
                const showQty = item.leftoverQty || item.quantity;
                return (
                <div key={item.leftoverQty ? `${item._id}-leftover` : item._id} className="bg-white rounded-lg shadow-md p-3 sm:p-6 animate-slide-up">
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
                          disabled={updatingItems[item._id] || showQty <= 1}
                          className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FiMinus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-semibold">{showQty}</span>
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
                        ₹{getItemPrice(item) * showQty}
                      </p>
                    </div>
                  </div>

                  {/* Mobile: Quantity controls, Remove, Total */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 sm:hidden">
                    {/* Quantity Controls */}
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                        disabled={updatingItems[item._id] || showQty <= 1}
                        className="p-1.5 hover:bg-gray-100 disabled:opacity-50"
                      >
                        <FiMinus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-semibold text-sm">{showQty}</span>
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
                      ₹{getItemPrice(item) * showQty}
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
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 sticky top-24">
                <h2 className="text-lg sm:text-xl font-display font-bold text-gray-900 mb-3 sm:mb-4">
                  Order Summary
                </h2>

                {/* Product line items - grouped by combo vs individual */}
                <div className="space-y-3 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b">
                  {/* Combo groups */}
                  {allComboSets && allComboSets.comboGroups.map(({ combo, sets }) => {
                    const originalPrice = sets[0].items.reduce((s, i) => s + getItemPrice(i) * i.comboQty, 0) * sets.length;
                    const savings = (combo.discountPerSet || 0) * sets.length;
                    const comboTotal = originalPrice - savings;
                    return (
                      <div key={`summary-combo-${combo._id}`} className="bg-green-50 rounded-lg p-2.5 sm:p-3">
                        {/* Combo header */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <FiPackage className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-xs sm:text-sm font-semibold text-green-800">
                            {combo.title} × {sets.length}
                          </span>
                        </div>

                        {/* Each item with image and price */}
                        <div className="space-y-1.5">
                          {sets[0].items.map((item) => (
                            <div key={`sc-${combo._id}-${item._id}`} className="flex items-center gap-2">
                              <img
                                src={item.product.images?.[0]?.url || '/placeholder.png'}
                                alt={item.product.name}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded object-cover flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm text-gray-700 line-clamp-1">
                                  {item.product.name}
                                  {item.variant?.size && <span className="text-gray-400"> ({item.variant.size})</span>}
                                </p>
                                <p className="text-[10px] sm:text-xs text-gray-400">Qty: {item.comboQty * sets.length} × ₹{getItemPrice(item)}</p>
                              </div>
                              <span className="text-xs sm:text-sm text-gray-500 line-through">₹{getItemPrice(item) * item.comboQty * sets.length}</span>
                            </div>
                          ))}
                        </div>

                        {/* Combo price and savings */}
                        <div className="mt-2 pt-2 border-t border-green-200 flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-bold text-green-700">
                            {combo.pricingMode === 'fixed_price' ? 'Bundle Price' : 'Combo Price'}
                          </span>
                          <div className="text-right">
                            <span className="text-xs sm:text-sm font-bold text-green-700">₹{comboTotal}</span>
                            {savings > 0 && (
                              <p className="text-[10px] sm:text-xs text-green-600">Save ₹{savings}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Individual / leftover items */}
                  {(allComboSets && (allComboSets.nonComboItems.length > 0 || allComboSets.leftovers.length > 0)) && (
                    <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide pt-1">Individual Items</p>
                  )}
                  {(allComboSets ? [...allComboSets.nonComboItems, ...allComboSets.leftovers] : validItems).map((item) => {
                    const showQty = item.leftoverQty || item.quantity;
                    return (
                      <div key={`summary-${item._id}${item.leftoverQty ? '-left' : ''}`} className="flex items-center gap-2">
                        <img
                          src={item.product.images?.[0]?.url || '/placeholder.png'}
                          alt={item.product.name}
                          className="w-8 h-8 rounded object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm text-gray-700 line-clamp-1">{item.product.name}</p>
                          <p className="text-[10px] sm:text-xs text-gray-400">Qty: {showQty} × ₹{getItemPrice(item)}</p>
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-800">₹{getItemPrice(item) * showQty}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b">
                  <div className="flex justify-between text-sm sm:text-base text-gray-700">
                    <span>Subtotal ({validItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                    <span>₹{subtotal}</span>
                  </div>

                  {packingCharge > 0 && (
                    <div className="flex justify-between text-sm sm:text-base text-gray-700">
                      <span>Packing Charges</span>
                      <span>₹{packingCharge}</span>
                    </div>
                  )}

                  {giftWrapFee > 0 && (
                    <div className="flex justify-between text-sm sm:text-base text-gray-700">
                      <span>Gift Wrap</span>
                      <span>₹{giftWrapFee}</span>
                    </div>
                  )}

                  {deliveryChargeFixed > 0 && (
                    <div className="flex justify-between text-sm sm:text-base text-gray-700">
                      <span>Delivery Charge</span>
                      <span className="text-green-600 font-medium">₹{deliveryChargeFixed}</span>
                    </div>
                  )}

                  {hasToPayDelivery && (
                    <>
                      <div className="flex justify-between text-sm sm:text-base text-gray-500">
                        <span>Delivery</span>
                        <span className="text-orange-600 font-medium">To Pay</span>
                      </div>
                      <p className="text-xs text-orange-500">*Delivery charge to be paid on arrival</p>
                    </>
                  )}

                  {deliveryChargeFixed === 0 && !hasToPayDelivery && (
                    <div className="flex justify-between text-sm sm:text-base text-gray-700">
                      <span>Delivery</span>
                      <span className="text-green-600 font-medium">Free</span>
                    </div>
                  )}
                </div>

                {/* Combo Discounts */}
                {comboDiscounts.length > 0 && (
                  <div className="mb-3 sm:mb-4 space-y-2">
                    {comboDiscounts.map((combo) => (
                      <div key={combo._id} className="p-2.5 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <FiPercent className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-green-800">
                              {combo.title}
                              {combo.sets > 1 && (
                                <span className="text-green-600 font-normal"> x{combo.sets} sets</span>
                              )}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {combo.badge && (
                                <span className="inline-block text-[10px] sm:text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                                  {combo.badge}
                                </span>
                              )}
                              {combo.sets > 1 && combo.discountPerSet > 0 && (
                                <span className="text-[10px] sm:text-xs text-green-600">
                                  {combo.pricingMode === 'fixed_price' && combo.comboPrice > 0
                                    ? `₹${combo.comboPrice}/set`
                                    : `Save ₹${combo.discountPerSet}/set`}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-sm sm:text-base font-bold text-green-700 whitespace-nowrap">
                            -₹{combo.discount}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-6">
                  <span>Total</span>
                  <div className="text-right">
                    {comboDiscountAmount > 0 && (
                      <span className="block text-xs sm:text-sm text-gray-400 line-through font-normal">
                        ₹{total + comboDiscountAmount}
                      </span>
                    )}
                    <span>₹{total}</span>
                  </div>
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
