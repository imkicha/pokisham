import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiFilter, FiX, FiChevronDown } from 'react-icons/fi';
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

        {/* Filter & Sort Bar */}
        <div className="mb-6">
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

          {/* Mobile filter bar */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700"
            >
              <FiFilter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {(sortOption ? 1 : 0) + (selectedCategory ? 1 : 0) + (appliedMinPrice || appliedMaxPrice ? 1 : 0)}
                </span>
              )}
            </button>

            {/* Sort dropdown always visible on mobile */}
            <div className="relative flex-1">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Sort by: Default</option>
                <option value="latest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
              <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {!loading && (
              <span className="text-xs text-gray-500 whitespace-nowrap">{totalCount}</span>
            )}
          </div>

          {/* Mobile expanded filters */}
          {showFilters && (
            <div className="md:hidden mt-3 p-4 bg-gray-50 rounded-lg space-y-3 animate-fade-in">
              {/* Category */}
              {!categorySlug && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat.slug}>{cat.name}</option>
                      ))}
                    </select>
                    <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Price range */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Price Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min ₹"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <span className="text-gray-400 text-sm">to</span>
                  <input
                    type="number"
                    placeholder="Max ₹"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleApplyPrice}
                    className="bg-primary-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                  >
                    Go
                  </button>
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-primary-600 font-medium hover:underline"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {sortOption && (
                <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs sm:text-sm px-3 py-1 rounded-full">
                  {sortOption === 'latest' ? 'Newest' : sortOption === 'price_asc' ? 'Price: Low-High' : 'Price: High-Low'}
                  <button onClick={() => setSortOption('')} className="hover:text-primary-900">
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs sm:text-sm px-3 py-1 rounded-full">
                  {selectedCategoryName}
                  <button onClick={clearCategoryFilter} className="hover:text-primary-900">
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {(appliedMinPrice || appliedMaxPrice) && (
                <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs sm:text-sm px-3 py-1 rounded-full">
                  {appliedMinPrice && appliedMaxPrice
                    ? `₹${appliedMinPrice} – ₹${appliedMaxPrice}`
                    : appliedMinPrice
                    ? `From ₹${appliedMinPrice}`
                    : `Up to ₹${appliedMaxPrice}`}
                  <button onClick={clearPriceFilter} className="hover:text-primary-900">
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="hidden md:inline text-xs sm:text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear all
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
