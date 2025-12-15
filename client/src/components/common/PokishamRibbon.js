import React from 'react';

const PokishamRibbon = ({
  position = 'top-right', // top-left, top-right, bottom-left, bottom-right
  size = 'medium', // small, medium, large
  variant = 'default', // default, gold, gradient, minimal
  text = 'Pokisham',
  className = ''
}) => {
  // Position styles
  const positionStyles = {
    'top-left': 'top-0 left-0 -translate-x-1/3 -translate-y-0 rotate-[-45deg]',
    'top-right': 'top-0 right-0 translate-x-1/3 -translate-y-0 rotate-[45deg]',
    'bottom-left': 'bottom-0 left-0 -translate-x-1/3 translate-y-0 rotate-[45deg]',
    'bottom-right': 'bottom-0 right-0 translate-x-1/3 translate-y-0 rotate-[-45deg]',
  };

  // Size styles
  const sizeStyles = {
    small: 'py-1 px-8 text-xs',
    medium: 'py-1.5 px-12 text-sm',
    large: 'py-2 px-16 text-base',
  };

  // Variant styles
  const variantStyles = {
    default: 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg',
    gold: 'bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 text-yellow-900 shadow-lg',
    gradient: 'bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-600 text-white shadow-lg animate-gradient',
    minimal: 'bg-white/90 text-primary-600 border border-primary-200 shadow-sm',
  };

  return (
    <div
      className={`
        absolute ${positionStyles[position]}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        font-semibold tracking-wider
        z-10 transform origin-center
        ${className}
      `}
    >
      <span className="flex items-center justify-center gap-1">
        {variant === 'gold' && <span>✨</span>}
        {text}
        {variant === 'gold' && <span>✨</span>}
      </span>
    </div>
  );
};

// Corner Badge Version - More modern look
export const PokishamBadge = ({
  position = 'top-right',
  variant = 'primary', // primary, gold, dark
  size = 'medium',
  showIcon = true,
  className = ''
}) => {
  const positionStyles = {
    'top-left': 'top-3 left-3',
    'top-right': 'top-3 right-3',
    'bottom-left': 'bottom-3 left-3',
    'bottom-right': 'bottom-3 right-3',
  };

  const sizeStyles = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base',
  };

  const variantStyles = {
    primary: 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white',
    gold: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900',
    dark: 'bg-gray-900 text-white',
  };

  return (
    <div
      className={`
        absolute ${positionStyles[position]}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        rounded-full font-semibold
        shadow-lg z-10
        flex items-center gap-1
        ${className}
      `}
    >
      {showIcon && <span className="text-xs">🎀</span>}
      <span>Pokisham</span>
    </div>
  );
};

// Floating Banner - Can be used at page top/bottom
export const PokishamBanner = ({
  variant = 'default', // default, festive, minimal
  className = ''
}) => {
  const variants = {
    default: 'bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-600',
    festive: 'bg-gradient-to-r from-yellow-500 via-primary-500 to-yellow-500',
    minimal: 'bg-white border-y border-primary-200',
  };

  const textColors = {
    default: 'text-white',
    festive: 'text-white',
    minimal: 'text-primary-600',
  };

  return (
    <div className={`${variants[variant]} py-2 overflow-hidden ${className}`}>
      <div className="animate-marquee whitespace-nowrap">
        <span className={`${textColors[variant]} font-medium mx-8`}>
          🎀 Welcome to Pokisham - Your Premium Shopping Destination
        </span>
        <span className={`${textColors[variant]} font-medium mx-8`}>
          ✨ Quality Products • Fast Delivery • Best Prices
        </span>
        <span className={`${textColors[variant]} font-medium mx-8`}>
          🎁 Shop Now & Get Exclusive Offers
        </span>
        <span className={`${textColors[variant]} font-medium mx-8`}>
          🎀 Welcome to Pokisham - Your Premium Shopping Destination
        </span>
        <span className={`${textColors[variant]} font-medium mx-8`}>
          ✨ Quality Products • Fast Delivery • Best Prices
        </span>
      </div>
    </div>
  );
};

// Decorative Corner Ribbon with folded effect
export const PokishamCornerRibbon = ({
  position = 'top-right',
  color = 'primary', // primary, gold, red
  className = ''
}) => {
  const colors = {
    primary: {
      main: 'from-primary-500 to-primary-700',
    },
    gold: {
      main: 'from-yellow-400 to-yellow-600',
    },
    red: {
      main: 'from-red-500 to-red-700',
    },
  };

  const isRight = position.includes('right');
  const isTop = position.includes('top');

  return (
    <div className={`absolute ${isTop ? 'top-0' : 'bottom-0'} ${isRight ? 'right-0' : 'left-0'} overflow-hidden w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 pointer-events-none ${className}`}>
      {/* Ribbon */}
      <div
        className={`
          absolute transform
          ${isTop && isRight ? 'rotate-45 top-2 -right-6 sm:top-3 sm:-right-7 md:top-4 md:-right-8' : ''}
          ${isTop && !isRight ? '-rotate-45 top-2 -left-6 sm:top-3 sm:-left-7 md:top-4 md:-left-8' : ''}
          ${!isTop && isRight ? '-rotate-45 bottom-2 -right-6 sm:bottom-3 sm:-right-7 md:bottom-4 md:-right-8' : ''}
          ${!isTop && !isRight ? 'rotate-45 bottom-2 -left-6 sm:bottom-3 sm:-left-7 md:bottom-4 md:-left-8' : ''}
          bg-gradient-to-r ${colors[color].main}
          text-white text-[10px] sm:text-xs font-bold
          py-0.5 px-6 sm:py-1 sm:px-8 md:px-10
        `}
      >
        <span className="flex items-center gap-0.5 sm:gap-1">
          <span style={{ textShadow: 'none' }}>🎀</span>
          <span className="hidden sm:inline">Pokisham</span>
        </span>
      </div>
    </div>
  );
};

// Stamp/Seal style badge
export const PokishamStamp = ({
  size = 'medium',
  variant = 'default', // default, verified, premium
  className = ''
}) => {
  const sizeStyles = {
    small: 'w-16 h-16 text-xs',
    medium: 'w-20 h-20 text-sm',
    large: 'w-24 h-24 text-base',
  };

  const variantConfig = {
    default: {
      bg: 'from-primary-500 to-primary-700',
      border: 'border-primary-300',
      text: 'Pokisham',
      icon: '🎀',
    },
    verified: {
      bg: 'from-green-500 to-green-700',
      border: 'border-green-300',
      text: 'Verified',
      icon: '✓',
    },
    premium: {
      bg: 'from-yellow-500 to-yellow-700',
      border: 'border-yellow-300',
      text: 'Premium',
      icon: '⭐',
    },
  };

  const config = variantConfig[variant];

  return (
    <div
      className={`
        ${sizeStyles[size]}
        rounded-full
        bg-gradient-to-br ${config.bg}
        border-4 ${config.border}
        flex flex-col items-center justify-center
        text-white font-bold
        shadow-xl
        transform rotate-[-15deg]
        ${className}
      `}
    >
      <span className="text-lg">{config.icon}</span>
      <span>{config.text}</span>
    </div>
  );
};

export default PokishamRibbon;
