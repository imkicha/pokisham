import React, { useState } from 'react';
import { FiMenu } from 'react-icons/fi';
import Header from './Header';
import Footer from './Footer';
import AdminSidebar from './AdminSidebar';
import WhatsAppButton from '../common/WhatsAppButton';

const AdminLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {/* Mobile Admin Nav Toggle */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-2">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <FiMenu className="w-5 h-5" />
          <span>Admin Menu</span>
        </button>
      </div>
      <div className="flex flex-1">
        <AdminSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        <main className="flex-1 min-w-0 bg-gray-50">
          {children}
        </main>
      </div>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default AdminLayout;
