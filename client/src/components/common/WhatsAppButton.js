import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

const WhatsAppButton = () => {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  // WhatsApp number - replace with your actual number (without + or spaces)
  const whatsappNumber = '918682821273';
  const defaultMessage = 'Hi! I have a question about Pokisham products.';

  const handleWhatsAppClick = () => {
    const encodedMessage = encodeURIComponent(defaultMessage);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed bottom-24 right-4 z-40">
      {/* Tooltip/Chat bubble */}
      {isTooltipOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl p-4 w-64 animate-scale-in">
          <button
            onClick={() => setIsTooltipOpen(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-4 h-4" />
          </button>
          <p className="text-sm text-gray-700 mb-3 pr-4">
            Need help? Chat with us on WhatsApp!
          </p>
          <button
            onClick={handleWhatsAppClick}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            <FaWhatsapp className="w-5 h-5" />
            Start Chat
          </button>
          {/* Arrow pointing to button */}
          <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white transform rotate-45 shadow-lg"></div>
        </div>
      )}

      {/* WhatsApp Floating Button */}
      <button
        onClick={() => {
          if (isTooltipOpen) {
            handleWhatsAppClick();
          } else {
            setIsTooltipOpen(true);
          }
        }}
        className="group relative bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110"
        aria-label="Chat on WhatsApp"
      >
        <FaWhatsapp className="w-7 h-7" />

        {/* Pulse animation ring */}
        <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-30"></span>

        {/* Hover tooltip - Desktop only */}
        <span className="hidden sm:block absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Chat with us
          <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900"></span>
        </span>
      </button>
    </div>
  );
};

export default WhatsAppButton;
