import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiArrowRight, FiGift, FiTag, FiStar } from 'react-icons/fi';

const slideData = [
  { id: 'welcome', label: 'Pokisham' },
  { id: 'new-arrivals', label: 'New Arrivals' },
  { id: 'special-offers', label: 'Offers' },
];

const HeroSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const SWIPE_THRESHOLD = 50;

  const totalSlides = slideData.length;

  // Auto-slide every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 8000);
    return () => clearInterval(interval);
  }, [totalSlides]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Welcome Slide
  const renderWelcomeSlide = () => (
    <div className="relative w-full south-indian-pattern overflow-hidden h-[280px] sm:h-[450px] lg:h-[600px]">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 via-pink-500/10 to-secondary-600/20"></div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-12 h-12 sm:w-16 sm:h-16 bg-primary-300 rounded-full opacity-20 animate-float"></div>
        <div className="absolute bottom-[15%] right-[8%] w-16 h-16 sm:w-24 sm:h-24 bg-secondary-300 rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-[20%] right-[15%] w-10 h-10 sm:w-14 sm:h-14 bg-pink-300 rounded-full opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center text-center px-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-2 sm:mb-3 md:mb-4">
            <span className="text-gradient">Pokisham</span> — Handcrafted Gifts, Made with Love
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-700 mb-1 sm:mb-2 md:mb-3 max-w-2xl mx-auto">
            India's trusted online gift store for unique handmade & customized gifts
          </p>
          <p className="text-xs sm:text-sm md:text-base text-gray-500 mb-3 sm:mb-4 md:mb-6 max-w-xl mx-auto">
            Custom frames, pottery, Golu Bommai & personalized keepsakes — delivered to your doorstep
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 btn-primary text-sm sm:text-base transform hover:gap-3 transition-all"
          >
            Explore Pokisham Gifts <FiArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );

  // New Arrivals Slide
  const renderNewArrivalsSlide = () => (
    <div className="relative w-full overflow-hidden h-[280px] sm:h-[450px] lg:h-[600px] bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[8%] right-[10%] w-14 h-14 sm:w-20 sm:h-20 bg-emerald-200 rounded-full opacity-30 animate-float"></div>
        <div className="absolute bottom-[12%] left-[6%] w-16 h-16 sm:w-24 sm:h-24 bg-teal-200 rounded-full opacity-25 animate-float" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-[30%] left-[15%] w-10 h-10 sm:w-14 sm:h-14 bg-cyan-200 rounded-full opacity-20 animate-float" style={{ animationDelay: '0.5s' }}></div>
        <FiStar className="absolute top-[15%] right-[25%] w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 opacity-40 animate-float" style={{ animationDelay: '2s' }} />
        <FiStar className="absolute bottom-[25%] right-[15%] w-5 h-5 sm:w-6 sm:h-6 text-yellow-300 opacity-30 animate-float" style={{ animationDelay: '1s' }} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center text-center px-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
            <FiGift className="w-4 h-4" /> Just Arrived
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-2 sm:mb-3 md:mb-4 text-gray-900">
            Discover <span className="text-emerald-600">New Arrivals</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-1 sm:mb-2 md:mb-3 max-w-2xl mx-auto">
            Fresh handcrafted collections just added to our store
          </p>
          <p className="text-xs sm:text-sm md:text-base text-gray-500 mb-3 sm:mb-4 md:mb-6 max-w-xl mx-auto">
            Be the first to explore our latest pottery, frames & gift sets
          </p>
          <Link
            to="/products?sort=newest"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-full font-semibold text-sm sm:text-base transition-all transform hover:gap-3 shadow-lg hover:shadow-xl"
          >
            Shop New Arrivals <FiArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );

  // Special Offers Slide
  const renderSpecialOffersSlide = () => (
    <div className="relative w-full overflow-hidden h-[280px] sm:h-[450px] lg:h-[600px] bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[8%] w-14 h-14 sm:w-20 sm:h-20 bg-orange-200 rounded-full opacity-30 animate-float"></div>
        <div className="absolute bottom-[10%] right-[6%] w-16 h-16 sm:w-24 sm:h-24 bg-red-200 rounded-full opacity-25 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-[25%] right-[20%] w-10 h-10 sm:w-14 sm:h-14 bg-pink-200 rounded-full opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        <FiTag className="absolute top-[18%] left-[20%] w-6 h-6 sm:w-8 sm:h-8 text-red-400 opacity-40 animate-float" style={{ animationDelay: '0.5s' }} />
        <FiTag className="absolute bottom-[20%] left-[30%] w-5 h-5 sm:w-6 sm:h-6 text-orange-400 opacity-30 animate-float" style={{ animationDelay: '1.5s' }} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center text-center px-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4 animate-pulse">
            <FiTag className="w-4 h-4" /> Limited Time
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-2 sm:mb-3 md:mb-4 text-gray-900">
            <span className="text-red-600">Special Offers</span> Await You
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-1 sm:mb-2 md:mb-3 max-w-2xl mx-auto">
            Exclusive deals on handcrafted gifts & custom frames
          </p>
          <p className="text-xs sm:text-sm md:text-base text-gray-500 mb-3 sm:mb-4 md:mb-6 max-w-xl mx-auto">
            Grab festive discounts before they're gone — use coupon codes at checkout
          </p>
          <Link
            to="/offers"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-full font-semibold text-sm sm:text-base transition-all transform hover:gap-3 shadow-lg hover:shadow-xl"
          >
            View All Offers <FiArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );

  const renderSlide = () => {
    switch (slideData[currentIndex].id) {
      case 'welcome':
        return renderWelcomeSlide();
      case 'new-arrivals':
        return renderNewArrivalsSlide();
      case 'special-offers':
        return renderSpecialOffersSlide();
      default:
        return renderWelcomeSlide();
    }
  };

  return (
    <div
      className="relative overflow-hidden bg-white"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative w-full">
        <div className="w-full transition-all duration-500 ease-in-out">
          {renderSlide()}
        </div>

        {/* Navigation Arrows - visible on hover (desktop) */}
        <div className={`hidden sm:block transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={goPrev}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg z-10 group"
          >
            <FiChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800 group-hover:text-primary-600" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg z-10 group"
          >
            <FiChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800 group-hover:text-primary-600" />
          </button>
        </div>

        {/* Dots Indicator - always visible */}
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3 z-10">
          {slideData.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => setCurrentIndex(index)}
              className={`rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-8 sm:w-10 h-3 sm:h-4 bg-primary-600'
                  : 'w-3 sm:w-4 h-3 sm:h-4 bg-gray-400/60 hover:bg-gray-500'
              }`}
              title={slide.label}
            />
          ))}
        </div>

        {/* Slide Counter - hover only */}
        <div className={`absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium z-10 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          {currentIndex + 1} / {totalSlides}
        </div>
      </div>
    </div>
  );
};

export default HeroSlider;
