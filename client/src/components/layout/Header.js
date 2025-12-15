import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiShoppingCart, FiHeart, FiUser, FiLogOut, FiPackage, FiGift } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import NotificationBell from '../common/NotificationBell';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, isSuperAdmin, isTenant, logout } = useAuth();
  const { getCartCount } = useCart();
  const { getWishlistCount } = useWishlist();
  const navigate = useNavigate();

  const categories = [
    { name: 'Gifts', path: '/products?category=gifts' },
    { name: 'Custom Frames', path: '/products?category=custom-frames' },
    { name: 'Pottery', path: '/products?category=pottery' },
    { name: 'Kolu Bommai', path: '/products?category=kolu-bommai' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50 animate-slide-up">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-2 overflow-hidden">
        <div className="container-custom flex justify-between items-center text-sm">
          <p className="animate-fade-in">Free shipping on orders above ₹999</p>
          <div className="hidden md:flex gap-4 animate-fade-in-delay">
            <span>+91 8682821273</span>
            <span>hello@pokisham.com</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container-custom py-4">
        <div className="flex justify-between items-center">
          {/* Logo with Treasure Chest */}
          <Link to="/" className="flex items-center gap-2 md:gap-3 transform hover:scale-105 transition-transform group">
            {/* Treasure Chest Icon */}
            <div className="relative">
              <div className="bg-gradient-to-br from-yellow-500 to-yellow-700 w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                <FiGift className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              {/* Sparkle effect */}
              <div className="absolute -top-1 -right-1 w-2 h-2 md:w-3 md:h-3 bg-yellow-300 rounded-full animate-ping"></div>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold">
              <span className="inline-block animate-letter text-gradient" style={{animationDelay: '0s'}}>P</span>
              <span className="inline-block animate-letter text-gradient" style={{animationDelay: '0.1s'}}>o</span>
              <span className="inline-block animate-letter text-gradient" style={{animationDelay: '0.2s'}}>k</span>
              <span className="inline-block animate-letter text-gradient" style={{animationDelay: '0.3s'}}>i</span>
              <span className="inline-block animate-letter text-gradient" style={{animationDelay: '0.4s'}}>s</span>
              <span className="inline-block animate-letter text-gradient" style={{animationDelay: '0.5s'}}>h</span>
              <span className="inline-block animate-letter text-gradient" style={{animationDelay: '0.6s'}}>a</span>
              <span className="inline-block animate-letter text-gradient" style={{animationDelay: '0.7s'}}>m</span>
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link to="/" className="text-gray-700 hover:text-primary-600 transition-all transform hover:scale-110 font-medium">
              Home
            </Link>
            {categories.map((category) => (
              <Link
                key={category.name}
                to={category.path}
                className="text-gray-700 hover:text-primary-600 transition-all transform hover:scale-110 font-medium relative group"
              >
                {category.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 transition-all group-hover:w-full"></span>
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {isAuthenticated ? (
              <>
                {/* Wishlist */}
                <Link
                  to="/wishlist"
                  className="p-1.5 md:p-2 hover:bg-pink-50 rounded-full transition-all relative transform hover:scale-110"
                >
                  <FiHeart className="w-5 h-5 md:w-6 md:h-6 text-gray-700 hover:text-primary-600 transition-colors" />
                  {getWishlistCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full animate-scale-in">
                      {getWishlistCount()}
                    </span>
                  )}
                </Link>

                {/* Cart */}
                <Link
                  to="/cart"
                  className="p-1.5 md:p-2 hover:bg-primary-50 rounded-full transition-all relative transform hover:scale-110"
                >
                  <FiShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-gray-700 hover:text-primary-600 transition-colors" />
                  {getCartCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full animate-pulse">
                      {getCartCount()}
                    </span>
                  )}
                </Link>

                {/* Notifications */}
                <NotificationBell />

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1 md:gap-2 p-1.5 md:p-2 hover:bg-primary-50 rounded-lg transition-all transform hover:scale-105"
                  >
                    <FiUser className="w-5 h-5 md:w-6 md:h-6 text-gray-700 hover:text-primary-600 transition-colors" />
                    <span className="hidden md:block text-gray-700 font-medium truncate max-w-[100px]">{user?.name}</span>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 animate-scale-in border border-gray-100">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 flex items-center gap-2 transition-all"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <FiUser /> Profile
                      </Link>
                      <Link
                        to="/orders"
                        className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 flex items-center gap-2 transition-all"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <FiPackage /> My Orders
                      </Link>
                      {isSuperAdmin && (
                        <Link
                          to="/superadmin/dashboard"
                          className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-all"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Super Admin Dashboard
                        </Link>
                      )}
                      {isAdmin && !isSuperAdmin && (
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-all"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      {isTenant && (
                        <Link
                          to="/tenant/dashboard"
                          className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-all"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Seller Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 transition-all"
                      >
                        <FiLogOut /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-outline py-2 px-4 text-sm hidden md:inline-block">
                  Login
                </Link>
                <Link to="/register" className="btn-primary py-2 px-4 text-sm">
                  Sign Up
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-primary-50 rounded-lg transition-all transform hover:scale-110"
            >
              {mobileMenuOpen ? (
                <FiX className="w-6 h-6 text-gray-700 animate-wiggle" />
              ) : (
                <FiMenu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-white shadow-lg animate-slide-up">
          <nav className="container-custom py-4 flex flex-col gap-4">
            <Link
              to="/"
              className="text-gray-700 hover:text-primary-600 transition-all transform hover:translate-x-2 font-medium py-2 px-4 rounded-lg hover:bg-primary-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            {categories.map((category, index) => (
              <Link
                key={category.name}
                to={category.path}
                className={`transition-all transform hover:translate-x-2 font-medium py-2 px-4 rounded-lg hover:bg-primary-50 animate-fade-in flex items-center gap-2 ${
                  category.highlight
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-700 hover:text-primary-600'
                }`}
                onClick={() => setMobileMenuOpen(false)}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {category.icon && <category.icon className="w-5 h-5" />}
                {category.name}
              </Link>
            ))}
            {!isAuthenticated && (
              <Link
                to="/login"
                className="text-gray-700 hover:text-primary-600 transition-all transform hover:translate-x-2 font-medium py-2 px-4 rounded-lg hover:bg-primary-50 md:hidden"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
