import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/cart');
      if (data.success) {
        // Filter out items with deleted products on the client side as well
        if (data.cart && data.cart.items) {
          const validItems = data.cart.items.filter(item => item.product !== null);
          // If some items were invalid, remove them from server
          if (validItems.length !== data.cart.items.length) {
            const invalidItems = data.cart.items.filter(item => item.product === null);
            // Remove invalid items from server silently
            for (const item of invalidItems) {
              try {
                await API.delete(`/cart/${item._id}`);
              } catch (err) {
                console.log('Error removing invalid cart item:', err);
              }
            }
            // Re-fetch the cleaned cart
            const { data: cleanedData } = await API.get('/cart');
            if (cleanedData.success) {
              setCart(cleanedData.cart);
              return;
            }
          }
        }
        setCart(data.cart);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1, variant = null, giftWrap = false) => {
    try {
      const { data } = await API.post('/cart', {
        productId,
        quantity,
        variant,
        giftWrap,
      });

      if (data.success) {
        setCart(data.cart);
        toast.success('Added to cart!');
        return true;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
      return false;
    }
  };

  const updateCartItem = async (itemId, quantity, giftWrap) => {
    try {
      const { data } = await API.put(`/cart/${itemId}`, {
        quantity,
        giftWrap,
      });

      if (data.success) {
        setCart(data.cart);
        toast.success('Cart updated!');
        return true;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update cart');
      return false;
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const { data } = await API.delete(`/cart/${itemId}`);

      if (data.success) {
        setCart(data.cart);
        toast.success('Removed from cart!');
        return true;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove from cart');
      return false;
    }
  };

  const clearCart = async () => {
    try {
      const { data } = await API.delete('/cart');

      if (data.success) {
        setCart(data.cart);
        toast.success('Cart cleared!');
        return true;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to clear cart');
      return false;
    }
  };

  const getCartTotal = () => {
    if (!cart || !cart.items || cart.items.length === 0) return 0;

    return cart.items
      .filter((item) => item.product !== null) // Exclude deleted products
      .reduce((total, item) => {
        let price = 0;

        // Check if item has a variant and product has variants
        if (item.variant && item.product?.hasVariants && item.product?.variants) {
          const variant = item.product.variants.find((v) => v.size === item.variant.size);
          if (variant) {
            price = variant.price;
          } else {
            price = item.product?.discountPrice || item.product?.price || 0;
          }
        } else {
          price = item.product?.discountPrice || item.product?.price || 0;
        }

        return total + price * item.quantity;
      }, 0);
  };

  const getCartCount = () => {
    if (!cart || !cart.items) return 0;
    // Only count items where product still exists
    return cart.items
      .filter((item) => item.product !== null)
      .reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cart,
    loading,
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
