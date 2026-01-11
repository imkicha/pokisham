import { useState, useEffect, useRef } from 'react';
import { FiX, FiGift, FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import useBadgeVisibility from '../../hooks/useBadgeVisibility';

const OfferBadge = () => {
  const [offers, setOffers] = useState([]);
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Touch swipe state
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Use badge visibility hook - hides for 15 mins after viewing
  const { shouldShowBadge, markAsViewed } = useBadgeVisibility('offerBadge');

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const { data } = await API.get('/offers?location=homepage_banner');
      if (data.success && data.offers.length > 0) {
        setOffers(data.offers);
      }
    } catch (error) {
      console.error('Failed to fetch offers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cycle through offers every 5 seconds when modal is open
  useEffect(() => {
    if (!isOpen || offers.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentOfferIndex((prev) => (prev + 1) % offers.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [offers.length, isOpen]);

  const handleBadgeClick = () => {
    setIsOpen(true);
    markAsViewed(); // Mark as viewed - badge will hide for 15 mins
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Touch swipe handlers for mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swipe left - next offer
        setCurrentOfferIndex((prev) => (prev + 1) % offers.length);
      } else {
        // Swipe right - previous offer
        setCurrentOfferIndex((prev) => (prev - 1 + offers.length) % offers.length);
      }
    }
  };

  // Don't render if no offers, loading, or badge should be hidden
  if (loading || offers.length === 0 || (!shouldShowBadge && !isOpen)) return null;

  const currentOffer = offers[currentOfferIndex];

  return (
    <>
      {/* Floating Offer Badge - Fixed at bottom right */}
      {!isOpen && shouldShowBadge && (
        <div
          className="fixed bottom-4 right-4 z-50 cursor-pointer animate-bounce"
          onClick={handleBadgeClick}
        >
          <div className="relative group">
            {/* Badge Container */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
              <FiGift className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
              <span className="text-sm sm:text-base font-semibold whitespace-nowrap">
                Special Offers!
              </span>
              {/* Offer Count Badge */}
              {offers.length > 1 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {offers.length}
                </span>
              )}
            </div>

            {/* Sparkle Effects */}
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-300 rounded-full animate-ping opacity-75"></div>
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full animate-ping opacity-75" style={{ animationDelay: '0.5s' }}></div>

            {/* Tooltip on hover - Desktop only */}
            <div className="hidden sm:block absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Click to view offers!
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          </div>
        </div>
      )}

      {/* Offer Modal - Same style as Treasure */}
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
                  backgroundColor: ['#ffd700', '#ffa500', '#ff6347', '#ff69b4', '#87ceeb'][Math.floor(Math.random() * 5)],
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                  borderRadius: Math.random() > 0.5 ? '50%' : '0',
                }}
              />
            ))}
          </div>

          {/* Modal Content - Same background as Treasure */}
          <div
            className="relative bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-50 rounded-2xl shadow-2xl max-w-lg sm:max-w-xl md:max-w-2xl w-full pt-12 sm:pt-14 px-5 pb-5 sm:px-6 sm:pb-6 md:px-8 md:pb-8 animate-scale-in"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Close Button - High z-index to stay on top */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 p-2 bg-white hover:bg-gray-100 rounded-full transition-colors shadow-md border border-gray-200"
            >
              <FiX className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
            </button>

            {/* Offer Content */}
            <div className="text-center">
              {/* Offer Image - Same style as Treasure offer image */}
              <div className="relative inline-block mb-4 sm:mb-6 animate-scale-in w-full">
                {currentOffer.image ? (
                  <img
                    src={currentOffer.image}
                    alt={currentOffer.title}
                    className="w-full h-auto object-contain drop-shadow-2xl rounded-lg"
                  />
                ) : (
                  <div
                    className="w-full h-48 sm:h-64 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: currentOffer.backgroundColor }}
                  >
                    <div className="text-center px-4" style={{ color: currentOffer.textColor }}>
                      <h2 className="text-xl sm:text-2xl font-bold mb-2">
                        {currentOffer.title}
                      </h2>
                      {currentOffer.description && (
                        <p className="text-sm opacity-90 mb-2">
                          {currentOffer.description}
                        </p>
                      )}
                      {currentOffer.discountType !== 'none' && (
                        <span className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-lg font-bold">
                          {currentOffer.discountType === 'percentage'
                            ? `${currentOffer.discountValue}% OFF`
                            : `₹${currentOffer.discountValue} OFF`}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Dots - Only if multiple offers */}
              {offers.length > 1 && (
                <div className="flex justify-center gap-2 mb-4">
                  {offers.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentOfferIndex(index)}
                      className={`rounded-full transition-all duration-300 ${
                        index === currentOfferIndex
                          ? 'w-8 h-3 bg-primary-600'
                          : 'w-3 h-3 bg-gray-400/60 hover:bg-gray-500'
                      }`}
                    />
                  ))}
                </div>
              )}

              <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 animate-slide-up px-2" style={{ animationDelay: '0.2s' }}>
                {offers.length > 1
                  ? `${currentOfferIndex + 1} of ${offers.length} special offers for you!`
                  : 'Special offer just for you!'
                }
              </p>

              <Link
                to={currentOffer.link || '/products'}
                onClick={handleClose}
                className="btn-primary w-full transform hover:scale-105 transition-all shadow-lg hover:shadow-xl animate-slide-up text-sm sm:text-base inline-flex items-center justify-center gap-2"
                style={{ animationDelay: '0.3s' }}
              >
                {currentOffer.buttonText || 'Shop Now'} <FiArrowRight />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OfferBadge;
