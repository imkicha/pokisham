import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiHome, FiPackage, FiShoppingBag, FiUsers, FiMessageCircle,
  FiGrid, FiMenu, FiGift, FiBox, FiLayers, FiChevronLeft, FiChevronRight, FiX
} from 'react-icons/fi';

const adminMenuItems = [
  { title: 'Dashboard', path: '/admin', icon: FiHome, exact: true },
  { title: 'Products', path: '/admin/products', icon: FiPackage },
  { title: 'Orders', path: '/admin/orders', icon: FiShoppingBag },
  { title: 'Users', path: '/admin/users', icon: FiUsers },
  { title: 'Messages', path: '/admin/messages', icon: FiMessageCircle },
  { title: 'Categories', path: '/admin/categories', icon: FiGrid },
  { title: 'Navbar Settings', path: '/admin/navbar-settings', icon: FiMenu },
  { title: 'Offers', path: '/admin/offers', icon: FiGift },
  { title: 'Combo Offers', path: '/admin/combo-offers', icon: FiLayers },
  { title: 'Treasure Settings', path: '/admin/treasure-settings', icon: FiBox },
];

const NavList = ({ items, isActive, collapsed, onItemClick }) => (
  <ul className="space-y-1 px-2">
    {items.map((item) => {
      const Icon = item.icon;
      const active = isActive(item);
      return (
        <li key={item.path}>
          <Link
            to={item.path}
            onClick={onItemClick}
            title={collapsed ? item.title : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              active
                ? 'bg-primary-50 text-primary-700 border-l-2 border-primary-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            } ${collapsed ? 'justify-center' : ''}`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-primary-600' : ''}`} />
            {!collapsed && <span>{item.title}</span>}
          </Link>
        </li>
      );
    })}
  </ul>
);

const AdminSidebar = ({ mobileOpen, onMobileClose }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 sticky top-0 h-screen ${
          collapsed ? 'w-[68px]' : 'w-60'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          {!collapsed && (
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Admin Panel</h2>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {collapsed ? <FiChevronRight className="w-4 h-4" /> : <FiChevronLeft className="w-4 h-4" />}
          </button>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          <NavList items={adminMenuItems} isActive={isActive} collapsed={collapsed} />
        </nav>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40" onClick={onMobileClose} />
          <aside className="relative w-72 max-w-[80vw] bg-white shadow-xl flex flex-col animate-slide-right">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Admin Panel</h2>
              <button
                onClick={onMobileClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 py-3 overflow-y-auto">
              <NavList items={adminMenuItems} isActive={isActive} collapsed={false} onItemClick={onMobileClose} />
            </nav>
          </aside>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
