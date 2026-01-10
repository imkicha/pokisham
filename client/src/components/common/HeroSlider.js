import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiTag, FiArrowRight } from 'react-icons/fi';
import API from '../../api/axios';

const HeroSlider = () => {
  const [offers, setOffers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSliding, setIsSliding] = useState(false);
  const [slideDirection, setSlideDirection] = useState('right');
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const { data } = await API.get('/offers?location=homepage_banner');
      if (data.success) {
        setOffers(data.offers);
      }
    } catch (error) {
      console.error('Failed to fetch offers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Total slides = 1 (welcome) + offers
  const totalSlides = 1 + offers.length;

  // Auto-slide every 10 seconds
  useEffect(() => {
    if (totalSlides <= 1) return;

    const interval = setInterval(() => {
      slideToNext();
    }, 10000);

    return () => clearInterval(interval);
  }, [totalSlides, currentIndex]);

  const slideToNext = () => {
    if (isSliding) return;
    setSlideDirection('right');
    setIsSliding(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
      setIsSliding(false);
    }, 400);
  };

  const slideToPrev = () => {
    if (isSliding) return;
    setSlideDirection('left');
    setIsSliding(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
      setIsSliding(false);
    }, 400);
  };

  const slideToIndex = (index) => {
    if (index === currentIndex || isSliding) return;
    setSlideDirection(index > currentIndex ? 'right' : 'left');
    setIsSliding(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsSliding(false);
    }, 400);
  };

  // Get animation classes based on slide direction
  const getSlideAnimation = () => {
    if (!isSliding) return 'opacity-100 translate-x-0';
    if (slideDirection === 'right') {
      return 'opacity-0 -translate-x-full';
    }
    return 'opacity-0 translate-x-full';
  };

  // Render Welcome Slide (index 0)
  // Height: 1920x700 ratio (mobile: 280px, tablet: 450px, desktop: 700px)
  const renderWelcomeSlide = () => (
    <div className="relative w-full south-indian-pattern overflow-hidden h-[280px] sm:h-[450px] lg:h-[700px]">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 via-pink-500/10 to-secondary-600/20"></div>

      {/* Animated floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-12 h-12 sm:w-16 sm:h-16 bg-primary-300 rounded-full opacity-20 animate-float"></div>
        <div className="absolute bottom-[15%] right-[8%] w-16 h-16 sm:w-24 sm:h-24 bg-secondary-300 rounded-full opacity-20 animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-[20%] right-[15%] w-10 h-10 sm:w-14 sm:h-14 bg-pink-300 rounded-full opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center text-center px-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-2 sm:mb-3 md:mb-4">
            Welcome to <span className="text-gradient">Pokisham</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-700 mb-3 sm:mb-4 md:mb-6 max-w-2xl mx-auto">
            Discover authentic South Indian gifts, custom frames, pottery, and traditional Golu Bommai
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 btn-primary text-sm sm:text-base transform hover:gap-3 transition-all"
          >
            Shop Now <FiArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );

  // Render Offer Slide
  const renderOfferSlide = (offer) => {
    if (offer.image) {
      // Full banner image - display at full natural size
      return (
        <Link to={offer.link || '/products'} className="block w-full">
          <img
            src={offer.image}
            alt={offer.title}
            className="w-full h-auto block"
          />
        </Link>
      );
    }

    // Color Background Banner - 1920x700 ratio
    return (
      <Link
        to={offer.link || '/products'}
        className="block w-full relative h-[280px] sm:h-[450px] lg:h-[700px]"
        style={{ backgroundColor: offer.backgroundColor }}
      >
        <div className="absolute inset-0 flex items-center justify-center px-4 sm:px-8">
          <div className="text-center max-w-4xl mx-auto" style={{ color: offer.textColor }}>
            {/* Festival Emoji */}
            <div className="text-3xl sm:text-4xl md:text-6xl mb-2 sm:mb-3 animate-bounce">
              {getFestivalEmoji(offer.festivalType)}
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-3xl md:text-5xl font-bold mb-1 sm:mb-2 md:mb-4">
              {offer.title}
            </h2>

            {/* Description */}
            {offer.description && (
              <p className="text-xs sm:text-base md:text-xl mb-2 sm:mb-4 opacity-90">
                {offer.description}
              </p>
            )}

            {/* Discount & Coupon */}
            {offer.discountType !== 'none' && (
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-2 sm:mb-4">
                <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 sm:px-5 sm:py-2 rounded-full text-base sm:text-xl font-bold animate-pulse">
                  <FiTag className="w-4 h-4 sm:w-5 sm:h-5" />
                  {offer.discountType === 'percentage'
                    ? `${offer.discountValue}% OFF`
                    : `₹${offer.discountValue} OFF`}
                </span>
                {offer.couponCode && (
                  <span className="bg-white/30 backdrop-blur-sm px-3 py-1 sm:px-5 sm:py-2 rounded-full text-sm sm:text-lg font-mono font-bold">
                    Code: {offer.couponCode}
                  </span>
                )}
              </div>
            )}

            {/* CTA Button */}
            <span className="inline-flex items-center gap-2 px-4 py-1.5 sm:px-6 sm:py-2 bg-white text-gray-900 rounded-full font-bold hover:scale-105 transition-transform text-xs sm:text-base shadow-xl">
              {offer.buttonText || 'Shop Now'} <FiArrowRight />
            </span>
          </div>
        </div>
      </Link>
    );
  };

  // Render current slide content
  const renderCurrentSlide = () => {
    if (currentIndex === 0) {
      return renderWelcomeSlide();
    }
    const offer = offers[currentIndex - 1];
    if (!offer) return renderWelcomeSlide();
    return renderOfferSlide(offer);
  };

  if (loading) {
    return (
      <div className="w-full h-[280px] sm:h-[450px] lg:h-[700px] bg-gradient-to-br from-primary-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden bg-white"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slider Container - auto height based on content */}
      <div className="relative w-full">
        {/* Current Slide */}
        <div
          className={`w-full transition-all duration-400 ease-in-out transform ${getSlideAnimation()}`}
        >
          {renderCurrentSlide()}
        </div>

        {/* Navigation Arrows - Show on hover */}
        {totalSlides > 1 && (
          <div className={`transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <button
              onClick={(e) => {
                e.preventDefault();
                slideToPrev();
              }}
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg z-10 group"
            >
              <FiChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800 group-hover:text-primary-600" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                slideToNext();
              }}
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg z-10 group"
            >
              <FiChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800 group-hover:text-primary-600" />
            </button>
          </div>
        )}

        {/* Dots Indicator - Show on hover */}
        {totalSlides > 1 && (
          <div className={`absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3 z-10 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => slideToIndex(index)}
                className={`rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-8 sm:w-10 h-3 sm:h-4 bg-primary-600'
                    : 'w-3 sm:w-4 h-3 sm:h-4 bg-gray-400/60 hover:bg-gray-500'
                }`}
                title={index === 0 ? 'Welcome' : `Offer ${index}`}
              />
            ))}
          </div>
        )}

        {/* Slide Counter - Show on hover */}
        {totalSlides > 1 && (
          <div className={`absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium z-10 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            {currentIndex + 1} / {totalSlides}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to get festival emoji
const getFestivalEmoji = (type) => {
  const emojis = {
    diwali: '🪔',
    pongal: '🌾',
    navratri: '🙏',
    christmas: '🎄',
    newyear: '🎉',
    onam: '🌺',
    ugadi: '🌸',
    holi: '🎨',
    eid: '🌙',
    sale: '🏷️',
    general: '📢',
    other: '✨',
  };
  return emojis[type] || '✨';
};

export default HeroSlider;
