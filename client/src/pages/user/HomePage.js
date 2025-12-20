import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiGift, FiImage, FiCoffee, FiStar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import ProductCard from '../../components/product/ProductCard';
import API from '../../api/axios';
import { PokishamBanner } from '../../components/common/PokishamRibbon';
import Treasure from '../../components/common/Treasure';

// Default placeholder image for categories without images
const DEFAULT_CATEGORY_IMAGE = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400';

// Icon mapping for categories
const getCategoryIcon = (categoryName) => {
  const name = categoryName?.toLowerCase() || '';
  if (name.includes('gift')) return <FiGift className="w-8 h-8 sm:w-12 sm:h-12" />;
  if (name.includes('frame')) return <FiImage className="w-8 h-8 sm:w-12 sm:h-12" />;
  if (name.includes('pottery') || name.includes('pot')) return <FiCoffee className="w-8 h-8 sm:w-12 sm:h-12" />;
  if (name.includes('golu') || name.includes('bommai') || name.includes('doll')) return <FiStar className="w-8 h-8 sm:w-12 sm:h-12" />;
  return <FiGift className="w-8 h-8 sm:w-12 sm:h-12" />;
};

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    document.title = 'Pokisham - Handcrafted Treasures';
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await API.get('/products');
      if (data.success) {
        setFeaturedProducts(data.products.filter(p => p.isFeatured).slice(0, 4));
        setTrendingProducts(data.products.filter(p => p.isTrending).slice(0, 4));
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await API.get('/categories');
      if (data.success) {
        // Transform categories for display
        const formattedCategories = data.categories.map(cat => ({
          _id: cat._id,
          name: cat.name,
          description: cat.description || `Explore our ${cat.name} collection`,
          image: cat.image || DEFAULT_CATEGORY_IMAGE,
          slug: cat.slug,
          link: `/products?category=${cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')}`,
        }));
        setCategories(formattedCategories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Floating Treasure */}
      <Treasure />

      {/* Pokisham Promotional Banner */}
      <PokishamBanner variant="festive" />

      {/* Hero Section */}
      <section className="relative h-[500px] md:h-[600px] flex items-center justify-center south-indian-pattern overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 via-pink-500/10 to-secondary-600/20 animate-gradient"></div>

        {/* Animated floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-20 h-20 bg-primary-300 rounded-full opacity-20 animate-float"></div>
          <div className="absolute bottom-32 right-20 w-32 h-32 bg-secondary-300 rounded-full opacity-20 animate-float" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-40 right-40 w-16 h-16 bg-pink-300 rounded-full opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6 animate-fade-in">
            Welcome to <span className="text-gradient animate-pulse-slow">Pokisham</span>
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-gray-700 mb-8 max-w-2xl mx-auto animate-slide-up">
            Discover authentic South Indian gifts, custom frames, pottery, and traditional Golu Bommai
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 btn-primary text-lg animate-scale-in transform hover:gap-3 transition-all"
          >
            Shop Now <FiArrowRight className="animate-pulse" />
          </Link>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="container-custom">
          <div className="text-center mb-8 sm:mb-12 animate-fade-in">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-2 sm:mb-4 text-gradient">Shop by Category</h2>
            <p className="text-gray-600 text-sm sm:text-lg">Explore our curated collections</p>
          </div>

          {/* Category Slider */}
          {categoriesLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No categories available yet.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Left Arrow */}
              <button
                onClick={() => {
                  const container = document.getElementById('category-slider');
                  container.scrollBy({ left: -280, behavior: 'smooth' });
                }}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 sm:p-3 hover:bg-gray-50 transition-colors -ml-2 sm:-ml-4 hidden sm:flex items-center justify-center"
              >
                <FiChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
              </button>

              {/* Scrollable Container */}
              <div
                id="category-slider"
                className="flex gap-4 overflow-x-auto scroll-smooth pb-4 px-1 sm:px-8 hide-scrollbar"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {categories.map((category, index) => (
                  <Link
                    key={category._id || category.name}
                    to={category.link}
                    className="group flex-shrink-0 w-[160px] sm:w-[220px] md:w-[260px] card overflow-hidden animate-slide-up hover:shadow-2xl"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="relative h-[200px] sm:h-[240px] md:h-[280px] overflow-hidden">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = DEFAULT_CATEGORY_IMAGE;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-3 sm:p-5">
                        <div className="text-white">
                          <div className="scale-75 sm:scale-100 origin-left">{getCategoryIcon(category.name)}</div>
                          <h3 className="text-lg sm:text-xl md:text-2xl font-display font-bold mt-1 sm:mt-2">{category.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-200 mt-0.5 sm:mt-1 line-clamp-2">{category.description}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Right Arrow */}
              <button
                onClick={() => {
                  const container = document.getElementById('category-slider');
                  container.scrollBy({ left: 280, behavior: 'smooth' });
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 sm:p-3 hover:bg-gray-50 transition-colors -mr-2 sm:-mr-4 hidden sm:flex items-center justify-center"
              >
                <FiChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
              </button>

              {/* Mobile Scroll Indicator */}
              <div className="flex justify-center gap-1 mt-4 sm:hidden">
                {categories.map((_, index) => (
                  <div
                    key={index}
                    className="w-2 h-2 rounded-full bg-gray-300"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-display font-bold mb-4">Featured Products</h2>
              <p className="text-gray-600 text-lg">Handpicked favorites just for you</p>
            </div>

            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}

            <div className="text-center mt-8">
              <Link to="/products" className="btn-outline inline-flex items-center gap-2">
                View All Products <FiArrowRight />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Trending Products Section */}
      {trendingProducts.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-display font-bold mb-4">Trending Now</h2>
              <p className="text-gray-600 text-lg">What's hot this season</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {trendingProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiGift className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Free Gift Wrapping</h3>
              <p className="text-gray-600">Make your gifts extra special with our complimentary gift wrapping</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiArrowRight className="w-8 h-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Free shipping on orders above ₹999</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiStar className="w-8 h-8 text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Guaranteed</h3>
              <p className="text-gray-600">Handpicked products with 100% quality assurance</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
        <div className="container-custom text-center">
          <h2 className="text-4xl font-display font-bold mb-4">
            Celebrate Traditions with Pokisham
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Discover our exclusive Golu Bommai collection for the festival season
          </p>
          <Link to="/products?category=golu-bommai" className="btn-outline bg-white text-primary-600 hover:bg-gray-100">
            Explore Collection
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
