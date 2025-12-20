import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiFileText, FiShoppingCart, FiTruck, FiRefreshCw, FiCreditCard, FiAlertTriangle, FiUser, FiShield, FiMail } from 'react-icons/fi';
import Breadcrumb from '../components/common/Breadcrumb';

const TermsOfService = () => {
  useEffect(() => {
    document.title = 'Terms of Service - Pokisham';
    window.scrollTo(0, 0);
  }, []);

  const breadcrumbs = [
    { label: 'Terms of Service' }
  ];

  const sections = [
    {
      icon: FiUser,
      title: 'Account Terms',
      content: [
        {
          subtitle: 'Account Creation',
          text: 'To use our services, you must create an account with accurate and complete information. You must be at least 18 years old or have parental consent to use our platform.'
        },
        {
          subtitle: 'Account Security',
          text: 'You are responsible for maintaining the confidentiality of your account credentials. Notify us immediately of any unauthorized access or security breach.'
        },
        {
          subtitle: 'Account Termination',
          text: 'We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or misuse our platform.'
        }
      ]
    },
    {
      icon: FiShoppingCart,
      title: 'Orders & Purchases',
      content: [
        {
          subtitle: 'Product Information',
          text: 'We strive to display accurate product descriptions, images, and prices. However, we do not guarantee that all information is error-free. Colors may vary due to monitor settings.'
        },
        {
          subtitle: 'Order Acceptance',
          text: 'Placing an order constitutes an offer to purchase. We reserve the right to accept or reject orders at our discretion, including for reasons of product availability or pricing errors.'
        },
        {
          subtitle: 'Pricing',
          text: 'All prices are displayed in Indian Rupees (INR) and include applicable taxes unless otherwise stated. Prices are subject to change without prior notice.'
        },
        {
          subtitle: 'Quantity Limits',
          text: 'We may limit the quantity of products purchased per customer to ensure fair availability for all customers.'
        }
      ]
    },
    {
      icon: FiCreditCard,
      title: 'Payment Terms',
      content: [
        {
          subtitle: 'Payment Methods',
          text: 'We accept various payment methods including credit/debit cards, UPI, net banking, and cash on delivery (where available). All payments are processed through secure payment gateways.'
        },
        {
          subtitle: 'Payment Security',
          text: 'All online transactions are encrypted and processed through PCI-DSS compliant payment processors. We do not store complete card details.'
        },
        {
          subtitle: 'Failed Payments',
          text: 'If a payment fails, your order will not be processed. You may retry the payment or choose an alternative payment method.'
        }
      ]
    },
    {
      icon: FiTruck,
      title: 'Shipping & Delivery',
      content: [
        {
          subtitle: 'Delivery Areas',
          text: 'We deliver to serviceable pin codes across India. Delivery availability and charges may vary based on your location.'
        },
        {
          subtitle: 'Delivery Timeline',
          text: 'Estimated delivery times are provided for reference only and may vary due to factors beyond our control such as weather, holidays, or courier delays.'
        },
        {
          subtitle: 'Shipping Charges',
          text: 'Shipping charges are calculated based on order value, weight, and delivery location. Free shipping may be available for orders above a certain value.'
        },
        {
          subtitle: 'Delivery Responsibility',
          text: 'Once an order is handed to the courier, tracking information will be provided. Please ensure accurate delivery address and contact information.'
        }
      ]
    },
    {
      icon: FiRefreshCw,
      title: 'Returns & Refunds',
      content: [
        {
          subtitle: 'Return Policy',
          text: 'Products may be returned within 7 days of delivery if they are unused, in original packaging, and in resalable condition. Certain items like perishables may not be eligible for return.'
        },
        {
          subtitle: 'Return Process',
          text: 'To initiate a return, contact our customer support with your order details. We will arrange for pickup once the return is approved.'
        },
        {
          subtitle: 'Refund Timeline',
          text: 'Refunds are processed within 7-10 business days after we receive and verify the returned item. Refunds will be credited to the original payment method.'
        },
        {
          subtitle: 'Non-Returnable Items',
          text: 'Products that are perishable, personalized, or marked as non-returnable cannot be returned. Sale items may have different return policies.'
        }
      ]
    },
    {
      icon: FiAlertTriangle,
      title: 'User Responsibilities',
      content: [
        {
          subtitle: 'Acceptable Use',
          text: 'You agree to use our platform only for lawful purposes. You must not engage in any activity that could harm our website, other users, or our business.'
        },
        {
          subtitle: 'Prohibited Activities',
          text: 'You must not: use automated bots or scraping tools, attempt to gain unauthorized access, post false reviews, or engage in fraudulent transactions.'
        },
        {
          subtitle: 'Content Submissions',
          text: 'Any reviews, comments, or content you submit must be truthful and not infringe on intellectual property rights of others.'
        }
      ]
    },
    {
      icon: FiShield,
      title: 'Intellectual Property',
      content: [
        {
          subtitle: 'Our Content',
          text: 'All content on our website including logos, images, text, and graphics are owned by Pokisham or our licensors and protected by intellectual property laws.'
        },
        {
          subtitle: 'Limited License',
          text: 'You are granted a limited, non-exclusive license to access and use our website for personal, non-commercial purposes only.'
        },
        {
          subtitle: 'Restrictions',
          text: 'You may not copy, reproduce, modify, distribute, or create derivative works from our content without explicit written permission.'
        }
      ]
    },
    {
      icon: FiFileText,
      title: 'Liability & Disclaimers',
      content: [
        {
          subtitle: 'Limitation of Liability',
          text: 'To the maximum extent permitted by law, Pokisham shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services.'
        },
        {
          subtitle: 'Product Warranties',
          text: 'Products are sold as-is unless otherwise specified. Any warranties are provided by the manufacturer and not by Pokisham.'
        },
        {
          subtitle: 'Third-Party Links',
          text: 'Our website may contain links to third-party websites. We are not responsible for the content or privacy practices of these external sites.'
        },
        {
          subtitle: 'Indemnification',
          text: 'You agree to indemnify and hold Pokisham harmless from any claims arising from your violation of these terms or misuse of our services.'
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
              <FiFileText className="w-10 h-10 text-primary-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Welcome to Pokisham! These terms govern your use of our website and services. By using our platform, you agree to comply with these terms and conditions.
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

            {/* Changes to Terms */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FiAlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Changes to Terms
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting to this page. Your continued use of our services after changes constitutes acceptance of the new terms. We encourage you to review this page periodically.
                  </p>
                </div>
              </div>
            </div>

            {/* Governing Law */}
            <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Governing Law</h2>
              <p className="text-gray-600 leading-relaxed">
                These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from these terms or your use of our services shall be subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka.
              </p>
            </div>

            {/* Contact Section */}
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl shadow-lg p-6 md:p-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <FiMail className="w-6 h-6" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold">
                  Need Clarification?
                </h2>
              </div>
              <p className="mb-6 text-white/90">
                If you have any questions about these Terms of Service or need clarification on any policy, our team is here to help.
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
                  href="mailto:support@pokisham.com"
                  className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
                >
                  support@pokisham.com
                </a>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm">
                By using Pokisham, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
              <Link to="/privacy" className="text-primary-600 hover:underline text-sm font-medium mt-2 inline-block">
                View Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TermsOfService;
