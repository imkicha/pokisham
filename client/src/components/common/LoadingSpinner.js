import React from 'react';

const LoadingSpinner = ({ fullScreen = false, size = 'md', message = 'Loading...' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const containerClass = fullScreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm'
    : 'flex flex-col items-center justify-center';

  return (
    <div className={containerClass}>
      <div className="relative">
        {/* Outer spinning ring */}
        <div
          className={`${sizes[size]} rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin`}
        ></div>

        {/* Inner pulsing circle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 bg-gradient-to-r from-primary-600 to-pink-600 rounded-full animate-pulse"></div>
        </div>
      </div>

      {message && (
        <p className="mt-4 text-gray-600 font-medium animate-pulse">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
