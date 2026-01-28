import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';

const HeroSlider = () => {
  return (
    <div className="relative overflow-hidden bg-white">
      <div className="relative w-full">
        <div className="relative w-full south-indian-pattern overflow-hidden h-[280px] sm:h-[450px] lg:h-[600px]">
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
      </div>
    </div>
  );
};

export default HeroSlider;
