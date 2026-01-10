import { useState, useEffect } from 'react';
import { FiX, FiCopy, FiCheck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

const Treasure = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [treasureConfig, setTreasureConfig] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch treasure config from API
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await API.get('/treasure-config');
        if (data.success && data.config) {
          setTreasureConfig(data.config);
        }
      } catch (error) {
        console.error('Failed to fetch treasure config:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  useEffect(() => {
    // Only show treasure for authenticated users and if config exists
    if (!isAuthenticated || loading || !treasureConfig) {
      setIsVisible(false);
      return;
    }

    const appearanceInterval = treasureConfig.appearanceInterval || 180000; // Default 3 minutes

    // Check if user just logged in
    const justLoggedIn = sessionStorage.getItem('justLoggedIn');
    const now = Date.now();

    // Show immediately if just logged in (always, even if shown recently)
    if (justLoggedIn) {
      console.log('User just logged in - showing treasure immediately');
      sessionStorage.removeItem('justLoggedIn');
      setRandomPosition();
      setIsVisible(true);
      localStorage.setItem('treasureLastShown', now.toString());

      // Set up movement timer
      const moveTimer = setInterval(() => {
        if (!isOpen) {
          setRandomPosition();
        }
      }, 10000);

      return () => clearInterval(moveTimer);
    }

    // For subsequent appearances, check timing
    const lastShownTime = localStorage.getItem('treasureLastShown');
    if (lastShownTime) {
      const timePassed = now - parseInt(lastShownTime);

      if (timePassed >= appearanceInterval) {
        console.log('Interval passed - showing treasure');
        setRandomPosition();
        setIsVisible(true);
        localStorage.setItem('treasureLastShown', now.toString());
      } else {
        const remainingTime = appearanceInterval - timePassed;
        console.log(`Treasure will appear in ${Math.round(remainingTime / 1000)} seconds`);
        const showTimer = setTimeout(() => {
          setRandomPosition();
          setIsVisible(true);
          localStorage.setItem('treasureLastShown', Date.now().toString());
        }, remainingTime);

        return () => clearTimeout(showTimer);
      }
    } else {
      // First time, show after 2 seconds
      console.log('First time - showing treasure in 2 seconds');
      const showTimer = setTimeout(() => {
        setRandomPosition();
        setIsVisible(true);
        localStorage.setItem('treasureLastShown', Date.now().toString());
      }, 2000);

      return () => clearTimeout(showTimer);
    }

    // Move treasure to random position every 10 seconds
    const moveTimer = setInterval(() => {
      if (!isOpen) {
        setRandomPosition();
      }
    }, 10000);

    return () => {
      clearInterval(moveTimer);
    };
  }, [isOpen, isAuthenticated, loading, treasureConfig]);

  const setRandomPosition = () => {
    const treasureSize = window.innerWidth < 640 ? 80 : 100;
    const maxX = window.innerWidth - treasureSize;
    const maxY = window.innerHeight - treasureSize;

    const padding = 20;
    const x = Math.max(padding, Math.min(Math.random() * maxX, maxX - padding));
    const y = Math.max(padding, Math.min(Math.random() * maxY, maxY - padding));

    setPosition({ x, y });
  };

  const handleTreasureClick = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsVisible(false);
    setIsOpen(false);
    localStorage.setItem('treasureLastShown', Date.now().toString());

    const appearanceInterval = treasureConfig?.appearanceInterval || 180000;
    setTimeout(() => {
      setRandomPosition();
      setIsVisible(true);
      localStorage.setItem('treasureLastShown', Date.now().toString());
    }, appearanceInterval);
  };

  const handleCopyCoupon = async () => {
    if (treasureConfig?.couponCode) {
      try {
        await navigator.clipboard.writeText(treasureConfig.couponCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy coupon:', error);
      }
    }
  };

  const handleClaim = () => {
    navigate('/products?discount=treasure');
    setIsVisible(false);
    setIsOpen(false);
    localStorage.setItem('treasureLastShown', Date.now().toString());

    const appearanceInterval = treasureConfig?.appearanceInterval || 180000;
    setTimeout(() => {
      setRandomPosition();
      setIsVisible(true);
      localStorage.setItem('treasureLastShown', Date.now().toString());
    }, appearanceInterval);
  };

  if (!isVisible || !treasureConfig) return null;

  const discountText = treasureConfig.discountType === 'percentage'
    ? `${treasureConfig.discountValue}% OFF`
    : `₹${treasureConfig.discountValue} OFF`;

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
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 transform group-hover:scale-110 transition-transform">
              <img
                src="/treasure-closed-removebg-preview.png"
                alt="Pokisham Treasure"
                className="w-full h-full object-contain drop-shadow-2xl animate-pulse"
              />

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
            <div className="hidden sm:block absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-1 rounded-lg text-xs sm:text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Click to open treasure!
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          </div>
        </div>
      )}

      {/* Treasure Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-75 p-4 animate-fade-in overflow-y-auto">
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
          <div className="relative bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-50 rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md mx-auto my-auto p-5 sm:p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 z-10 p-2 bg-white hover:bg-gray-100 rounded-full transition-colors shadow-md"
            >
              <FiX className="w-5 h-5 text-gray-600" />
            </button>

            {/* Treasure Content */}
            <div className="text-center pt-2">
              {/* Title */}
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 pr-8">
                {treasureConfig.title || 'You Found a Treasure!'}
              </h2>

              {/* Treasure Image */}
              <div className="relative mb-4 mx-auto" style={{ maxWidth: '200px' }}>
                <img
                  src={treasureConfig.treasureImage || '/treasure-offer.png'}
                  alt="Special Offer"
                  className="w-full h-auto object-contain drop-shadow-lg rounded-lg"
                  onError={(e) => {
                    console.error('Failed to load treasure image');
                    e.target.src = '/treasure-offer.png';
                  }}
                />
              </div>

              {/* Discount Badge */}
              <div className="mb-3">
                <span className="inline-block bg-gradient-to-r from-red-500 to-pink-500 text-white px-5 py-2 rounded-full text-base sm:text-lg font-bold shadow-lg">
                  {discountText}
                </span>
              </div>

              {/* Coupon Code Box */}
              <div className="bg-white rounded-xl p-3 sm:p-4 mb-3 shadow-inner border-2 border-dashed border-yellow-400">
                <p className="text-xs text-gray-500 mb-1">Your Coupon Code</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg sm:text-xl font-mono font-bold text-primary-600 tracking-wider">
                    {treasureConfig.couponCode}
                  </span>
                  <button
                    onClick={handleCopyCoupon}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    title="Copy coupon code"
                  >
                    {copied ? (
                      <FiCheck className="w-4 h-4 text-green-500" />
                    ) : (
                      <FiCopy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
                {treasureConfig.minOrderValue > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Min. order: ₹{treasureConfig.minOrderValue}
                  </p>
                )}
                {treasureConfig.maxDiscount && (
                  <p className="text-xs text-gray-500">
                    Max. discount: ₹{treasureConfig.maxDiscount}
                  </p>
                )}
              </div>

              <p className="text-xs text-gray-600 mb-4 px-2">
                {treasureConfig.description || 'Use this special coupon code on your next purchase!'}
              </p>

              <button
                onClick={handleClaim}
                className="btn-primary w-full transform hover:scale-105 transition-all shadow-lg hover:shadow-xl text-sm sm:text-base py-2.5"
              >
                Shop Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Treasure;
