import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiTag, FiPackage, FiGrid, FiShoppingBag, FiClock, FiCopy, FiCheck, FiArrowRight, FiShoppingCart } from 'react-icons/fi';
import API from '../../api/axios';
import SEO from '../../components/common/SEO';
import Breadcrumb from '../../components/common/Breadcrumb';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const OffersPage = () => {
  const [offers, setOffers] = useState([]);
  const [comboOffers, setComboOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const [addingCombo, setAddingCombo] = useState(null);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleAddComboToCart = async (combo) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    if (!combo.comboProducts?.length) return;

    setAddingCombo(combo._id);
    try {
      let allAdded = true;
      for (const cp of combo.comboProducts) {
        const productId = cp.product?._id || cp.product;
        const qty = cp.quantity || 1;
        const product = cp.product;
        let variant = null;
        if (cp.variant?.size) {
          variant = { size: cp.variant.size };
        } else if (product?.hasVariants && product?.variants?.length > 0) {
          variant = { size: product.variants[0].size };
        }
        if (productId) {
          const result = await addToCart(productId, qty, variant);
          if (!result) allAdded = false;
        }
      }
      if (allAdded) {
        toast.success('Combo products added to cart!');
        navigate('/cart');
      }
    } catch (error) {
      toast.error('Failed to add combo to cart');
    } finally {
      setAddingCombo(null);
    }
  };

  useEffect(() => {
    fetchAllOffers();
  }, []);

  const fetchAllOffers = async () => {
    try {
      setLoading(true);
      const [offersRes, comboRes] = await Promise.all([
        API.get('/offers?location=all').catch(() => ({ data: { offers: [] } })),
        API.get('/combo-offers/active').catch(() => ({ data: { comboOffers: [] } })),
      ]);
      setOffers(offersRes.data.offers || []);
      setComboOffers(comboRes.data.comboOffers || []);
    } catch (error) {
      console.error('Failed to fetch offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getDaysLeft = (endDate) => {
    const diff = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'Expiring today';
    if (diff === 1) return '1 day left';
    return `${diff} days left`;
  };

  const getComboTypeInfo = (type) => {
    switch (type) {
      case 'fixed_products':
        return { icon: FiPackage, label: 'Bundle Deal', color: 'bg-blue-100 text-blue-700' };
      case 'category_combo':
        return { icon: FiGrid, label: 'Category Combo', color: 'bg-purple-100 text-purple-700' };
      case 'any_n_products':
        return { icon: FiShoppingBag, label: 'Multi-Buy Deal', color: 'bg-green-100 text-green-700' };
      default:
        return { icon: FiTag, label: 'Combo', color: 'bg-gray-100 text-gray-700' };
    }
  };

  const getDiscountText = (combo) => {
    if (combo.comboType === 'fixed_products') {
      // Fixed discount mode: show "Save ₹X"
      if (combo.discountValue > 0) {
        return `Save ₹${combo.discountValue}`;
      }
      // Fixed combo price mode: show "At ₹X"
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
  };

  const getComboDescription = (combo) => {
    switch (combo.comboType) {
      case 'fixed_products':
        return `Buy ${combo.comboProducts?.length || 0} products together`;
      case 'category_combo':
        return `Pick ${combo.minItemsFromCategory || 2}+ items from ${combo.applicableCategories?.map(c => c.name).join(', ') || 'selected categories'}`;
      case 'any_n_products':
        return `Buy any ${combo.minProducts || 2}+ products`;
      default:
        return combo.description || '';
    }
  };

  const hasOffers = offers.length > 0 || comboOffers.length > 0;

  return (
    <>
      <SEO
        title="Offers & Deals - Pokisham"
        description="Discover exciting offers, combo deals, and discounts on handcrafted gifts at Pokisham."
      />
      <Breadcrumb items={[{ label: 'Offers & Deals' }]} />

      <div className="container-custom py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-3">
            Offers & Deals
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Grab the best deals on handcrafted gifts. Combo offers are automatically applied at checkout!
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : !hasOffers ? (
          <div className="text-center py-16">
            <FiTag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Active Offers</h2>
            <p className="text-gray-500 mb-6">Check back soon for exciting deals and discounts!</p>
            <Link to="/products" className="btn-primary inline-flex items-center gap-2">
              Browse Products <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Combo Offers Section */}
            {comboOffers.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <FiPackage className="w-6 h-6 text-primary-600" />
                  Combo Deals
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {comboOffers.map((combo) => {
                    const typeInfo = getComboTypeInfo(combo.comboType);
                    const TypeIcon = typeInfo.icon;
                    return (
                      <div key={combo._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100">
                        {/* Image or Gradient Header */}
                        {combo.image ? (
                          <div className="h-44 overflow-hidden">
                            <img src={combo.image} alt={combo.title} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-32 bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                            <span className="text-white text-3xl font-bold">{getDiscountText(combo)}</span>
                          </div>
                        )}

                        <div className="p-5">
                          {/* Badge & Timer */}
                          <div className="flex items-center justify-between mb-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${typeInfo.color}`}>
                              <TypeIcon className="w-3.5 h-3.5" />
                              {typeInfo.label}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs text-orange-600 font-medium">
                              <FiClock className="w-3.5 h-3.5" />
                              {getDaysLeft(combo.endDate)}
                            </span>
                          </div>

                          {/* Title & Description */}
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{combo.title}</h3>
                          <p className="text-sm text-gray-600 mb-3">
                            {combo.description || getComboDescription(combo)}
                          </p>

                          {/* Combo Details */}
                          {combo.comboType === 'fixed_products' && combo.comboProducts?.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-medium text-gray-500 mb-2">Includes:</p>
                              <div className="flex flex-wrap gap-2">
                                {combo.comboProducts.slice(0, 4).map((cp, idx) => (
                                  <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5">
                                    {cp.product?.images?.[0]?.url && (
                                      <img src={cp.product.images[0].url} alt="" className="w-8 h-8 rounded object-cover" />
                                    )}
                                    <span className="text-xs text-gray-700 font-medium truncate max-w-[120px]">
                                      {cp.product?.name || 'Product'}
                                      {cp.variant?.size && <span className="text-gray-400"> ({cp.variant.size})</span>}
                                    </span>
                                  </div>
                                ))}
                                {combo.comboProducts.length > 4 && (
                                  <span className="text-xs text-gray-500 self-center">+{combo.comboProducts.length - 4} more</span>
                                )}
                              </div>
                            </div>
                          )}

                          {combo.comboType === 'category_combo' && combo.applicableCategories?.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-medium text-gray-500 mb-2">Pick from these categories:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {combo.applicableCategories.map((cat) => (
                                  <Link
                                    key={cat._id}
                                    to={`/products?category=${cat.slug || ''}&combo=${combo._id}&comboMin=${combo.minItemsFromCategory || 2}`}
                                    className="text-xs bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full font-medium hover:bg-primary-100 transition-colors border border-primary-200 inline-flex items-center gap-1"
                                  >
                                    {cat.name} <FiArrowRight className="w-3 h-3" />
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Discount Highlight */}
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                            <span className="text-green-800 font-bold text-lg">{getDiscountText(combo)}</span>
                            {combo.badge && combo.badge !== 'COMBO' && (
                              <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded">{combo.badge}</span>
                            )}
                          </div>

                          {/* CTA */}
                          {combo.comboType === 'fixed_products' && combo.comboProducts?.length > 0 ? (
                            <>
                              <button
                                onClick={() => handleAddComboToCart(combo)}
                                disabled={addingCombo === combo._id}
                                className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors text-sm disabled:opacity-60"
                              >
                                {addingCombo === combo._id ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Adding...
                                  </>
                                ) : (
                                  <>
                                    <FiShoppingCart className="w-4 h-4" />
                                    Add Combo to Cart
                                  </>
                                )}
                              </button>
                              <p className="text-xs text-gray-400 text-center mt-2">Combo discount applied in cart</p>
                            </>
                          ) : combo.comboType === 'category_combo' && combo.applicableCategories?.length > 0 ? (
                            <>
                              <Link
                                to={`/products?category=${combo.applicableCategories[0]?.slug || ''}&combo=${combo._id}&comboMin=${combo.minItemsFromCategory || 2}`}
                                className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors text-sm"
                              >
                                <FiShoppingCart className="w-4 h-4" />
                                Shop & Add to Cart
                              </Link>
                              <p className="text-xs text-gray-400 text-center mt-2">
                                Add {combo.minItemsFromCategory || 2}+ items to get the discount
                              </p>
                            </>
                          ) : (
                            <>
                              <Link
                                to="/products"
                                className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors text-sm"
                              >
                                Shop Now <FiArrowRight className="w-4 h-4" />
                              </Link>
                              <p className="text-xs text-gray-400 text-center mt-2">Auto-applied at checkout</p>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Regular Offers / Coupon Section */}
            {offers.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <FiTag className="w-6 h-6 text-primary-600" />
                  Coupon Offers
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {offers.map((offer) => (
                    <div key={offer._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100">
                      {/* Offer Image or Color Banner */}
                      {offer.image ? (
                        <div className="h-44 overflow-hidden">
                          <img src={offer.image} alt={offer.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div
                          className="h-32 flex items-center justify-center"
                          style={{ backgroundColor: offer.backgroundColor || '#f97316', color: offer.textColor || '#fff' }}
                        >
                          <span className="text-3xl font-bold">
                            {offer.discountType === 'percentage' ? `${offer.discountValue}% OFF` :
                             offer.discountType === 'fixed' ? `₹${offer.discountValue} OFF` : offer.title}
                          </span>
                        </div>
                      )}

                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                            <FiTag className="w-3.5 h-3.5" />
                            {offer.festivalType === 'general' ? 'Offer' : offer.festivalType?.charAt(0).toUpperCase() + offer.festivalType?.slice(1)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-orange-600 font-medium">
                            <FiClock className="w-3.5 h-3.5" />
                            {getDaysLeft(offer.endDate)}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-1">{offer.title}</h3>
                        {offer.description && (
                          <p className="text-sm text-gray-600 mb-3">{offer.description}</p>
                        )}

                        {offer.minOrderAmount > 0 && (
                          <p className="text-xs text-gray-500 mb-3">Min. order: ₹{offer.minOrderAmount}</p>
                        )}

                        {/* Coupon Code */}
                        {offer.couponCode && (
                          <div className="mb-3">
                            <button
                              onClick={() => copyCode(offer.couponCode)}
                              className="w-full flex items-center justify-between border-2 border-dashed border-primary-300 bg-primary-50 rounded-lg px-4 py-2.5 hover:border-primary-400 transition-colors"
                            >
                              <span className="font-mono font-bold text-primary-700 tracking-wider">{offer.couponCode}</span>
                              {copiedCode === offer.couponCode ? (
                                <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                                  <FiCheck className="w-4 h-4" /> Copied!
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-primary-600 text-xs font-medium">
                                  <FiCopy className="w-4 h-4" /> Copy
                                </span>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Discount Highlight */}
                        {offer.discountType !== 'none' && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                            <span className="text-green-800 font-bold text-lg">
                              {offer.discountType === 'percentage' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`}
                            </span>
                            {offer.maxDiscountAmount > 0 && (
                              <span className="text-green-600 text-xs ml-2">up to ₹{offer.maxDiscountAmount}</span>
                            )}
                          </div>
                        )}

                        <Link
                          to={offer.link || '/products'}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors text-sm"
                        >
                          {offer.buttonText || 'Shop Now'} <FiArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default OffersPage;
