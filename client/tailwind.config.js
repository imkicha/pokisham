module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef5f7',
          100: '#fde8ec',
          200: '#fbd5dd',
          300: '#f8b1c3',
          400: '#f3829d',
          500: '#ec5578',
          600: '#d93e64',
          700: '#b62d50',
          800: '#982947',
          900: '#802641',
        },
        secondary: {
          50: '#fef9ee',
          100: '#fdf1d7',
          200: '#fae0ae',
          300: '#f6c97a',
          400: '#f1a944',
          500: '#ed8e1f',
          600: '#de7315',
          700: '#b85713',
          800: '#934517',
          900: '#773a16',
        },
        accent: {
          50: '#f4f4ff',
          100: '#ebeaff',
          200: '#d9d8ff',
          300: '#bfbdff',
          400: '#a29bff',
          500: '#8678ff',
          600: '#7456ff',
          700: '#6743ff',
          800: '#5737dc',
          900: '#4830af',
        },
      },
      fontFamily: {
        'display': ['Playfair Display', 'serif'],
        'body': ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.6s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
