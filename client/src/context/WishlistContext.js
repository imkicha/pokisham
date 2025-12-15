import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState({ items: [] });   // 🔥 FIX 1
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    } else {
      setWishlist({ items: [] });   // 🔥 FIX 2
    }
  }, [isAuthenticated]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/wishlist');
      if (data.success) setWishlist(data.wishlist);
    } catch (error) {
      console.error('Wishlist fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId) => {
    try {
      const { data } = await API.post(`/wishlist/${productId}`);
      if (data.success) {
        setWishlist(data.wishlist);
        toast.success('Added to wishlist!');
      }
    } catch {
      toast.error('Failed to add to wishlist');
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const { data } = await API.delete(`/wishlist/${productId}`);
      if (data.success) {
        setWishlist(data.wishlist);
        toast.success('Removed from wishlist!');
      }
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const isInWishlist = (productId) =>
    wishlist?.items?.some((item) => item.product._id === productId);

  const getWishlistCount = () => wishlist?.items?.length || 0;

  return (
    <WishlistContext.Provider
      value={{ wishlist, loading, addToWishlist, removeFromWishlist, fetchWishlist, isInWishlist, getWishlistCount }}
    >
      {children}
    </WishlistContext.Provider>
  );
};
