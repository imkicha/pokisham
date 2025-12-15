import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiHeart, FiStar, FiCheck, FiShare2, FiCopy, FiX } from 'react-icons/fi';
import { FaHeart, FaWhatsapp, FaFacebookF, FaTwitter, FaTelegram } from 'react-icons/fa';
import API from '../../api/axios';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import ProductCard from '../../components/product/ProductCard';
import Breadcrumb from '../../components/common/Breadcrumb';
import ProductAccordion from '../../components/product/ProductAccordion';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef(null);

  useEffect(() => {
    fetchProduct();
    fetchRelatedProducts();
  }, [id]);

  useEffect(() => {
    if (product) {
      document.title = `${product.name} - Pokisham`;
    }
  }, [product]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/products/${id}`);
      if (data.success) {
        setProduct(data.product);
        if (data.product.hasVariants && data.product.variants.length > 0) {
          setSelectedVariant(data.product.variants[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Product not found');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    try {
      const { data } = await API.get(`/products/${id}/related`);
      if (data.success) {
        setRelatedProducts(data.products);
      }
    } catch (error) {
      console.error('Failed to fetch related products:', error);
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    addToCart(product._id, quantity, selectedVariant);
    toast.success('Added to cart!');
  };

  const handleBookNow = () => {
    if (!isAuthenticated) {
      toast.error('Please login to book');
      navigate('/login');
      return;
    }
    addToCart(product._id, quantity, selectedVariant);
    navigate('/checkout');
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to wishlist');
      navigate('/login');
      return;
    }

    setIsAnimating(true);

    if (isInWishlist(product._id)) {
      await removeFromWishlist(product._id);
    } else {
      await addToWishlist(product._id);
    }

    setTimeout(() => setIsAnimating(false), 500);
  };

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getShareUrl = () => {
    return window.location.href;
  };

  const getShareText = () => {
    return `Check out ${product?.name} on Pokisham! ₹${displayPrice}`;
  };

  const handleShare = async (platform) => {
    const url = getShareUrl();
    const text = getShareText();

    const shareLinks = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    };

    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      } catch (err) {
        toast.error('Failed to copy link');
      }
    } else if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: text,
          url: url,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          setShowShareMenu(true);
        }
      }
    } else if (shareLinks[platform]) {
      window.open(shareLinks[platform], '_blank', 'width=600,height=400');
    }

    setShowShareMenu(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const displayPrice = product.hasVariants && selectedVariant
    ? selectedVariant.price
    : product.discountPrice || product.price;

  const hasDiscount = !product.hasVariants && product.discountPrice && product.discountPrice < product.price;

  const currentStock = product.hasVariants && selectedVariant
    ? selectedVariant.stock
    : product.stock;

  const breadcrumbs = [
    { label: 'Products', path: '/products' },
    { label: product.name }
  ];

  return (
    <>
      <Breadcrumb items={breadcrumbs} />
      <div className="min-h-screen bg-gray-50">
        <div className="container-custom py-12">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Image Gallery */}
            <div>
              <div className="mb-4 relative aspect-square overflow-hidden rounded-lg border border-gray-200">
                <img
                  src={product.images[selectedImage]?.url || '/placeholder.png'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {hasDiscount && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-lg font-semibold">
                    {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {product.images.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-md border-2 overflow-hidden ${
                        selectedImage === index ? 'border-primary-600' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900 mb-4">{product.name}</h1>

              {/* Rating */}
              {product.ratings > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    <FiStar className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-lg font-semibold">{product.ratings.toFixed(1)}</span>
                  </div>
                  <span className="text-gray-600">({product.numReviews} reviews)</span>
                </div>
              )}

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl font-bold text-primary-600">₹{displayPrice}</span>
                  {hasDiscount && (
                    <span className="text-xl text-gray-500 line-through">₹{product.price}</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">Inclusive of all taxes</p>
              </div>

              {/* Variants */}
              {product.hasVariants && product.variants.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Size</label>
                  <div className="grid grid-cols-3 gap-3">
                    {product.variants.map((variant, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedVariant(variant)}
                        className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                          selectedVariant === variant
                            ? 'border-primary-600 bg-primary-50 text-primary-600'
                            : 'border-gray-300 hover:border-primary-300'
                        }`}
                      >
                        <div>{variant.size}</div>
                        <div className="text-xs text-gray-600">₹{variant.price}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock Status */}
              <div className="mb-6">
                {currentStock > 0 ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <FiCheck className="w-5 h-5" />
                    <span className="font-medium">In Stock ({currentStock} available)</span>
                  </div>
                ) : (
                  <div className="text-red-600 font-medium">Out of Stock</div>
                )}
              </div>

              {/* Quantity */}
              {currentStock > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      -
                    </button>
                    <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-4 mb-6">
                {/* Book Now Button */}
                <button
                  onClick={handleBookNow}
                  disabled={currentStock === 0}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-105 transition-all shadow-lg hover:shadow-xl"
                >
                  <FiCheck className="w-5 h-5" /> Book Now
                </button>

                {/* Add to Cart, Wishlist & Share */}
                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={currentStock === 0}
                    className="btn-outline flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-105 transition-transform"
                  >
                    <FiShoppingCart /> Add to Cart
                  </button>
                  <button
                    onClick={handleWishlistToggle}
                    className={`p-3 border-2 border-gray-300 rounded-lg hover:border-primary-500 transition-all transform hover:scale-110 ${
                      isAnimating ? 'animate-wiggle' : ''
                    }`}
                    title="Add to Wishlist"
                  >
                    {isInWishlist(product._id) ? (
                      <FaHeart className="w-6 h-6 text-primary-600 animate-scale-in" />
                    ) : (
                      <FiHeart className="w-6 h-6" />
                    )}
                  </button>

                  {/* Share Button */}
                  <div className="relative" ref={shareMenuRef}>
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          handleShare('native');
                        } else {
                          setShowShareMenu(!showShareMenu);
                        }
                      }}
                      className="p-3 border-2 border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all transform hover:scale-110"
                      title="Share Product"
                    >
                      <FiShare2 className="w-6 h-6" />
                    </button>

                    {/* Share Dropdown Menu */}
                    {showShareMenu && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-scale-in">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">Share via</span>
                            <button
                              onClick={() => setShowShareMenu(false)}
                              className="p-1 hover:bg-gray-100 rounded-full"
                            >
                              <FiX className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => handleShare('whatsapp')}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-colors"
                        >
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <FaWhatsapp className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-gray-700">WhatsApp</span>
                        </button>

                        <button
                          onClick={() => handleShare('facebook')}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors"
                        >
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <FaFacebookF className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-gray-700">Facebook</span>
                        </button>

                        <button
                          onClick={() => handleShare('twitter')}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-sky-50 transition-colors"
                        >
                          <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center">
                            <FaTwitter className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-gray-700">Twitter</span>
                        </button>

                        <button
                          onClick={() => handleShare('telegram')}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors"
                        >
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <FaTelegram className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-gray-700">Telegram</span>
                        </button>

                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button
                            onClick={() => handleShare('copy')}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <FiCopy className="w-4 h-4 text-gray-600" />
                            </div>
                            <span className="text-gray-700">Copy Link</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Product Details</h3>
                <div className="space-y-2 text-sm">
                  {product.material && (
                    <div className="flex">
                      <span className="font-medium w-32">Material:</span>
                      <span className="text-gray-600">{product.material}</span>
                    </div>
                  )}
                  {product.sku && (
                    <div className="flex">
                      <span className="font-medium w-32">SKU:</span>
                      <span className="text-gray-600">{product.sku}</span>
                    </div>
                  )}
                  {product.category && (
                    <div className="flex">
                      <span className="font-medium w-32">Category:</span>
                      <span className="text-gray-600">{product.category.name}</span>
                    </div>
                  )}
                  {product.giftWrapAvailable && (
                    <div className="flex items-center gap-2 text-green-600">
                      <FiCheck /> Gift wrap available
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="border-t pt-6 mt-6">
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Accordion - Description, Shipping, Policies */}
          <div className="mt-8 pt-8 border-t">
            <ProductAccordion product={product} />
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-display font-bold mb-6">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct._id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default ProductDetail;
