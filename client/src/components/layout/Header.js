import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiMenu, FiX, FiShoppingCart, FiHeart, FiUser, FiLogOut, FiPackage, FiSearch } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import NotificationBell from '../common/NotificationBell';
import API from '../../api/axios';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const { user, isAuthenticated, isAdmin, isSuperAdmin, isTenant, logout } = useAuth();
  const { getCartCount } = useCart();
  const { getWishlistCount } = useWishlist();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchInputRef = useRef(null);

  // Sync search input with URL search param
  useEffect(() => {
    const q = searchParams.get('search') || '';
    setSearchQuery(q);
  }, [searchParams]);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      navigate(`/products?search=${encodeURIComponent(trimmed)}`);
      setSearchOpen(false);
      setMobileMenuOpen(false);
    }
  };

  // Default categories as fallback
  const defaultCategories = [
    { name: 'Gifts', path: '/products?category=gifts' },
    { name: 'Custom Frames', path: '/products?category=custom-frames' },
    { name: 'Pottery', path: '/products?category=pottery' },
    { name: 'Golu Bommai', path: '/products?category=kolu-bommai' },
  ];

  // Fetch navbar categories from backend
  useEffect(() => {
    const fetchNavbarCategories = async () => {
      try {
        const { data } = await API.get('/categories/navbar');
        if (data.success && data.categories && data.categories.length > 0) {
          setCategories(data.categories.map(cat => ({
            name: cat.name,
            path: `/products?category=${cat.slug}`
          })));
        } else {
          setCategories(defaultCategories);
        }
      } catch (error) {
        // Silently fallback to default categories on error
        setCategories(defaultCategories);
      }
    };
    fetchNavbarCategories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50 animate-slide-up">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-1.5 overflow-hidden">
        <div className="container-custom flex justify-between items-center text-xs">
          <p className="animate-fade-in">Free shipping on orders above ₹999</p>
          <div className="hidden md:flex gap-4 animate-fade-in-delay">
            <span>+91 8682821273</span>
            <span>pokisham.info@gmail.com</span>
          </div>
        </div>
      </div>

      {/* Main Header - Row 1: Logo + Search + Actions */}
      <div className="container-custom py-2">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 transform hover:scale-105 transition-transform group">
            <div className="relative flex-shrink-0">
              <img
                src="/pokisham-logo.jpg"
                alt="Pokisham Treasure"
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain transition-all"
              />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full animate-ping"></div>
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-display font-bold leading-tight">
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

          {/* Desktop Search Bar - centered, takes available space */}
          <div className="hidden md:block flex-1 max-w-xl mx-auto">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for gifts, frames, pottery, Golu Bommai..."
                className="w-full pl-11 pr-12 py-2.5 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none text-sm transition-all bg-gray-50 focus:bg-white"
              />
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); navigate('/products'); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <FiX className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  <FiSearch className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0 ml-auto">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="md:hidden p-2 hover:bg-primary-50 rounded-full transition-all"
            >
              <FiSearch className="w-5 h-5 text-gray-700" />
            </button>

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
                    <span className="hidden lg:block text-gray-700 font-medium truncate max-w-[100px]">{user?.name}</span>
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
                <Link to="/login" className="btn-outline py-1.5 px-3 md:py-2 md:px-4 text-sm hidden sm:inline-block">
                  Login
                </Link>
                <Link to="/register" className="btn-primary py-1.5 px-3 md:py-2 md:px-4 text-sm">
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

      {/* Row 2: Desktop Navigation */}
      <div className="hidden lg:block border-t border-gray-100 bg-white">
        <div className="container-custom">
          <div className="flex items-center gap-3">
            {/* Invisible spacer matching logo width */}
            <div className="flex-shrink-0 invisible">
              <div className="flex items-center gap-2">
                <div className="w-14 h-14"></div>
                <span className="text-2xl font-display font-bold">Pokisham</span>
              </div>
            </div>
            {/* Nav links aligned with search bar */}
            <nav className="flex-1 max-w-xl mx-auto">
              <div className="flex items-center gap-8 py-3">
                <Link to="/" className="text-gray-700 hover:text-primary-600 transition-all font-semibold text-base">
                  Home
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category.name}
                    to={category.path}
                    className="text-gray-700 hover:text-primary-600 transition-all font-semibold text-base relative group whitespace-nowrap"
                  >
                    {category.name}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 transition-all group-hover:w-full"></span>
                  </Link>
                ))}
                <Link
                  to="/offers"
                  className="text-red-600 hover:text-red-700 transition-all font-semibold text-base relative group whitespace-nowrap"
                >
                  Offers
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 transition-all group-hover:w-full"></span>
                </Link>
              </div>
            </nav>
            {/* Invisible spacer matching actions width */}
            <div className="flex-shrink-0 invisible ml-auto">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10"></div>
                <div className="w-10 h-10"></div>
                <div className="w-10 h-10"></div>
                <div className="w-10 h-10"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar - slides down */}
      {searchOpen && (
        <div className="md:hidden border-t bg-white shadow-md animate-slide-up">
          <div className="container-custom py-3">
            <form onSubmit={handleSearch} className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for gifts, frames, pottery..."
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none text-sm bg-gray-50 focus:bg-white"
              />
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <button
                type="button"
                onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-white shadow-lg animate-slide-up">
          <nav className="container-custom py-4 flex flex-col gap-3">
            {/* Mobile Menu Search */}
            <form onSubmit={handleSearch} className="relative mb-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none text-sm bg-gray-50 focus:bg-white"
              />
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </form>

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
                className="text-gray-700 hover:text-primary-600 transition-all transform hover:translate-x-2 font-medium py-2 px-4 rounded-lg hover:bg-primary-50 animate-fade-in"
                onClick={() => setMobileMenuOpen(false)}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {category.name}
              </Link>
            ))}
            <Link
              to="/offers"
              className="text-red-600 hover:text-red-700 transition-all transform hover:translate-x-2 font-semibold py-2 px-4 rounded-lg hover:bg-red-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Offers
            </Link>
            {!isAuthenticated && (
              <Link
                to="/login"
                className="text-gray-700 hover:text-primary-600 transition-all transform hover:translate-x-2 font-medium py-2 px-4 rounded-lg hover:bg-primary-50 sm:hidden"
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
