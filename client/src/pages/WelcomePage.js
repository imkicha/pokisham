import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShoppingBag, FiHeart, FiTruck, FiGift, FiStar, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const WelcomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [showContent, setShowContent] = useState(false);
  const [letterIndex, setLetterIndex] = useState(0);
  const [treasureOpen, setTreasureOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const logoText = 'POKISHAM';

  useEffect(() => {
    // Set page title
    document.title = 'Welcome to Pokisham - Handcrafted Treasures';

    // Don't auto-redirect if coming from login (allow welcome screen)
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    const justLoggedIn = sessionStorage.getItem('justLoggedIn');

    if (hasSeenWelcome && !justLoggedIn) {
      navigate('/');
      return;
    }

    // Show treasure chest first
    setTimeout(() => setShowContent(true), 500);

  }, [navigate]);

  // Handle treasure opening - start letter reveal animation
  useEffect(() => {
    if (treasureOpen) {
      const interval = setInterval(() => {
        setLetterIndex((prev) => {
          if (prev < logoText.length) {
            return prev + 1;
          }
          clearInterval(interval);
          return prev;
        });
      }, 150);

      return () => clearInterval(interval);
    }
  }, [treasureOpen, logoText.length]);

  const handleEnter = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 animate-gradient relative overflow-hidden">

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating circles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white opacity-10 animate-float"
            style={{
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 10 + 10}s`,
            }}
          />
        ))}

        {/* Stars */}
        {[...Array(30)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          >
            <FiStar className="text-white opacity-60" size={Math.random() * 20 + 10} />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-4xl">

          {/* Treasure Chest Animation */}
          <div className="mb-8 relative">
            {/* Treasure Chest - Clickable (Closed) */}
            {showContent && !isOpening && !treasureOpen && (
              <div
                className="inline-block animate-bounce mb-8 cursor-pointer group"
                onClick={() => {
                  setIsOpening(true);
                  setTimeout(() => {
                    setTreasureOpen(true);
                    setIsOpening(false);
                  }, 800);
                }}
              >
                <div className="relative">
                  {/* Closed Chest */}
                  <div className="relative w-40 h-40 md:w-48 md:h-48 mx-auto transform group-hover:scale-110 transition-transform">
                    <img
                      src="/treasure-closed-removebg-preview.png"
                      alt="Pokisham Treasure Chest"
                      className="w-full h-full object-contain drop-shadow-2xl animate-pulse"
                    />

                    {/* Sparkles */}
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-3 h-3 bg-yellow-300 rounded-full animate-ping"
                        style={{
                          top: `${Math.random() * 100}%`,
                          left: `${Math.random() * 100}%`,
                          animationDelay: `${i * 0.15}s`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Click hint */}
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to open! 🎁
                  </div>
                </div>
              </div>
            )}

            {/* Opening Transition */}
            {isOpening && (
              <div className="inline-block mb-8 animate-scale-in">
                <div className="relative w-40 h-40 md:w-48 md:h-48 mx-auto">
                  <img
                    src="/treasure-open-removebg-preview.png"
                    alt="Pokisham Treasure Opening"
                    className="w-full h-full object-contain drop-shadow-2xl animate-pulse"
                  />
                </div>
              </div>
            )}

            {/* Opening Animation & Logo Reveal */}
            {treasureOpen && (
              <>
                {/* Open Treasure Chest with confetti */}
                <div className="relative inline-block mb-8 animate-scale-in">
                  <div className="relative w-52 h-52 md:w-64 md:h-64 mx-auto">
                    <img
                      src="/treasure-open-removebg-preview.png"
                      alt="Pokisham Treasure Open"
                      className="w-full h-full object-contain drop-shadow-2xl"
                    />
                  </div>

                  {/* Confetti burst */}
                  <div className="absolute inset-0 overflow-visible pointer-events-none">
                    {[...Array(30)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute animate-confetti"
                        style={{
                          left: '50%',
                          top: '20%',
                          width: `${Math.random() * 10 + 5}px`,
                          height: `${Math.random() * 10 + 5}px`,
                          backgroundColor: ['#ffd700', '#ffa500', '#ff6347', '#ff69b4', '#87ceeb'][Math.floor(Math.random() * 5)],
                          animationDelay: `${Math.random() * 0.5}s`,
                          animationDuration: `${1.5 + Math.random() * 1}s`,
                          borderRadius: Math.random() > 0.5 ? '50%' : '0',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* POKISHAM Text */}
                <h1 className="text-7xl md:text-9xl font-display font-bold mb-4 animate-scale-in">
                  {logoText.split('').map((letter, index) => (
                    <span
                      key={index}
                      className={`inline-block ${
                        index < letterIndex ? 'animate-letter' : 'opacity-0'
                      }`}
                      style={{
                        animationDelay: `${index * 0.1}s`,
                        background: 'linear-gradient(45deg, #fff, #ffd700, #fff)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {letter}
                    </span>
                  ))}
                </h1>
              </>
            )}


            {treasureOpen && (
              <p className="text-2xl md:text-3xl text-white font-semibold animate-fade-in opacity-90">
                {isAuthenticated && user ? (
                  <>Welcome back, {user.name.split(' ')[0]}! Ready to discover treasures?</>
                ) : (
                  <>Your Gateway to Handcrafted Treasures</>
                )}
              </p>
            )}
          </div>

          {/* Feature Cards */}
          {treasureOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-slide-up">
              {/* Feature 1 */}
              <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-xl p-6 transform hover:scale-105 transition-all duration-300 hover:bg-opacity-30">
                <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <FiShoppingBag className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Unique Products</h3>
                <p className="text-white text-sm opacity-90">Handcrafted items you won't find anywhere else</p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-xl p-6 transform hover:scale-105 transition-all duration-300 hover:bg-opacity-30" style={{ animationDelay: '0.1s' }}>
                <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <FiHeart className="w-8 h-8 text-pink-600" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Made with Love</h3>
                <p className="text-white text-sm opacity-90">Every product crafted with care and passion</p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-xl p-6 transform hover:scale-105 transition-all duration-300 hover:bg-opacity-30" style={{ animationDelay: '0.2s' }}>
                <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <FiTruck className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Fast Delivery</h3>
                <p className="text-white text-sm opacity-90">Free shipping on orders above ₹999</p>
              </div>

              {/* Feature 4 */}
              <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-xl p-6 transform hover:scale-105 transition-all duration-300 hover:bg-opacity-30" style={{ animationDelay: '0.3s' }}>
                <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <FiGift className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Gift Wrapping</h3>
                <p className="text-white text-sm opacity-90">Beautiful packaging for your special moments</p>
              </div>
            </div>
          )}

          {/* CTA Button */}
          {treasureOpen && (
            <div className="animate-scale-in" style={{ animationDelay: '0.4s' }}>
              <button
                onClick={handleEnter}
                className="group bg-white text-purple-600 px-12 py-5 rounded-full text-xl font-bold shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 inline-flex items-center gap-3"
              >
                Enter Store
                <FiArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </button>

              <p className="text-white text-sm mt-6 opacity-80">
                Discover amazing handcrafted products waiting for you
              </p>
            </div>
          )}

          {/* Scroll Indicator */}
          {treasureOpen && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
              <div className="w-6 h-10 border-2 border-white rounded-full flex items-start justify-center p-2">
                <div className="w-1.5 h-3 bg-white rounded-full animate-scroll"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
