import React, { useState, useEffect } from 'react';
import { FiGift, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Treasure = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hasCollected, setHasCollected] = useState(false);

  useEffect(() => {
    // Only show treasure for authenticated users
    if (!isAuthenticated) {
      setHasCollected(true);
      return;
    }

    // Check if treasure was already collected today
    const lastCollected = localStorage.getItem('treasureCollected');
    const today = new Date().toDateString();

    if (lastCollected === today) {
      setHasCollected(true);
      return;
    }

    // Show treasure after 5 seconds
    const showTimer = setTimeout(() => {
      setRandomPosition();
      setIsVisible(true);
    }, 5000);

    // Move treasure to random position every 10 seconds
    const moveTimer = setInterval(() => {
      if (!isOpen) {
        setRandomPosition();
      }
    }, 10000);

    return () => {
      clearTimeout(showTimer);
      clearInterval(moveTimer);
    };
  }, [isOpen, isAuthenticated]);

  const setRandomPosition = () => {
    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - 100;
    const x = Math.random() * maxX;
    const y = Math.random() * maxY;
    setPosition({ x, y });
  };

  const handleTreasureClick = () => {
    setIsOpen(true);
    // Save collection for today
    localStorage.setItem('treasureCollected', new Date().toDateString());
  };

  const handleClose = () => {
    setIsVisible(false);
    setIsOpen(false);
  };

  const handleClaim = () => {
    // Navigate to a special discount page or show coupon
    navigate('/products?discount=treasure');
    setIsVisible(false);
  };

  if (hasCollected || !isVisible) return null;

  return (
    <>
      {!isOpen && (
        <div
          className="fixed z-50 cursor-pointer animate-bounce"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transition: 'all 1s ease-in-out',
          }}
          onClick={handleTreasureClick}
        >
          {/* Treasure Chest */}
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 rounded-full blur-xl opacity-75 animate-pulse"></div>

            {/* Chest */}
            <div className="relative bg-gradient-to-br from-yellow-600 to-yellow-800 w-20 h-20 rounded-lg shadow-2xl transform group-hover:scale-110 transition-transform">
              <div className="absolute inset-0 flex items-center justify-center">
                <FiGift className="w-10 h-10 text-white animate-pulse" />
              </div>

              {/* Sparkles */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-ping"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>

            {/* Tooltip */}
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Click to open treasure!
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          </div>
        </div>
      )}

      {/* Treasure Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-75 p-4 animate-fade-in">
          {/* Confetti Animation */}
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

          {/* Modal Content */}
          <div className="relative bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-50 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 hover:bg-white rounded-full transition-colors"
            >
              <FiX className="w-6 h-6 text-gray-600" />
            </button>

            {/* Treasure Content */}
            <div className="text-center">
              {/* Animated Treasure Icon */}
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-yellow-500 to-orange-500 w-32 h-32 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                  <FiGift className="w-16 h-16 text-white" />
                </div>
              </div>

              <h2 className="text-3xl font-display font-bold text-gray-900 mb-3 animate-slide-up">
                Congratulations!
              </h2>

              <p className="text-xl text-gray-700 mb-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                You found a treasure!
              </p>

              <div className="bg-white rounded-lg p-6 my-6 shadow-lg animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600 mb-2">
                  15% OFF
                </div>
                <p className="text-gray-600">
                  Special discount on your next purchase!
                </p>
              </div>

              <p className="text-sm text-gray-500 mb-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                This treasure appears once a day. Come back tomorrow for more surprises!
              </p>

              <button
                onClick={handleClaim}
                className="btn-primary w-full transform hover:scale-105 transition-all shadow-lg hover:shadow-xl animate-slide-up"
                style={{ animationDelay: '0.4s' }}
              >
                Claim Your Reward
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Treasure;
