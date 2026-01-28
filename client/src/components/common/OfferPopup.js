import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiX, FiChevronLeft, FiChevronRight, FiArrowRight } from 'react-icons/fi';
import API from '../../api/axios';

const OfferPopup = () => {
  const [posters, setPosters] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const SWIPE_THRESHOLD = 50;

  useEffect(() => {
    // Only show once per session
    const alreadyShown = sessionStorage.getItem('offerPopupShown');
    if (alreadyShown) return;

    const fetchPosters = async () => {
      try {
        const { data } = await API.get('/popup/active');

        if (data.success && data.active && data.posters.length > 0) {
          setPosters(data.posters);
          setTimeout(() => setVisible(true), 800);
          sessionStorage.setItem('offerPopupShown', 'true');
        }
      } catch (error) {
        console.error('Failed to fetch popup posters:', error);
      }
    };

    fetchPosters();
  }, []);

  const handleClose = () => {
    setVisible(false);
  };

  const handlePrev = useCallback((e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? posters.length - 1 : prev - 1));
  }, [posters.length]);

  const handleNext = useCallback((e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === posters.length - 1 ? 0 : prev + 1));
  }, [posters.length]);

  // Touch handlers for swipe
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
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (!visible || posters.length === 0) return null;

  const current = posters[currentIndex];

  // Confetti/popper pieces config
  const confettiPieces = [
    { color: '#FF6B6B', left: '5%', top: '8%', delay: '0s', size: '10px', shape: 'circle', duration: '3s' },
    { color: '#FFD93D', left: '15%', top: '20%', delay: '0.5s', size: '8px', shape: 'square', duration: '2.5s' },
    { color: '#6BCB77', left: '85%', top: '12%', delay: '0.3s', size: '12px', shape: 'circle', duration: '3.5s' },
    { color: '#4D96FF', left: '90%', top: '25%', delay: '0.8s', size: '9px', shape: 'square', duration: '2.8s' },
    { color: '#FF6B6B', left: '10%', top: '75%', delay: '0.2s', size: '11px', shape: 'triangle', duration: '3.2s' },
    { color: '#FFD93D', left: '80%', top: '70%', delay: '0.6s', size: '10px', shape: 'circle', duration: '2.6s' },
    { color: '#6BCB77', left: '25%', top: '85%', delay: '0.4s', size: '8px', shape: 'square', duration: '3s' },
    { color: '#4D96FF', left: '70%', top: '80%', delay: '0.7s', size: '13px', shape: 'circle', duration: '2.9s' },
    { color: '#FF9F43', left: '50%', top: '5%', delay: '0.1s', size: '9px', shape: 'triangle', duration: '3.4s' },
    { color: '#A29BFE', left: '35%', top: '10%', delay: '0.9s', size: '11px', shape: 'square', duration: '2.7s' },
    { color: '#FF6B6B', left: '60%', top: '88%', delay: '0.35s', size: '10px', shape: 'circle', duration: '3.1s' },
    { color: '#FFD93D', left: '45%', top: '92%', delay: '0.55s', size: '8px', shape: 'triangle', duration: '2.4s' },
    { color: '#6BCB77', left: '3%', top: '50%', delay: '0.15s', size: '12px', shape: 'square', duration: '3.3s' },
    { color: '#4D96FF', left: '95%', top: '55%', delay: '0.75s', size: '9px', shape: 'circle', duration: '2.5s' },
    { color: '#FF9F43', left: '20%', top: '40%', delay: '0.45s', size: '10px', shape: 'triangle', duration: '3s' },
    { color: '#A29BFE', left: '75%', top: '35%', delay: '0.65s', size: '11px', shape: 'square', duration: '2.8s' },
    { color: '#FF6B6B', left: '40%', top: '60%', delay: '0.25s', size: '8px', shape: 'circle', duration: '3.6s' },
    { color: '#FFD93D', left: '55%', top: '45%', delay: '0.85s', size: '13px', shape: 'triangle', duration: '2.3s' },
  ];

  const getShapeStyle = (piece) => {
    const base = {
      position: 'absolute',
      left: piece.left,
      top: piece.top,
      width: piece.size,
      height: piece.size,
      backgroundColor: piece.color,
      opacity: 0.8,
      animationDelay: piece.delay,
      animationDuration: piece.duration,
    };

    if (piece.shape === 'circle') {
      return { ...base, borderRadius: '50%' };
    } else if (piece.shape === 'triangle') {
      return {
        ...base,
        backgroundColor: 'transparent',
        width: 0,
        height: 0,
        borderLeft: `${parseInt(piece.size) / 2}px solid transparent`,
        borderRight: `${parseInt(piece.size) / 2}px solid transparent`,
        borderBottom: `${piece.size} solid ${piece.color}`,
      };
    }
    // square
    return { ...base, borderRadius: '2px', transform: 'rotate(45deg)' };
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={handleClose}>
      {/* Gray overlay with confetti */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm overflow-hidden">
        {/* Confetti pieces */}
        {confettiPieces.map((piece, i) => (
          <div
            key={i}
            className="animate-confetti-fall pointer-events-none"
            style={getShapeStyle(piece)}
          />
        ))}
      </div>

      {/* Popup content */}
      <div
        className="relative max-w-lg w-full animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute -top-3 -right-3 z-10 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* "New Arrivals" / celebration badge */}
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-sm">🎉</span> New Arrivals & Offers <span className="text-sm">🎉</span>
          </div>
        </div>

        {/* Poster */}
        <div className="rounded-xl overflow-hidden shadow-2xl bg-white mt-2">
          <Link to={current.link || '/offers'} onClick={handleClose}>
            <img
              src={current.image}
              alt={current.title || 'Offer'}
              className="w-full max-h-[70vh] object-contain bg-gray-100 select-none"
              draggable={false}
            />
          </Link>

          {/* Bottom bar */}
          {current.title && (
            <div className="px-4 py-3 flex items-center justify-between bg-white border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 truncate flex-1 mr-3">{current.title}</h3>
              <Link
                to="/offers"
                onClick={handleClose}
                className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 whitespace-nowrap"
              >
                View All Offers <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Navigation arrows for multiple posters */}
          {posters.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full shadow flex items-center justify-center text-gray-700 hover:bg-white transition-colors"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full shadow flex items-center justify-center text-gray-700 hover:bg-white transition-colors"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>

              {/* Dots indicator */}
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-1.5">
                {posters.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(idx);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentIndex ? 'bg-primary-600 w-5' : 'bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Swipe hint for mobile */}
        {posters.length > 1 && (
          <p className="text-center text-white/60 text-xs mt-3 lg:hidden">
            Swipe left or right to see more
          </p>
        )}
      </div>
    </div>
  );
};

export default OfferPopup;
