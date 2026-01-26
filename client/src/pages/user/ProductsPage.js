import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../../components/product/ProductCard';
import Breadcrumb from '../../components/common/Breadcrumb';
import API from '../../api/axios';
import SEO from '../../components/common/SEO';

const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const categorySlug = searchParams.get('category');
  const sortParam = searchParams.get('sort');
  const searchQuery = searchParams.get('search');
  const isNewArrivals = sortParam === 'latest';

  useEffect(() => {
    const categoryName = getCurrentCategory();
    document.title = `${categoryName} - Pokisham`;
    fetchCategories();
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, sortParam, searchQuery]);

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

      if (isNewArrivals) {
        const response = await API.get('/products/new-arrivals');
        data = response.data;
      } else {
        const params = {};
        if (categorySlug) params.category = categorySlug;
        if (searchQuery) params.search = searchQuery;
        const response = await API.get('/products', { params });
        data = response.data;
      }

      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentCategory = () => {
    if (searchQuery) return `Search: "${searchQuery}"`;
    if (isNewArrivals) return 'New Arrivals';
    if (!categorySlug) return 'All Products';
    const category = categories.find(cat => cat.slug === categorySlug);
    return category ? category.name : 'Products';
  };

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

  return (
    <>
      <SEO
        title={getCurrentCategory()}
        description={`Shop ${getCurrentCategory()} at Pokisham. Browse our collection of handcrafted products with free shipping on orders above ₹999.`}
        url={categorySlug ? `/products?category=${categorySlug}` : '/products'}
        keywords={`${getCurrentCategory()}, handcrafted products, buy online, Pokisham, South Indian gifts`}
      />
      <Breadcrumb items={getBreadcrumbs()} />
      <div className="container-custom py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">
            {getCurrentCategory()}
          </h1>
          <p className="text-gray-600">
            {searchQuery
              ? `Showing results for "${searchQuery}"`
              : isNewArrivals
              ? 'Check out our latest products just added to the store!'
              : categorySlug
              ? `Browse our collection of ${getCurrentCategory().toLowerCase()}`
              : 'Browse our complete product catalog'}
          </p>
        </div>

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
              : 'No products found in this category.'}
          </p>
          <p className="text-gray-500 mt-2">
            {searchQuery ? 'Try a different search term or browse our collections.' : 'Check back soon for new arrivals!'}
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
