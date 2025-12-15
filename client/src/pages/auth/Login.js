import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiEye, FiEyeOff, FiMail, FiLock, FiShoppingBag, FiTruck, FiGift, FiStar } from 'react-icons/fi';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.title = 'Login - Pokisham';
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const success = await login(formData.email, formData.password);

    if (success) {
      sessionStorage.setItem('justLoggedIn', 'true');
      navigate('/');
    }

    setLoading(false);
  };

  const features = [
    { icon: FiShoppingBag, text: 'Premium Quality Products' },
    { icon: FiTruck, text: 'Fast & Free Delivery' },
    { icon: FiGift, text: 'Gift Wrapping Available' },
    { icon: FiStar, text: 'Exclusive Member Offers' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Creative Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 relative overflow-hidden">
        {/* Balloon Decorations */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          {/* Large balloon */}
          <div className="absolute top-10 left-10 animate-float">
            <div className="w-40 h-48 border-4 border-white" style={{ borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%' }} />
            <div className="w-3 h-3 border-l-4 border-r-4 border-b-4 border-white mx-auto -mt-1" style={{ borderRadius: '0 0 50% 50%' }} />
            <div className="w-px h-16 bg-white mx-auto" />
          </div>
          {/* Medium balloon */}
          <div className="absolute bottom-20 right-10 animate-float" style={{ animationDelay: '1s' }}>
            <div className="w-60 h-72 border-4 border-white" style={{ borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%' }} />
            <div className="w-4 h-4 border-l-4 border-r-4 border-b-4 border-white mx-auto -mt-1" style={{ borderRadius: '0 0 50% 50%' }} />
            <div className="w-px h-20 bg-white mx-auto" />
          </div>
          {/* Small balloon */}
          <div className="absolute top-1/2 left-1/3 animate-float" style={{ animationDelay: '0.5s' }}>
            <div className="w-20 h-24 border-4 border-white" style={{ borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%' }} />
            <div className="w-2 h-2 border-l-2 border-r-2 border-b-2 border-white mx-auto -mt-0.5" style={{ borderRadius: '0 0 50% 50%' }} />
            <div className="w-px h-10 bg-white mx-auto" />
          </div>
        </div>

        {/* Floating Ribbons */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={`ribbon-${i}`}
              className="absolute text-3xl md:text-4xl animate-float"
              style={{
                left: `${15 + (i * 15)}%`,
                top: `${30 + (i % 2) * 35}%`,
                animationDelay: `${i * 0.7}s`,
                opacity: 0.7,
              }}
            >
              🎀
            </div>
          ))}
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-5xl font-display font-bold mb-2 text-center">
              Pokisham
            </h1>
            <p className="text-xl text-white/80 text-center">Your Premium Shopping Destination</p>
          </div>

          {/* Illustration/Features */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6 text-center">Why Shop With Us?</h2>
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-4 bg-white/10 rounded-lg p-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <span className="text-lg font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Decorative Text */}
          <p className="mt-8 text-white/60 text-center max-w-sm">
            Join thousands of happy customers shopping with Pokisham
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 p-4 sm:p-8">
        <div className="max-w-md w-full">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-display font-bold text-primary-600 flex items-center justify-center gap-2">
              <span>🎀</span> Pokisham <span>🎀</span>
            </h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-display font-bold text-gray-900">
                Welcome Back!
              </h2>
              <p className="mt-2 text-gray-600">
                Sign in to continue shopping
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-5 w-5" />
                    ) : (
                      <FiEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  Forgot your password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-primary-700 hover:to-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500">New to Pokisham?</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Create Account Link */}
            <Link
              to="/register"
              className="w-full block text-center py-3 px-4 border-2 border-primary-600 text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              Create an Account
            </Link>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-gray-500">
            By signing in, you agree to our{' '}
            <Link to="/terms" className="text-primary-600 hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
