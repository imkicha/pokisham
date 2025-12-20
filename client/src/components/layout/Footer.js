import { Link } from 'react-router-dom';
import { FiFacebook, FiInstagram, FiTwitter, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black text-gray-300">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/treasure-open-removebg-preview.png"
                alt="Pokisham"
                className="w-12 h-12 object-contain"
              />
              <h3 className="text-2xl font-display font-bold text-gradient animate-pulse-slow">Pokisham</h3>
            </div>
            <p className="text-sm mb-4">
              Bringing you the finest collection of South Indian gifts, custom frames, pottery,
              and traditional Golu Bommai.
            </p>
            <div className="flex gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 rounded-full hover:bg-gradient-to-r hover:from-primary-600 hover:to-pink-600 transition-all transform hover:scale-110 hover:rotate-12"
              >
                <FiFacebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 rounded-full hover:bg-gradient-to-r hover:from-pink-600 hover:to-purple-600 transition-all transform hover:scale-110 hover:rotate-12"
              >
                <FiInstagram className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 rounded-full hover:bg-gradient-to-r hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-110 hover:rotate-12"
              >
                <FiTwitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="animate-fade-in" style={{animationDelay: '0.1s'}}>
            <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="hover:text-primary-400 transition-all transform hover:translate-x-2 inline-block">
                  Shop All
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary-400 transition-all transform hover:translate-x-2 inline-block">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary-400 transition-all transform hover:translate-x-2 inline-block">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/track-order" className="hover:text-primary-400 transition-all transform hover:translate-x-2 inline-block">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="animate-fade-in" style={{animationDelay: '0.2s'}}>
            <h4 className="text-lg font-semibold text-white mb-4">Categories</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/products?category=gifts"
                  className="hover:text-primary-400 transition-all transform hover:translate-x-2 inline-block"
                >
                  Gifts
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=frames"
                  className="hover:text-primary-400 transition-all transform hover:translate-x-2 inline-block"
                >
                  Custom Frames
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=pottery"
                  className="hover:text-primary-400 transition-all transform hover:translate-x-2 inline-block"
                >
                  Pottery Items
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=golu-bommai"
                  className="hover:text-primary-400 transition-all transform hover:translate-x-2 inline-block"
                >
                  Golu Bommai
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <FiMapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                <span className="text-sm">105B D D main road arappalaym madurai-625016</span>
              </li>
              <li className="flex items-center gap-2">
                <FiPhone className="w-5 h-5" />
                <span className="text-sm">+91 8682821273</span>
              </li>
              <li className="flex items-center gap-2">
                <FiMail className="w-5 h-5" />
                <span className="text-sm">hello@pokisham.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-center md:text-left">
              © 2025 Pokisham. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link to="/privacy" className="hover:text-primary-400 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-primary-400 transition-colors">
                Terms of Service
              </Link>
              <Link to="/refund" className="hover:text-primary-400 transition-colors">
                Refund Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
