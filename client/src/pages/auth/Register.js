import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser, FiPhone, FiShoppingBag, FiTruck, FiGift, FiStar, FiShield } from 'react-icons/fi';

const Register = () => {
  const navigate = useNavigate();
  const { register, verifyOTP, resendOTP } = useAuth();
  const [step, setStep] = useState('register');
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    document.title = step === 'register' ? 'Register - Pokisham' : 'Verify OTP - Pokisham';
  }, [step]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return;
    }

    setLoading(true);

    const { confirmPassword, firstName, lastName, ...rest } = formData;
    const registerData = {
      ...rest,
      name: `${firstName} ${lastName}`.trim(),
    };
    const newUserId = await register(registerData);

    if (newUserId) {
      setUserId(newUserId);
      setStep('verify');
    }

    setLoading(false);
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const success = await verifyOTP(userId, otp);

    if (success) {
      sessionStorage.setItem('justLoggedIn', 'true');
      navigate('/');
    }

    setLoading(false);
  };

  const handleResendOTP = async () => {
    setLoading(true);
    await resendOTP(userId);
    setLoading(false);
  };

  const features = [
    { icon: FiShoppingBag, text: 'Premium Quality Products' },
    { icon: FiTruck, text: 'Fast & Free Delivery' },
    { icon: FiGift, text: 'Gift Wrapping Available' },
    { icon: FiStar, text: 'Exclusive Member Offers' },
    { icon: FiShield, text: 'Secure Shopping' },
  ];

  // OTP Verification Screen
  if (step === 'verify') {
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
            <div className="mb-8">
              <h1 className="text-5xl font-display font-bold mb-2 text-center">
                Pokisham
              </h1>
              <p className="text-xl text-white/80 text-center">Almost There!</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center">
              <div className="text-6xl mb-4">📧</div>
              <h2 className="text-2xl font-bold mb-4">Check Your Email</h2>
              <p className="text-white/80">
                We've sent a verification code to your email address. Enter the code to complete your registration.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - OTP Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 p-4 sm:p-8">
          <div className="max-w-md w-full">
            <div className="lg:hidden text-center mb-8">
              <h1 className="text-3xl font-display font-bold text-primary-600 flex items-center justify-center gap-2">
                <span>🎀</span> Pokisham <span>🎀</span>
              </h1>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiMail className="w-10 h-10 text-primary-600" />
                </div>
                <h2 className="text-3xl font-display font-bold text-gray-900">
                  Verify Your Email
                </h2>
                <p className="mt-2 text-gray-600">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              <form onSubmit={handleVerifySubmit} className="space-y-6">
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    maxLength="6"
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center text-2xl tracking-widest font-mono"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-primary-700 hover:to-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </button>

                <div className="text-center">
                  <p className="text-gray-600 mb-2">Didn't receive the code?</p>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="font-medium text-primary-600 hover:text-primary-500"
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Registration Form
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

          {/* Features */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6 text-center">Join Pokisham Today!</h2>
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-8 text-white/60 text-center max-w-sm">
            Create an account and start shopping for amazing products
          </p>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 p-4 sm:p-8 overflow-y-auto">
        <div className="max-w-md w-full py-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <h1 className="text-3xl font-display font-bold text-primary-600 flex items-center justify-center gap-2">
              <span>🎀</span> Pokisham <span>🎀</span>
            </h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-display font-bold text-gray-900">
                Create Account
              </h2>
              <p className="mt-2 text-gray-600">
                Join us and start shopping
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="First name"
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiPhone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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
                    autoComplete="new-password"
                    required
                    className="block w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Create password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className={`block w-full pl-10 pr-12 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      formData.confirmPassword && formData.password !== formData.confirmPassword
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">Passwords do not match</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || (formData.password !== formData.confirmPassword)}
                className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-primary-700 hover:to-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500">Already have an account?</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Sign In Link */}
            <Link
              to="/login"
              className="w-full block text-center py-3 px-4 border-2 border-primary-600 text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              Sign In
            </Link>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-gray-500">
            By creating an account, you agree to our{' '}
            <Link to="/terms" className="text-primary-600 hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
