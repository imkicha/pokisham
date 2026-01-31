import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiFilter, FiX, FiChevronDown, FiGift, FiShoppingCart } from 'react-icons/fi';
import ProductCard from '../../components/product/ProductCard';
import Breadcrumb from '../../components/common/Breadcrumb';
import API from '../../api/axios';
import SEO from '../../components/common/SEO';

const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // URL params
  const categorySlug = searchParams.get('category');
  const sortParam = searchParams.get('sort');
  const searchQuery = searchParams.get('search');
  const isNewArrivals = sortParam === 'latest';

  // Combo offer context (when navigated from OffersPage)
  const comboId = searchParams.get('combo');
  const comboMin = searchParams.get('comboMin');
  const [comboInfo, setComboInfo] = useState(null);

  // Filter & sort state
  const [sortOption, setSortOption] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [appliedMinPrice, setAppliedMinPrice] = useState('');
  const [appliedMaxPrice, setAppliedMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Reset filters when URL category changes
  useEffect(() => {
    setSortOption('');
    setMinPrice('');
    setMaxPrice('');
    setAppliedMinPrice('');
    setAppliedMaxPrice('');
    setSelectedCategory('');
  }, [categorySlug, searchQuery]);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch combo info when navigated from offers page
  useEffect(() => {
    if (!comboId) {
      setComboInfo(null);
      return;
    }
    const fetchCombo = async () => {
      try {
        const { data } = await API.get('/combo-offers/active');
        if (data.success) {
          const combo = data.comboOffers.find(c => c._id === comboId);
          if (combo) setComboInfo(combo);
        }
      } catch {
        // ignore
      }
    };
    fetchCombo();
  }, [comboId]);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, sortParam, searchQuery, sortOption, selectedCategory, appliedMinPrice, appliedMaxPrice]);

  const fetchCategories = async () => {
    try {
      const { data } = await API.get('/categories');
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let data;

      if (isNewArrivals && !sortOption && !selectedCategory && !appliedMinPrice && !appliedMaxPrice) {
        const response = await API.get('/products/new-arrivals');
        data = response.data;
      } else {
        const params = {};
        // Category: URL param takes priority, then dropdown selection
        const activeCat = categorySlug || selectedCategory;
        if (activeCat) params.category = activeCat;
        if (searchQuery) params.search = searchQuery;
        if (sortOption) params.sort = sortOption;
        if (appliedMinPrice) params.minPrice = appliedMinPrice;
        if (appliedMaxPrice) params.maxPrice = appliedMaxPrice;
        const response = await API.get('/products', { params });
        data = response.data;
      }

      if (data.success) {
        setProducts(data.products);
        setTotalCount(data.total || data.products.length);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentCategory = useCallback(() => {
    if (searchQuery) return `Search: "${searchQuery}"`;
    if (isNewArrivals) return 'New Arrivals';
    if (!categorySlug) return 'All Products';
    const category = categories.find(cat => cat.slug === categorySlug);
    return category ? category.name : 'Products';
  }, [searchQuery, isNewArrivals, categorySlug, categories]);

  useEffect(() => {
    const categoryName = getCurrentCategory();
    document.title = `${categoryName} - Pokisham`;
  }, [getCurrentCategory]);

  const getBreadcrumbs = () => {
    const breadcrumbs = [{ label: 'Products', path: '/products' }];
    if (searchQuery) {
      breadcrumbs.push({ label: `Search: "${searchQuery}"` });
    } else if (isNewArrivals) {
      breadcrumbs.push({ label: 'New Arrivals' });
    } else if (categorySlug) {
      breadcrumbs.push({ label: getCurrentCategory() });
    }
    return breadcrumbs;
  };

  const handleApplyPrice = () => {
    setAppliedMinPrice(minPrice);
    setAppliedMaxPrice(maxPrice);
  };

  const handlePriceKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleApplyPrice();
    }
  };

  const clearPriceFilter = () => {
    setMinPrice('');
    setMaxPrice('');
    setAppliedMinPrice('');
    setAppliedMaxPrice('');
  };

  const clearCategoryFilter = () => {
    setSelectedCategory('');
  };

  const clearAllFilters = () => {
    setSortOption('');
    setSelectedCategory('');
    clearPriceFilter();
  };

  const hasActiveFilters = sortOption || selectedCategory || appliedMinPrice || appliedMaxPrice;

  const selectedCategoryName = selectedCategory
    ? categories.find(c => c.slug === selectedCategory)?.name || selectedCategory
    : '';

  return (
    <>
      <SEO
        title={getCurrentCategory()}
        description={`Shop ${getCurrentCategory()} at Pokisham. Browse our collection of handcrafted products with free shipping on orders above ₹999.`}
        url={categorySlug ? `/products?category=${categorySlug}` : '/products'}
        keywords={`${getCurrentCategory()}, handcrafted products, buy online, Pokisham, South Indian gifts`}
      />
      <Breadcrumb items={getBreadcrumbs()} />
      <div className="container-custom py-8 sm:py-12">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-4xl font-display font-bold text-gray-900 mb-1 sm:mb-2">
            {getCurrentCategory()}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {searchQuery
              ? `Showing results for "${searchQuery}"`
              : isNewArrivals
              ? 'Check out our latest products just added to the store!'
              : categorySlug
              ? `Browse our collection of ${getCurrentCategory().toLowerCase()}`
              : 'Browse our complete product catalog'}
          </p>
        </div>

        {/* Combo Offer Banner */}
        {comboInfo && (
          <div className="mb-4 sm:mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
                <FiGift className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-green-800">
                  {comboInfo.title}
                </h3>
                <p className="text-xs sm:text-sm text-green-700 mt-0.5">
                  Add {comboMin || comboInfo.minItemsFromCategory || 2}+ items from this category to your cart to get{' '}
                  <span className="font-bold">
                    {comboInfo.discountType === 'percentage'
                      ? `${comboInfo.discountValue}% OFF`
                      : `₹${comboInfo.discountValue} OFF`}
                  </span>
                </p>
                {comboInfo.applicableCategories?.length > 1 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {comboInfo.applicableCategories.map((cat) => (
                      <Link
                        key={cat._id}
                        to={`/products?category=${cat.slug || ''}&combo=${comboId}&comboMin=${comboMin || comboInfo.minItemsFromCategory || 2}`}
                        className={`text-[11px] sm:text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                          categorySlug === cat.slug
                            ? 'bg-green-600 text-white'
                            : 'bg-white text-green-700 border border-green-300 hover:bg-green-100'
                        }`}
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <Link
                to="/cart"
                className="flex-shrink-0 inline-flex items-center gap-1.5 bg-green-600 text-white text-xs sm:text-sm font-medium px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <FiShoppingCart className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">View Cart</span>
              </Link>
            </div>
          </div>
        )}

        {/* Filter & Sort Bar */}
        <div className="mb-4 sm:mb-6">
          {/* Desktop filters */}
          <div className="hidden md:flex items-center gap-3 flex-wrap">
            {/* Sort */}
            <div className="relative">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
              >
                <option value="">Sort by: Default</option>
                <option value="latest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
              <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Category dropdown — only when no category in URL */}
            {!categorySlug && (
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            )}

            {/* Price range */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min ₹"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                onKeyDown={handlePriceKeyDown}
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="number"
                placeholder="Max ₹"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                onKeyDown={handlePriceKeyDown}
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                onClick={handleApplyPrice}
                className="bg-primary-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Go
              </button>
            </div>

            {/* Product count */}
            {!loading && (
              <span className="ml-auto text-sm text-gray-500">
                {totalCount} {totalCount === 1 ? 'product' : 'products'}
              </span>
            )}
          </div>

          {/* Mobile: compact inline bar */}
          <div className="md:hidden">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(true)}
                className={`flex items-center gap-1.5 border rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  hasActiveFilters
                    ? 'bg-primary-50 border-primary-300 text-primary-700'
                    : 'bg-white border-gray-300 text-gray-600'
                }`}
              >
                <FiFilter className="w-3.5 h-3.5" />
                Filter
                {hasActiveFilters && (
                  <span className="bg-primary-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center leading-none">
                    {(selectedCategory ? 1 : 0) + (appliedMinPrice || appliedMaxPrice ? 1 : 0)}
                  </span>
                )}
              </button>

              {/* Sort as pill */}
              <div className="relative flex-1">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-300 rounded-full px-3 py-1.5 pr-7 text-xs font-medium text-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Sort: Default</option>
                  <option value="latest">Newest</option>
                  <option value="price_asc">Price: Low-High</option>
                  <option value="price_desc">Price: High-Low</option>
                </select>
                <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>

              {!loading && (
                <span className="text-[11px] text-gray-400 whitespace-nowrap">{totalCount} items</span>
              )}
            </div>
          </div>

          {/* Mobile bottom sheet overlay */}
          {showFilters && (
            <div className="md:hidden fixed inset-0 z-50">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setShowFilters(false)}
              />
              {/* Sheet */}
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl max-h-[70vh] overflow-y-auto animate-sheet-up">
                {/* Handle bar */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                  <h3 className="text-base font-semibold text-gray-900">Filters</h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-5 py-4 space-y-5">
                  {/* Category */}
                  {!categorySlug && (
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">Category</label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedCategory('')}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            !selectedCategory
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-white text-gray-600 border-gray-300'
                          }`}
                        >
                          All
                        </button>
                        {categories.map((cat) => (
                          <button
                            key={cat._id}
                            onClick={() => setSelectedCategory(cat.slug)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                              selectedCategory === cat.slug
                                ? 'bg-primary-600 text-white border-primary-600'
                                : 'bg-white text-gray-600 border-gray-300'
                            }`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">Price Range</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                        <input
                          type="number"
                          placeholder="Min"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <span className="text-gray-300">—</span>
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom actions */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 flex gap-3">
                  <button
                    onClick={() => {
                      clearAllFilters();
                      setShowFilters(false);
                    }}
                    className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => {
                      handleApplyPrice();
                      setShowFilters(false);
                    }}
                    className="flex-1 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3 flex-wrap">
              {sortOption && (
                <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-[11px] sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                  {sortOption === 'latest' ? 'Newest' : sortOption === 'price_asc' ? 'Low-High' : 'High-Low'}
                  <button onClick={() => setSortOption('')} className="hover:text-primary-900">
                    <FiX className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                </span>
              )}
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-[11px] sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                  {selectedCategoryName}
                  <button onClick={clearCategoryFilter} className="hover:text-primary-900">
                    <FiX className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                </span>
              )}
              {(appliedMinPrice || appliedMaxPrice) && (
                <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-[11px] sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                  {appliedMinPrice && appliedMaxPrice
                    ? `₹${appliedMinPrice} – ₹${appliedMaxPrice}`
                    : appliedMinPrice
                    ? `From ₹${appliedMinPrice}`
                    : `Up to ₹${appliedMaxPrice}`}
                  <button onClick={clearPriceFilter} className="hover:text-primary-900">
                    <FiX className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="text-[11px] sm:text-sm text-gray-400 hover:text-gray-600 underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              {searchQuery
                ? `No products found for "${searchQuery}".`
                : isNewArrivals
                ? 'No new arrivals at the moment.'
                : hasActiveFilters
                ? 'No products match your filters.'
                : 'No products found in this category.'}
            </p>
            <p className="text-gray-500 mt-2">
              {hasActiveFilters ? (
                <button onClick={clearAllFilters} className="text-primary-600 hover:underline font-medium">
                  Clear all filters
                </button>
              ) : searchQuery ? (
                'Try a different search term or browse our collections.'
              ) : (
                'Check back soon for new arrivals!'
              )}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ProductsPage;
