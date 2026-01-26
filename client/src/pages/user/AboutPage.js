import { FiHeart, FiAward, FiUsers, FiPackage, FiStar, FiGift } from 'react-icons/fi';
import Breadcrumb from '../../components/common/Breadcrumb';
import giftImage from '../../assets/images/pokisham-gift-removebg-preview.png';
import SEO from '../../components/common/SEO';

const AboutPage = () => {
  const breadcrumbs = [{ label: 'About Us' }];

  const stats = [
    { icon: <FiPackage className="w-8 h-8" />, value: '5000+', label: 'Products Delivered' },
    { icon: <FiUsers className="w-8 h-8" />, value: '2000+', label: 'Happy Customers' },
    { icon: <FiStar className="w-8 h-8" />, value: '4.8', label: 'Average Rating' },
    { icon: <FiAward className="w-8 h-8" />, value: '5+', label: 'Years Experience' },
  ];

  const values = [
    {
      icon: <FiHeart className="w-10 h-10 text-primary-600" />,
      title: '100% Handcrafted',
      description: 'Every Pokisham product is handmade by skilled Indian artisans — no mass production, just authentic craftsmanship poured into every piece.',
    },
    {
      icon: <FiAward className="w-10 h-10 text-primary-600" />,
      title: 'Quality You Can Trust',
      description: 'We ensure the highest quality standards for all Pokisham gifts, from premium materials to meticulous finishing touches.',
    },
    {
      icon: <FiGift className="w-10 h-10 text-primary-600" />,
      title: 'Personalized & Customizable',
      description: 'Add names, photos, or custom messages to make every Pokisham gift truly one-of-a-kind — perfect for any occasion.',
    },
  ];

  return (
    <>
      <SEO
        title="About Pokisham - India's Handcrafted Gift Store"
        description="Pokisham is India's trusted online gift store for handcrafted & customized gifts. Learn our story — connecting skilled Indian artisans with gift lovers since day one."
        url="/about"
        keywords="about Pokisham, Pokisham story, Pokisham gifts, handcrafted gifts India, Indian artisan gifts, handmade gift store, customized gifts online"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Pokisham',
          url: 'https://www.pokisham.com',
          description: 'Pokisham is India\'s trusted online gift store for handcrafted & customized gifts, connecting skilled Indian artisans with customers who appreciate authentic handmade products.',
          logo: 'https://www.pokisham.com/logo512.png',
          foundingDate: '2020',
          sameAs: [],
        }}
      />
      <Breadcrumb items={breadcrumbs} />
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-16 sm:py-20">
          <div className="container-custom text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-4 sm:mb-6">
              About Pokisham
            </h1>
            <p className="text-lg sm:text-xl max-w-3xl mx-auto opacity-90 px-4">
              India's trusted online gift store for handcrafted & customized gifts — custom frames, pottery, Golu Bommai, and more
            </p>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-12 sm:py-16 bg-white">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
              <div className="order-2 lg:order-1">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 mb-4 sm:mb-6">
                  Our Story
                </h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    Pokisham was born from a simple belief — every gift should carry emotion, culture, and craftsmanship.
                    What started as a passion to preserve traditional Indian art forms has grown into India's trusted
                    online gift store, connecting skilled artisans with customers who value authentic handcrafted gifts.
                  </p>
                  <p>
                    The name "Pokisham" means treasure — and that's exactly what we bring to your doorstep.
                    Every Pokisham gift is handmade by talented Indian artisans, making each piece unique and meaningful.
                    We believe the best gifts aren't mass-produced — they're crafted with love.
                  </p>
                  <p>
                    From personalized custom photo frames to traditional Golu Bommai dolls,
                    from elegant handmade pottery to customized keepsakes — Pokisham curates gifts that celebrate
                    India's rich cultural heritage while meeting modern aesthetic sensibilities.
                    Whether you're shopping for a birthday, anniversary, festival, or "just because" moment,
                    Pokisham has the perfect handcrafted gift for every occasion.
                  </p>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative">
                  <img
                    src={giftImage}
                    alt="Pokisham Gift Exchange"
                    className="w-64 h-64 sm:w-80 sm:h-80 mx-auto object-contain drop-shadow-xl"
                  />
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 sm:w-32 sm:h-32 bg-primary-100 rounded-full -z-10"></div>
                  <div className="absolute -top-4 -left-4 w-16 h-16 sm:w-20 sm:h-20 bg-secondary-100 rounded-full -z-10"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 sm:py-16 bg-gray-50">
          <div className="container-custom">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-4 sm:p-6 text-center shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="text-primary-600 flex justify-center mb-3 sm:mb-4">
                    {stat.icon}
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-12 sm:py-16 bg-white">
          <div className="container-custom">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 text-center mb-8 sm:mb-12">
              What We Stand For
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="text-center p-6 sm:p-8 rounded-xl bg-gray-50 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex justify-center mb-4">{value.icon}</div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Products */}
        <section className="py-12 sm:py-16 bg-gray-50">
          <div className="container-custom">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 text-center mb-8 sm:mb-12">
              What We Offer
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <img
                  src="https://res.cloudinary.com/dvlz7s8s0/image/upload/v1766040859/custom_frame.jpg"
                  alt="Custom Frames"
                  className="w-full h-40 sm:h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Custom Frames</h3>
                  <p className="text-sm text-gray-600">Personalized photo frames for your precious memories</p>
                </div>
              </div>
              <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <img
                  src="https://res.cloudinary.com/dvlz7s8s0/image/upload/v1766041640/golu_bommai_aayxyt.jpg"
                  alt="Golu Bommai"
                  className="w-full h-40 sm:h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Golu Bommai</h3>
                  <p className="text-sm text-gray-600">Traditional festival dolls for Navaratri celebrations</p>
                </div>
              </div>
              <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <img
                  src="https://res.cloudinary.com/dvlz7s8s0/image/upload/v1766041282/pottery_cat_df4grd.jpg"
                  alt="Pottery"
                  className="w-full h-40 sm:h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Pottery</h3>
                  <p className="text-sm text-gray-600">Handcrafted pottery items for home decor</p>
                </div>
              </div>
              <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <img
                  src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400"
                  alt="Gifts"
                  className="w-full h-40 sm:h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Gifts</h3>
                  <p className="text-sm text-gray-600">Thoughtful gift items for every occasion</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-12 sm:py-16 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
          <div className="container-custom text-center">
            <h2 className="text-2xl sm:text-3xl font-display font-bold mb-4 sm:mb-6">Our Mission</h2>
            <p className="text-base sm:text-lg max-w-3xl mx-auto opacity-90 px-4">
              To make Pokisham India's most loved handcrafted gift store — by connecting talented artisans
              with gift lovers across the country, ensuring fair wages for craftspeople, and delivering
              exceptional quality gifts that bring joy, culture, and meaning to every home.
            </p>
          </div>
        </section>
      </div>
    </>
  );
};

export default AboutPage;
