import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiTrash2 } from 'react-icons/fi';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Breadcrumb from '../../components/common/Breadcrumb';
import toast from 'react-hot-toast';

const WishlistPage = () => {
  const navigate = useNavigate();
  const { wishlist, loading, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    document.title = 'Wishlist - Pokisham';
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleAddToCart = async (productId) => {
    await addToCart(productId);
    toast.success('Added to cart!');
  };

  const handleRemoveFromWishlist = async (productId) => {
    await removeFromWishlist(productId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-pink-200 border-t-pink-600 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <FiHeart className="w-6 h-6 text-pink-600 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!wishlist || !wishlist.items || wishlist.items.length === 0) {
    return (
      <div className="container-custom py-12">
        <div className="text-center py-16 animate-fade-in">
          <div className="mb-6 relative inline-block">
            <FiHeart className="w-32 h-32 text-gray-300 mx-auto animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full animate-ping opacity-20"></div>
            </div>
          </div>
          <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">Your Wishlist is Empty</h2>
          <p className="text-gray-600 mb-8 text-lg">Save your favorite items here!</p>
          <Link to="/products" className="btn-primary inline-flex items-center gap-2">
            <FiShoppingCart /> Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  const breadcrumbs = [{ label: 'Wishlist' }];

  return (
    <>
      <Breadcrumb items={breadcrumbs} />
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-12">
        <div className="container-custom">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-gradient mb-2">
              My Wishlist
            </h1>
            <p className="text-gray-600 text-lg">
              {wishlist.items.length} {wishlist.items.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.items.map((item, index) => (
            <div
              key={item._id}
              className="card overflow-hidden group animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Product Image */}
              <Link to={`/product/${item.product._id}`} className="block relative aspect-square overflow-hidden">
                <img
                  src={item.product.images?.[0]?.url || '/placeholder.png'}
                  alt={item.product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />

                {/* Discount Badge */}
                {item.product.discountPrice && item.product.discountPrice < item.product.price && (
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full font-semibold text-sm shadow-lg">
                    {Math.round(((item.product.price - item.product.discountPrice) / item.product.price) * 100)}% OFF
                  </div>
                )}

                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemoveFromWishlist(item.product._id);
                  }}
                  className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-all transform hover:scale-110 hover:rotate-12"
                >
                  <FiTrash2 className="w-5 h-5 text-red-600" />
                </button>

                {/* Out of Stock Overlay */}
                {item.product.stock === 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">
                      Out of Stock
                    </span>
                  </div>
                )}
              </Link>

              {/* Product Details */}
              <div className="p-4">
                <Link to={`/product/${item.product._id}`}>
                  <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 hover:text-primary-600 transition-colors">
                    {item.product.name}
                  </h3>
                </Link>

                {/* Price */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl font-bold text-primary-600">
                    ₹{item.product.discountPrice || item.product.price}
                  </span>
                  {item.product.discountPrice && item.product.discountPrice < item.product.price && (
                    <span className="text-sm text-gray-500 line-through">
                      ₹{item.product.price}
                    </span>
                  )}
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={() => handleAddToCart(item.product._id)}
                  disabled={item.product.stock === 0}
                  className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiShoppingCart /> Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
};

export default WishlistPage;
