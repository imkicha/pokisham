import { useState } from 'react';
import { FiMail, FiPhone, FiMapPin, FiClock, FiSend } from 'react-icons/fi';
import { FaWhatsapp, FaInstagram, FaFacebookF } from 'react-icons/fa';
import Breadcrumb from '../../components/common/Breadcrumb';
import toast from 'react-hot-toast';
import API from '../../api/axios';
import giftImage from '../../assets/images/pokisham-gift-removebg-preview.png';

const ContactPage = () => {
  const breadcrumbs = [{ label: 'Contact Us' }];
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const { data } = await API.post('/contact', formData);
      if (data.success) {
        toast.success(data.message || 'Message sent successfully! We will get back to you soon.');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: <FiMapPin className="w-6 h-6" />,
      title: 'Address',
      content: '105B D D main road arappalayam madurai-625016',
      link: 'https://maps.google.com/?q=Madurai,Tamil+Nadu',
    },
    {
      icon: <FiPhone className="w-6 h-6" />,
      title: 'Phone',
      content: '+91 8682821273',
      link: 'tel:+918682821273',
    },
    {
      icon: <FiMail className="w-6 h-6" />,
      title: 'Email',
      content: 'pokisham.info@gmail.com',
      link: 'mailto:pokisham.info@gmail.com',
    },
    {
      icon: <FiClock className="w-6 h-6" />,
      title: 'Business Hours',
      content: 'Mon - Sat: 9:00 AM - 7:00 PM',
      link: null,
    },
  ];

  const socialLinks = [
    {
      icon: <FaWhatsapp className="w-6 h-6" />,
      name: 'WhatsApp',
      link: 'https://wa.me/918682821273',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      icon: <FaInstagram className="w-6 h-6" />,
      name: 'Instagram',
      link: 'https://www.instagram.com/pokisham.com_?utm_source=qr',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
    },
    {
      icon: <FaFacebookF className="w-6 h-6" />,
      name: 'Facebook',
      link: 'https://facebook.com/pokisham',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
  ];

  return (
    <>
      <Breadcrumb items={breadcrumbs} />
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-8 sm:py-12">
          <div className="container-custom">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-3 sm:mb-4">
                  Contact Us
                </h1>
                <p className="text-base sm:text-lg max-w-xl opacity-90">
                  Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                </p>
              </div>
              <img
                src={giftImage}
                alt="Gift Exchange"
                className="w-32 h-32 sm:w-40 sm:h-40 object-contain hidden md:block"
              />
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-8 sm:py-12">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Contact Info */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 mb-6">
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-gray-900 mb-4 sm:mb-6">
                    Get in Touch
                  </h2>
                  <div className="space-y-4 sm:space-y-5">
                    {contactInfo.map((info, index) => (
                      <div key={index} className="flex items-start gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-primary-100 rounded-lg text-primary-600 flex-shrink-0">
                          {info.icon}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 text-sm sm:text-base">{info.title}</h3>
                          {info.link ? (
                            <a
                              href={info.link}
                              target={info.link.startsWith('http') ? '_blank' : '_self'}
                              rel="noopener noreferrer"
                              className="text-gray-600 hover:text-primary-600 transition-colors text-sm sm:text-base"
                            >
                              {info.content}
                            </a>
                          ) : (
                            <p className="text-gray-600 text-sm sm:text-base">{info.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Social Links */}
                <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-display font-bold text-gray-900 mb-4">
                    Follow Us
                  </h2>
                  <div className="flex gap-3">
                    {socialLinks.map((social, index) => (
                      <a
                        key={index}
                        href={social.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-3 rounded-lg text-white transition-all transform hover:scale-110 ${social.color}`}
                        title={social.name}
                      >
                        {social.icon}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-md p-5 sm:p-8">
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-gray-900 mb-4 sm:mb-6">
                    Send us a Message
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                          placeholder="Your name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Phone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                          placeholder="+91 9876543210"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Subject
                        </label>
                        <select
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        >
                          <option value="">Select a subject</option>
                          <option value="general">General Inquiry</option>
                          <option value="order">Order Related</option>
                          <option value="product">Product Question</option>
                          <option value="custom">Custom Order</option>
                          <option value="feedback">Feedback</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={5}
                        className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                        placeholder="How can we help you?"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-auto btn-primary px-8 py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <FiSend className="w-5 h-5" />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="py-8 sm:py-12 bg-white">
          <div className="container-custom">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-gray-900 text-center mb-6 sm:mb-8">
              Find Us
            </h2>
            <div className="rounded-xl overflow-hidden shadow-md h-64 sm:h-80 md:h-96">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125323.40216322!2d78.04268627539064!3d9.939093100000007!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b00c582b1189633%3A0xdc955b7264f63933!2sMadurai%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1704189234567!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Pokisham Location"
              />
            </div>
          </div>
        </section>

        {/* FAQ Teaser */}
        <section className="py-8 sm:py-12 bg-gray-50">
          <div className="container-custom text-center">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-gray-900 mb-3 sm:mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 mb-6 px-4">
              Have common questions? Check out our FAQ section for quick answers.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto text-left">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">What is the delivery time?</h3>
                <p className="text-sm text-gray-600">Standard delivery takes 5-7 business days. Express delivery is available for select locations.</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Do you accept custom orders?</h3>
                <p className="text-sm text-gray-600">Yes! We love creating custom pieces. Contact us with your requirements for a quote.</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">What is your return policy?</h3>
                <p className="text-sm text-gray-600">We offer 7-day returns for unused products in original packaging. Custom orders are non-returnable.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default ContactPage;
