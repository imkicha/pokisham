import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHome, FiChevronRight, FiArrowLeft } from 'react-icons/fi';

/**
 * DashboardBreadcrumb - Breadcrumb navigation for admin/tenant/superadmin dashboards
 *
 * @param {Array} items - Array of breadcrumb items with { label, path }
 * @param {string} dashboardType - 'admin' | 'superadmin' | 'tenant'
 * @param {boolean} showBackButton - Whether to show back button (default: true)
 */
const DashboardBreadcrumb = ({ items = [], dashboardType = 'admin', showBackButton = true }) => {
  const navigate = useNavigate();

  const getDashboardConfig = () => {
    switch (dashboardType) {
      case 'superadmin':
        return {
          label: 'Super Admin',
          path: '/superadmin/dashboard',
          color: 'from-purple-600 to-indigo-600',
          hoverColor: 'hover:text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
        };
      case 'tenant':
        return {
          label: 'Seller Dashboard',
          path: '/tenant/dashboard',
          color: 'from-teal-600 to-green-600',
          hoverColor: 'hover:text-teal-600',
          bgColor: 'bg-teal-50',
          borderColor: 'border-teal-200',
        };
      case 'admin':
      default:
        return {
          label: 'Admin',
          path: '/admin',
          color: 'from-primary-600 to-secondary-600',
          hoverColor: 'hover:text-primary-600',
          bgColor: 'bg-primary-50',
          borderColor: 'border-primary-200',
        };
    }
  };

  const config = getDashboardConfig();

  return (
    <nav className={`${config.bgColor} border-b ${config.borderColor} py-3 mb-6 animate-slide-up`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Left Side - Back Button and Breadcrumbs */}
          <div className="flex items-center gap-4">
            {/* Back Button */}
            {showBackButton && items.length > 0 && (
              <button
                onClick={() => navigate(-1)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-white hover:shadow-sm transition-all ${config.hoverColor}`}
              >
                <FiArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">Back</span>
              </button>
            )}

            {/* Breadcrumb Trail */}
            <ol className="flex items-center space-x-2 text-sm">
              {/* Home Link */}
              <li>
                <Link
                  to="/"
                  className={`flex items-center gap-1 text-gray-500 ${config.hoverColor} transition-colors group`}
                >
                  <FiHome className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </Link>
              </li>

              {/* Dashboard Link */}
              <li className="flex items-center gap-2">
                <FiChevronRight className="w-4 h-4 text-gray-400" />
                {items.length > 0 ? (
                  <Link
                    to={config.path}
                    className={`text-gray-600 ${config.hoverColor} transition-colors hover:underline`}
                  >
                    {config.label}
                  </Link>
                ) : (
                  <span className="text-gray-900 font-semibold">{config.label}</span>
                )}
              </li>

              {/* Additional Breadcrumb Items */}
              {items.map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <FiChevronRight className="w-4 h-4 text-gray-400" />
                  {item.path && index < items.length - 1 ? (
                    <Link
                      to={item.path}
                      className={`text-gray-600 ${config.hoverColor} transition-colors hover:underline`}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-gray-900 font-semibold truncate max-w-[200px]">
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DashboardBreadcrumb;
