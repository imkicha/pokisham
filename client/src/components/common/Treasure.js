import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Treasure = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Only show treasure for authenticated users
    if (!isAuthenticated) {
      setIsVisible(false);
      return;
    }

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
      // Check if 3 minutes have passed since last shown
      const timePassed = now - parseInt(lastShownTime);
      const threeMinutes = 3 * 60 * 1000; // 3 minutes in milliseconds

      if (timePassed >= threeMinutes) {
        // Show immediately if 3 minutes passed
        console.log('3 minutes passed - showing treasure');
        setRandomPosition();
        setIsVisible(true);
        localStorage.setItem('treasureLastShown', now.toString());
      } else {
        // Show after remaining time
        const remainingTime = threeMinutes - timePassed;
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
  }, [isOpen, isAuthenticated]);

  const setRandomPosition = () => {
    // Adjust treasure size based on screen width
    const treasureSize = window.innerWidth < 640 ? 80 : 100; // 80px for mobile, 100px for desktop
    const maxX = window.innerWidth - treasureSize;
    const maxY = window.innerHeight - treasureSize;

    // Keep treasure visible and away from edges
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
    // Set next appearance time to 3 minutes from now
    localStorage.setItem('treasureLastShown', Date.now().toString());

    // Schedule next appearance after 3 minutes
    setTimeout(() => {
      setRandomPosition();
      setIsVisible(true);
      localStorage.setItem('treasureLastShown', Date.now().toString());
    }, 3 * 60 * 1000); // 3 minutes
  };

  const handleClaim = () => {
    // Navigate to a special discount page or show coupon
    navigate('/products?discount=treasure');
    setIsVisible(false);
    setIsOpen(false);
    // Set next appearance time to 3 minutes from now
    localStorage.setItem('treasureLastShown', Date.now().toString());

    // Schedule next appearance after 3 minutes
    setTimeout(() => {
      setRandomPosition();
      setIsVisible(true);
      localStorage.setItem('treasureLastShown', Date.now().toString());
    }, 3 * 60 * 1000); // 3 minutes
  };

  if (!isVisible) return null;

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
            {/* Chest - Using Closed Treasure Image - Responsive size */}
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

            {/* Tooltip - Hidden on mobile, shown on hover for desktop */}
            <div className="hidden sm:block absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-1 rounded-lg text-xs sm:text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Click to open treasure!
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          </div>
        </div>
      )}

      {/* Treasure Modal - Responsive padding */}
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-75 p-3 sm:p-4 animate-fade-in">
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

          {/* Modal Content - Responsive padding and max-width */}
          <div className="relative bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-50 rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 md:p-8 animate-scale-in">
            {/* Close Button - Responsive size */}
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 p-1.5 sm:p-2 hover:bg-white rounded-full transition-colors"
            >
              <FiX className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            </button>

            {/* Treasure Content */}
            <div className="text-center">
              {/* Treasure Offer Image - Responsive margins */}
              <div className="relative inline-block mb-4 sm:mb-6 animate-scale-in w-full">
                <img
                  src="/treasure-offer.png"
                  alt="Special Offer"
                  className="w-full h-auto object-contain drop-shadow-2xl rounded-lg"
                  onError={(e) => {
                    console.error('Failed to load treasure-offer.png');
                    e.target.style.display = 'none';
                  }}
                  onLoad={() => console.log('Treasure offer image loaded successfully')}
                />
              </div>

              <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 animate-slide-up px-2" style={{ animationDelay: '0.2s' }}>
                This treasure appears every 3 minutes. Keep exploring for more surprises!
              </p>

              <button
                onClick={handleClaim}
                className="btn-primary w-full transform hover:scale-105 transition-all shadow-lg hover:shadow-xl animate-slide-up text-sm sm:text-base"
                style={{ animationDelay: '0.3s' }}
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
