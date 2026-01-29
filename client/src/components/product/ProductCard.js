import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiStar } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    addToCart(product._id);
  };

  const handleWishlistToggle = async (e) => {
    e.preventDefault();

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

  const displayPrice = product.discountPrice || product.price;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  // Check if product is new (added within last 7 days)
  const isNewProduct = () => {
    if (!product.createdAt) return false;
    const createdDate = new Date(product.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - createdDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  return (
    <Link to={`/product/${product._id}`} className="card group overflow-hidden">
      {/* Image */}
      <div className="relative overflow-hidden aspect-square bg-gray-100">
        <img
          src={product.images?.[0]?.url || '/placeholder.png'}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {isNewProduct() && (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded font-semibold animate-pulse">
              NEW
            </span>
          )}
          {hasDiscount && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
              {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
            </span>
          )}
          {product.isTrending && (
            <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              <span>🔥</span> Trending
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-primary-50 transition-all duration-300 transform hover:scale-110 ${
            isAnimating ? 'animate-wiggle' : ''
          }`}
        >
          {isInWishlist(product._id) ? (
            <FaHeart className="w-5 h-5 text-primary-600 animate-scale-in" />
          ) : (
            <FiHeart className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {/* Add to Cart / Book Now Button (shown on hover on desktop, always visible on mobile) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          {product.productType === 'booking' ? (
            <span className="w-full bg-white text-primary-600 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-sm md:text-base">
              Book Now
            </span>
          ) : (
            <button
              onClick={handleAddToCart}
              className="w-full bg-white text-primary-600 py-2 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-primary-600 hover:text-white transition-colors text-sm md:text-base"
            >
              <FiShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Add to Cart</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>

        {/* Stock Badge - hidden for booking products */}
        {product.productType !== 'booking' && product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        {product.ratings > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <FiStar className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm text-gray-600">
              {product.ratings.toFixed(1)} ({product.numReviews})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary-600">₹{displayPrice}</span>
          {hasDiscount && (
            <span className="text-sm text-gray-500 line-through">₹{product.price}</span>
          )}
        </div>

        {/* Gift Wrap Available */}
        {product.giftWrapAvailable && (
          <p className="text-xs text-gray-500 mt-2">Gift wrap available</p>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
