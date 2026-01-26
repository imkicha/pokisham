import { createContext, useState, useContext, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import { getFCMToken, onMessageListener } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get from secure cookie first, fallback to localStorage
    const token = Cookies.get('token') || localStorage.getItem('token');
    const storedUser = Cookies.get('user') || localStorage.getItem('user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await API.post('/auth/login', { email, password });

      if (data.success) {
        // Store in secure cookies with options
        Cookies.set('token', data.token, {
          expires: 7, // 7 days
          secure: process.env.NODE_ENV === 'production', // HTTPS only in production
          sameSite: 'strict' // CSRF protection
        });
        Cookies.set('user', JSON.stringify(data.user), {
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });

        // Also keep in localStorage for backward compatibility
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        setUser(data.user);
        toast.success('Login successful!');
        return true;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const { data } = await API.post('/auth/register', userData);

      if (data.success) {
        toast.success(data.message);
        return data.userId;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      return null;
    }
  };

  const verifyOTP = async (userId, otp) => {
    try {
      const { data } = await API.post('/auth/verify-otp', { userId, otp });

      if (data.success) {
        // Store in secure cookies with options
        Cookies.set('token', data.token, {
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        Cookies.set('user', JSON.stringify(data.user), {
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });

        // Also keep in localStorage for backward compatibility
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        toast.success('Account verified successfully!');
        return true;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'OTP verification failed');
      return false;
    }
  };

  const googleLogin = async (credential) => {
    try {
      const { data } = await API.post('/auth/google', { credential });

      if (data.success) {
        Cookies.set('token', data.token, {
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        });
        Cookies.set('user', JSON.stringify(data.user), {
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        });

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        setUser(data.user);
        toast.success('Login successful!');
        return true;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Google login failed');
      return false;
    }
  };

  const resendOTP = async (userId) => {
    try {
      const { data } = await API.post('/auth/resend-otp', { userId });

      if (data.success) {
        toast.success('OTP sent successfully!');
        return true;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
      return false;
    }
  };

  // Register FCM token for push notifications
  const registerFCMToken = async () => {
    try {
      const fcmToken = await getFCMToken();
      if (fcmToken) {
        await API.put('/auth/fcm-token', { fcmToken });
        console.log('FCM token registered successfully');
      }
    } catch (error) {
      console.log('Failed to register FCM token:', error.message);
    }
  };

  // Listen for foreground notifications
  useEffect(() => {
    if (user) {
      // Register FCM token when user logs in
      registerFCMToken();

      // Listen for foreground messages
      const unsubscribe = onMessageListener()
        .then((payload) => {
          if (payload) {
            toast(payload.notification?.body || 'New notification', {
              icon: '🔔',
              duration: 5000,
            });
          }
        })
        .catch((err) => console.log('Message listener error:', err));

      return () => unsubscribe;
    }
  }, [user]);

  const logout = () => {
    // Clear secure cookies
    Cookies.remove('token');
    Cookies.remove('user');

    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (userData) => {
    try {
      const { data } = await API.put('/auth/profile', userData);

      if (data.success) {
        // Update secure cookies
        Cookies.set('user', JSON.stringify(data.user), {
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });

        // Update localStorage for backward compatibility
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        toast.success('Profile updated successfully!');
        return true;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Profile update failed');
      return false;
    }
  };

  // Update user state directly (useful when API call is made elsewhere)
  const updateUser = (userData) => {
    // Update secure cookies
    Cookies.set('user', JSON.stringify(userData), {
      expires: 7,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    // Update localStorage for backward compatibility
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const value = {
    user,
    loading,
    login,
    googleLogin,
    register,
    verifyOTP,
    resendOTP,
    logout,
    updateProfile,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isSuperAdmin: user?.role === 'superadmin',
    isTenant: user?.role === 'tenant',
    isAdminOrSuperAdmin: user?.role === 'admin' || user?.role === 'superadmin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
