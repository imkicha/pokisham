import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiLock, FiEye, FiDatabase, FiMail, FiUsers, FiSettings, FiAlertCircle } from 'react-icons/fi';
import Breadcrumb from '../components/common/Breadcrumb';

const PrivacyPolicy = () => {
  useEffect(() => {
    document.title = 'Privacy Policy - Pokisham';
    window.scrollTo(0, 0);
  }, []);

  const breadcrumbs = [
    { label: 'Privacy Policy' }
  ];

  const sections = [
    {
      icon: FiDatabase,
      title: 'Information We Collect',
      content: [
        {
          subtitle: 'Personal Information',
          text: 'When you create an account or place an order, we collect your name, email address, phone number, and delivery address. This information is essential for processing your orders and providing customer support.'
        },
        {
          subtitle: 'Payment Information',
          text: 'We use secure third-party payment processors. We do not store your complete credit/debit card details on our servers. Only transaction references are kept for order tracking.'
        },
        {
          subtitle: 'Usage Data',
          text: 'We automatically collect information about how you interact with our platform, including pages visited, products viewed, and time spent on our site to improve your shopping experience.'
        }
      ]
    },
    {
      icon: FiEye,
      title: 'How We Use Your Information',
      content: [
        {
          subtitle: 'Order Processing',
          text: 'Your personal information is used to process orders, arrange deliveries, and communicate order status updates via email or SMS notifications.'
        },
        {
          subtitle: 'Customer Support',
          text: 'We use your contact information to respond to inquiries, resolve issues, and provide assistance with your orders.'
        },
        {
          subtitle: 'Personalization',
          text: 'We analyze your browsing and purchase history to provide personalized product recommendations and relevant offers.'
        },
        {
          subtitle: 'Marketing Communications',
          text: 'With your consent, we may send promotional emails about new products, special offers, and updates. You can opt out at any time.'
        }
      ]
    },
    {
      icon: FiUsers,
      title: 'Information Sharing',
      content: [
        {
          subtitle: 'Service Providers',
          text: 'We share necessary information with delivery partners, payment processors, and other service providers who help us operate our business.'
        },
        {
          subtitle: 'Legal Requirements',
          text: 'We may disclose your information if required by law, court order, or government regulation, or to protect our rights and safety.'
        },
        {
          subtitle: 'Business Transfers',
          text: 'In case of a merger, acquisition, or sale of assets, your information may be transferred as part of the business transaction.'
        }
      ]
    },
    {
      icon: FiLock,
      title: 'Data Security',
      content: [
        {
          subtitle: 'Encryption',
          text: 'All data transmitted between your device and our servers is encrypted using SSL/TLS technology to prevent unauthorized access.'
        },
        {
          subtitle: 'Secure Storage',
          text: 'Your personal data is stored on secure servers with restricted access, regular security audits, and backup protocols.'
        },
        {
          subtitle: 'Password Protection',
          text: 'Your passwords are hashed using industry-standard algorithms. We never store or have access to your plain-text passwords.'
        }
      ]
    },
    {
      icon: FiSettings,
      title: 'Your Rights & Choices',
      content: [
        {
          subtitle: 'Access & Update',
          text: 'You can access and update your personal information anytime through your account settings or by contacting our support team.'
        },
        {
          subtitle: 'Delete Account',
          text: 'You have the right to request deletion of your account and associated data. Some information may be retained for legal compliance.'
        },
        {
          subtitle: 'Marketing Preferences',
          text: 'You can manage your communication preferences and unsubscribe from marketing emails using the link provided in each email.'
        },
        {
          subtitle: 'Cookie Settings',
          text: 'You can control cookies through your browser settings. Note that disabling cookies may affect some features of our website.'
        }
      ]
    },
    {
      icon: FiAlertCircle,
      title: 'Cookies & Tracking',
      content: [
        {
          subtitle: 'Essential Cookies',
          text: 'These cookies are necessary for the website to function properly, including maintaining your session and shopping cart.'
        },
        {
          subtitle: 'Analytics Cookies',
          text: 'We use analytics tools to understand how visitors use our site, helping us improve performance and user experience.'
        },
        {
          subtitle: 'Marketing Cookies',
          text: 'These cookies may be used to deliver relevant advertisements and track the effectiveness of our marketing campaigns.'
        }
      ]
    }
  ];

  return (
    <>
      <Breadcrumb items={breadcrumbs} />
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8 md:py-12">
        <div className="container-custom">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-6">
              <FiShield className="w-10 h-10 text-primary-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              At Pokisham, we are committed to protecting your privacy and ensuring the security of your personal information. This policy explains how we collect, use, and safeguard your data.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Last updated: December 2024
            </p>
          </div>

          {/* Content Sections */}
          <div className="max-w-4xl mx-auto space-y-8">
            {sections.map((section, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <section.icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                    {section.title}
                  </h2>
                </div>
                <div className="space-y-6">
                  {section.content.map((item, idx) => (
                    <div key={idx} className="border-l-4 border-primary-200 pl-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{item.subtitle}</h3>
                      <p className="text-gray-600 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Contact Section */}
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl shadow-lg p-6 md:p-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <FiMail className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold">
                  Questions or Concerns?
                </h2>
              </div>
              <p className="mb-6 text-white/90">
                If you have any questions about this Privacy Policy or how we handle your data, please don't hesitate to reach out to us.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  <FiMail className="w-5 h-5" />
                  Contact Us
                </Link>
                <a
                  href="mailto:privacy@pokisham.com"
                  className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
                >
                  privacy@pokisham.com
                </a>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm">
                By using Pokisham, you agree to this Privacy Policy.
                We may update this policy periodically, and changes will be posted on this page.
              </p>
              <Link to="/terms" className="text-primary-600 hover:underline text-sm font-medium mt-2 inline-block">
                View Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;
