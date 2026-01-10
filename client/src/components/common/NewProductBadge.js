import { useState, useEffect } from 'react';
import { FiX, FiPackage, FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import API from '../../api/axios';

const NewProductBadge = () => {
  const [newProducts, setNewProducts] = useState([]);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNewProducts();
  }, []);

  const fetchNewProducts = async () => {
    try {
      const { data } = await API.get('/products/new-arrivals?limit=5');
      if (data.success && data.products.length > 0) {
        setNewProducts(data.products);
      }
    } catch (error) {
      console.error('Failed to fetch new products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cycle through products every 4 seconds when modal is open
  useEffect(() => {
    if (!isOpen || newProducts.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentProductIndex((prev) => (prev + 1) % newProducts.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [newProducts.length, isOpen]);

  const handleBadgeClick = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Don't render if no new products or loading
  if (loading || newProducts.length === 0) return null;

  const currentProduct = newProducts[currentProductIndex];

  // Get the main image - handle both object format {url: '...'} and string format
  const getImageUrl = (product) => {
    if (!product.images || product.images.length === 0) {
      return 'https://via.placeholder.com/400x400?text=No+Image';
    }
    const firstImage = product.images[0];
    // Check if it's an object with url property or a direct string
    if (typeof firstImage === 'object' && firstImage.url) {
      return firstImage.url;
    }
    if (typeof firstImage === 'string') {
      return firstImage;
    }
    return 'https://via.placeholder.com/400x400?text=No+Image';
  };

  const productImage = getImageUrl(currentProduct);

  return (
    <>
      {/* Floating New Product Badge - Fixed at bottom left */}
      {!isOpen && (
        <div
          className="fixed bottom-4 left-4 z-50 cursor-pointer animate-bounce"
          onClick={handleBadgeClick}
        >
          <div className="relative group">
            {/* Badge Container */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
              <FiPackage className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
              <span className="text-sm sm:text-base font-semibold whitespace-nowrap">
                New Arrivals!
              </span>
              {/* Product Count Badge */}
              {newProducts.length > 1 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {newProducts.length}
                </span>
              )}
            </div>

            {/* Sparkle Effects */}
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-300 rounded-full animate-ping opacity-75"></div>
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full animate-ping opacity-75" style={{ animationDelay: '0.5s' }}></div>

            {/* Tooltip on hover - Desktop only */}
            <div className="hidden sm:block absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Click to see new products!
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          </div>
        </div>
      )}

      {/* New Product Modal - Same style as Treasure */}
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-75 p-3 sm:p-4 animate-fade-in">
          {/* Confetti Animation - Same as Treasure */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-10%',
                  width: `${Math.random() * 8 + 4}px`,
                  height: `${Math.random() * 8 + 4}px`,
                  backgroundColor: ['#10b981', '#34d399', '#6ee7b7', '#ffd700', '#87ceeb'][Math.floor(Math.random() * 5)],
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                  borderRadius: Math.random() > 0.5 ? '50%' : '0',
                }}
              />
            ))}
          </div>

          {/* Modal Content */}
          <div className="relative bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 rounded-2xl shadow-2xl max-w-lg sm:max-w-xl md:max-w-2xl w-full pt-12 sm:pt-14 px-5 pb-5 sm:px-6 sm:pb-6 md:px-8 md:pb-8 animate-scale-in">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 p-2 bg-white hover:bg-gray-100 rounded-full transition-colors shadow-md border border-gray-200"
            >
              <FiX className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
            </button>

            {/* New Badge */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
              <span className="inline-flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-bold animate-pulse">
                <span>✨</span> NEW
              </span>
            </div>

            {/* Product Content */}
            <div className="text-center">
              {/* Product Image */}
              <div className="relative inline-block mb-4 sm:mb-6 animate-scale-in w-full">
                <div className="bg-white rounded-xl p-4 shadow-inner">
                  <img
                    src={productImage}
                    alt={currentProduct.name}
                    className="w-full h-48 sm:h-64 md:h-72 object-contain drop-shadow-lg rounded-lg mx-auto"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x400?text=No+Image';
                    }}
                  />
                </div>
              </div>

              {/* Product Info */}
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2 line-clamp-2">
                {currentProduct.name}
              </h3>

              {/* Price */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {currentProduct.comparePrice > currentProduct.price && (
                  <span className="text-gray-400 line-through text-sm sm:text-base">
                    ₹{currentProduct.comparePrice}
                  </span>
                )}
                <span className="text-xl sm:text-2xl font-bold text-green-600">
                  ₹{currentProduct.price}
                </span>
                {currentProduct.comparePrice > currentProduct.price && (
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {Math.round(((currentProduct.comparePrice - currentProduct.price) / currentProduct.comparePrice) * 100)}% OFF
                  </span>
                )}
              </div>

              {/* Navigation Dots - Only if multiple products */}
              {newProducts.length > 1 && (
                <div className="flex justify-center gap-2 mb-4">
                  {newProducts.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentProductIndex(index)}
                      className={`rounded-full transition-all duration-300 ${
                        index === currentProductIndex
                          ? 'w-8 h-3 bg-green-600'
                          : 'w-3 h-3 bg-gray-400/60 hover:bg-gray-500'
                      }`}
                    />
                  ))}
                </div>
              )}

              <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 animate-slide-up px-2" style={{ animationDelay: '0.2s' }}>
                {newProducts.length > 1
                  ? `${currentProductIndex + 1} of ${newProducts.length} new arrivals!`
                  : 'Fresh arrival just for you!'
                }
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to={`/product/${currentProduct._id}`}
                  onClick={handleClose}
                  className="flex-1 btn-outline transform hover:scale-105 transition-all text-sm sm:text-base inline-flex items-center justify-center gap-2"
                  style={{ animationDelay: '0.3s' }}
                >
                  View Product
                </Link>
                <Link
                  to="/products?sort=latest"
                  onClick={handleClose}
                  className="flex-1 btn-primary transform hover:scale-105 transition-all shadow-lg hover:shadow-xl animate-slide-up text-sm sm:text-base inline-flex items-center justify-center gap-2"
                  style={{ animationDelay: '0.3s' }}
                >
                  See All New <FiArrowRight />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NewProductBadge;
