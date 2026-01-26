import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiTag, FiArrowRight } from 'react-icons/fi';
import API from '../../api/axios';

const OfferBanner = ({ location = 'homepage_banner' }) => {
  const [offers, setOffers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSliding, setIsSliding] = useState(false);

  useEffect(() => {
    fetchOffers();
  }, [location]);

  const fetchOffers = async () => {
    try {
      const { data } = await API.get(`/offers?location=${location}`);
      if (data.success) {
        setOffers(data.offers);
      }
    } catch (error) {
      console.error('Failed to fetch offers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-slide every 4 seconds
  useEffect(() => {
    if (offers.length <= 1) return;

    const interval = setInterval(() => {
      slideToNext();
    }, 4000);

    return () => clearInterval(interval);
  }, [offers.length, currentIndex]);

  const slideToNext = () => {
    setIsSliding(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % offers.length);
      setIsSliding(false);
    }, 300);
  };

  const slideToPrev = () => {
    setIsSliding(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + offers.length) % offers.length);
      setIsSliding(false);
    }, 300);
  };

  const slideToIndex = (index) => {
    if (index === currentIndex) return;
    setIsSliding(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsSliding(false);
    }, 300);
  };

  if (loading || offers.length === 0) {
    return null;
  }

  const currentOffer = offers[currentIndex];

  return (
    <div className="relative overflow-hidden bg-white">
      {/* Banner Container - auto height based on image */}
      <div className="relative w-full">
        {/* Sliding Content */}
        <div
          className={`w-full transition-all duration-300 ease-in-out ${
            isSliding ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'
          }`}
        >
          {currentOffer.image ? (
            // Image Banner - displays at original size (full width, auto height)
            <Link to={currentOffer.link || '/products'} className="block w-full">
              <img
                src={currentOffer.image}
                alt={currentOffer.title}
                className="w-full h-auto block"
              />
            </Link>
          ) : (
            // Color Background Banner - reduced height for desktop
            <Link
              to={currentOffer.link || '/products'}
              className="block w-full relative h-[240px] sm:h-[320px] lg:h-[500px]"
              style={{ backgroundColor: currentOffer.backgroundColor }}
            >
              <div className="absolute inset-0 flex items-center justify-center px-4 sm:px-8">
                <div className="text-center max-w-4xl mx-auto" style={{ color: currentOffer.textColor }}>
                  {/* Festival Emoji */}
                  <div className="text-3xl sm:text-4xl md:text-5xl mb-2 animate-bounce">
                    {getFestivalEmoji(currentOffer.festivalType)}
                  </div>

                  {/* Title */}
                  <h2 className="text-xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">
                    {currentOffer.title}
                  </h2>

                  {/* Description */}
                  {currentOffer.description && (
                    <p className="text-xs sm:text-base md:text-lg mb-2 opacity-90">
                      {currentOffer.description}
                    </p>
                  )}

                  {/* Discount & Coupon */}
                  {currentOffer.discountType !== 'none' && (
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                      <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 sm:px-4 sm:py-2 rounded-full text-base sm:text-xl font-bold">
                        <FiTag className="w-4 h-4 sm:w-5 sm:h-5" />
                        {currentOffer.discountType === 'percentage'
                          ? `${currentOffer.discountValue}% OFF`
                          : `₹${currentOffer.discountValue} OFF`}
                      </span>
                      {currentOffer.couponCode && (
                        <span className="bg-white/30 backdrop-blur-sm px-3 py-1 sm:px-4 sm:py-2 rounded-full text-sm sm:text-lg font-mono font-bold">
                          Code: {currentOffer.couponCode}
                        </span>
                      )}
                    </div>
                  )}

                  {/* CTA Button */}
                  <button className="inline-flex items-center gap-2 px-4 py-1.5 sm:px-6 sm:py-2 bg-white text-gray-900 rounded-full font-bold hover:scale-105 transition-transform text-xs sm:text-base shadow-xl">
                    {currentOffer.buttonText || 'Shop Now'} <FiArrowRight />
                  </button>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Navigation Arrows */}
        {offers.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault();
                slideToPrev();
              }}
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg z-10"
            >
              <FiChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                slideToNext();
              }}
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg z-10"
            >
              <FiChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {offers.length > 1 && (
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3 z-10">
            {offers.map((_, index) => (
              <button
                key={index}
                onClick={() => slideToIndex(index)}
                className={`rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-8 sm:w-10 h-3 sm:h-4 bg-white'
                    : 'w-3 sm:w-4 h-3 sm:h-4 bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        )}

        {/* Offer Counter */}
        {offers.length > 1 && (
          <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium z-10">
            {currentIndex + 1} / {offers.length}
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

export default OfferBanner;
