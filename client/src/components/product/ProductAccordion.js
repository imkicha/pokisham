import React, { useState } from 'react';
import { FiChevronDown, FiPackage, FiTruck, FiXCircle, FiRefreshCw, FiFileText } from 'react-icons/fi';

const AccordionItem = ({ title, icon: Icon, children, isOpen, onToggle }) => {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 px-2 text-left hover:bg-gray-50 transition-colors group"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-primary-600" />}
          <span className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
            {title}
          </span>
        </div>
        <FiChevronDown
          className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="max-h-[300px] overflow-y-auto px-2 pb-4 text-gray-600 leading-relaxed whitespace-pre-wrap break-words scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {children}
        </div>
      )}
    </div>
  );
};

const ProductAccordion = ({ product }) => {
  const [openItems, setOpenItems] = useState(['description']);

  const toggleItem = (itemId) => {
    setOpenItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Default content for policies (can be customized per product or from settings)
  const whatsIncluded = product.whatsIncluded || [
    '1x ' + product.name,
    'Eco-friendly packaging',
    'Care instructions card',
    'Gift-ready presentation',
  ];

  const shippingDetails = product.shippingDetails || {
    domestic: 'Free shipping on orders above ₹999. Standard delivery in 5-7 business days.',
    express: 'Express delivery available (2-3 business days) at additional cost.',
    packaging: 'All items are carefully packed to ensure safe delivery.',
  };

  const cancellationPolicy = product.cancellationPolicy || {
    beforeShipping: 'Orders can be cancelled within 24 hours of placing the order.',
    afterShipping: 'Once shipped, orders cannot be cancelled. Please initiate a return after delivery.',
    customItems: 'Custom/personalized items cannot be cancelled once production has started.',
  };

  const returnPolicy = product.returnPolicy || {
    window: '7 days return window from the date of delivery.',
    condition: 'Items must be unused, unwashed, and in original packaging with all tags attached.',
    process: 'Initiate return from My Orders section. Refund will be processed within 5-7 business days after pickup.',
    nonReturnable: 'Custom frames with uploaded photos, perishable items, and sale items are non-returnable.',
  };

  return (
    <div className="product-accordion border border-gray-200 rounded-lg bg-white">
      {/* Description */}
      <AccordionItem
        title="Product Description"
        icon={FiFileText}
        isOpen={openItems.includes('description')}
        onToggle={() => toggleItem('description')}
      >
        <p className="whitespace-pre-line">{product.description}</p>

        {/* Additional product specs if available */}
        {(product.material || product.size) && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="font-medium text-gray-900 mb-2">Specifications</h4>
            <ul className="space-y-1 text-sm">
              {product.material && (
                <li><span className="font-medium">Material:</span> {product.material}</li>
              )}
              {product.size && (
                <li><span className="font-medium">Size:</span> {product.size}</li>
              )}
            </ul>
          </div>
        )}
      </AccordionItem>

      {/* What's Included */}
      <AccordionItem
        title="What's Included"
        icon={FiPackage}
        isOpen={openItems.includes('whatsIncluded')}
        onToggle={() => toggleItem('whatsIncluded')}
      >
        <ul className="space-y-2">
          {whatsIncluded.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-primary-600 mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </AccordionItem>

      {/* Shipping Details */}
      <AccordionItem
        title="Shipping Details"
        icon={FiTruck}
        isOpen={openItems.includes('shipping')}
        onToggle={() => toggleItem('shipping')}
      >
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Domestic Shipping</h4>
            <p className="text-sm">{shippingDetails.domestic}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Express Delivery</h4>
            <p className="text-sm">{shippingDetails.express}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Packaging</h4>
            <p className="text-sm">{shippingDetails.packaging}</p>
          </div>
          <div className="mt-3 p-3 bg-green-50 rounded-lg text-sm text-green-800">
            <span className="font-medium">Free Shipping:</span> On orders above ₹999
          </div>
        </div>
      </AccordionItem>

      {/* Cancellation Policy */}
      <AccordionItem
        title="Cancellation Policy"
        icon={FiXCircle}
        isOpen={openItems.includes('cancellation')}
        onToggle={() => toggleItem('cancellation')}
      >
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Before Shipping</h4>
            <p className="text-sm">{cancellationPolicy.beforeShipping}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">After Shipping</h4>
            <p className="text-sm">{cancellationPolicy.afterShipping}</p>
          </div>
          {product.requiresCustomPhoto && (
            <div className="mt-3 p-3 bg-orange-50 rounded-lg text-sm text-orange-800">
              <span className="font-medium">Note:</span> {cancellationPolicy.customItems}
            </div>
          )}
        </div>
      </AccordionItem>

      {/* Return Policy */}
      <AccordionItem
        title="Return & Refund Policy"
        icon={FiRefreshCw}
        isOpen={openItems.includes('return')}
        onToggle={() => toggleItem('return')}
      >
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Return Window</h4>
            <p className="text-sm">{returnPolicy.window}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Condition</h4>
            <p className="text-sm">{returnPolicy.condition}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Return Process</h4>
            <p className="text-sm">{returnPolicy.process}</p>
          </div>
          {product.requiresCustomPhoto && (
            <div className="mt-3 p-3 bg-red-50 rounded-lg text-sm text-red-800">
              <span className="font-medium">Non-Returnable:</span> {returnPolicy.nonReturnable}
            </div>
          )}
        </div>
      </AccordionItem>
    </div>
  );
};

export default ProductAccordion;
