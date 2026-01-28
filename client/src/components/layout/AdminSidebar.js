import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiHome, FiPackage, FiShoppingBag, FiUsers, FiMessageCircle,
  FiGrid, FiMenu, FiGift, FiBox, FiLayers, FiChevronLeft, FiChevronRight, FiX, FiImage
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
  { title: 'Popup Poster', path: '/admin/popup-settings', icon: FiImage },
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
                ? 'bg-white/10 text-white border-l-2 border-primary-400'
                : 'text-gray-300 hover:bg-white/5 hover:text-white'
            } ${collapsed ? 'justify-center' : ''}`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-primary-400' : ''}`} />
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
        className={`hidden lg:flex flex-col bg-gradient-to-b from-gray-900 to-black border-r border-gray-800 transition-all duration-300 sticky top-0 h-screen ${
          collapsed ? 'w-[68px]' : 'w-60'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
          {!collapsed && (
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Admin Panel</h2>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/10 transition-colors"
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
          <aside className="relative w-72 max-w-[80vw] bg-gradient-to-b from-gray-900 to-black shadow-xl flex flex-col animate-slide-right">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Admin Panel</h2>
              <button
                onClick={onMobileClose}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/10 transition-colors"
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
