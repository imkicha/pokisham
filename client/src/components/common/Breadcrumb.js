import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiChevronRight } from 'react-icons/fi';

const Breadcrumb = ({ items }) => {
  return (
    <nav className="bg-gray-50 border-b border-gray-200 py-3 animate-slide-up">
      <div className="container-custom">
        <ol className="flex items-center space-x-2 text-sm">
          {/* Home Link */}
          <li>
            <Link
              to="/"
              className="flex items-center gap-1 text-gray-600 hover:text-primary-600 transition-colors group"
            >
              <FiHome className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </li>

          {/* Breadcrumb Items */}
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              <FiChevronRight className="w-4 h-4 text-gray-400" />
              {item.path ? (
                <Link
                  to={item.path}
                  className="text-gray-600 hover:text-primary-600 transition-colors hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-gray-900 font-medium">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
};

export default Breadcrumb;
