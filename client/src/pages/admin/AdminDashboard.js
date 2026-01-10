import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiPackage, FiShoppingBag, FiUsers, FiTrendingUp, FiMessageCircle, FiGrid, FiMenu, FiGift, FiBox } from 'react-icons/fi';
import DashboardBreadcrumb from '../../components/common/DashboardBreadcrumb';

const AdminDashboard = () => {
  const { user } = useAuth();

  useEffect(() => {
    document.title = 'Admin Dashboard - Pokisham';
  }, []);

  const stats = [
    {
      title: 'Total Products',
      value: '0',
      icon: FiPackage,
      color: 'bg-blue-500',
      link: '/admin/products',
    },
    {
      title: 'Total Orders',
      value: '0',
      icon: FiShoppingBag,
      color: 'bg-green-500',
      link: '/admin/orders',
    },
    {
      title: 'Total Users',
      value: '0',
      icon: FiUsers,
      color: 'bg-purple-500',
      link: '/admin/users',
    },
    {
      title: 'Revenue',
      value: '₹0',
      icon: FiTrendingUp,
      color: 'bg-yellow-500',
      link: '/admin/reports',
    },
  ];

  const quickActions = [
    {
      title: 'Manage Products',
      description: 'Add, edit, or remove products from your store',
      link: '/admin/products',
      icon: FiPackage,
      color: 'text-blue-600',
    },
    {
      title: 'Manage Orders',
      description: 'View and update order status, track shipments',
      link: '/admin/orders',
      icon: FiShoppingBag,
      color: 'text-green-600',
    },
    {
      title: 'Manage Users',
      description: 'View and manage customer accounts',
      link: '/admin/users',
      icon: FiUsers,
      color: 'text-purple-600',
    },
    {
      title: 'Contact Messages',
      description: 'View and respond to customer inquiries',
      link: '/admin/messages',
      icon: FiMessageCircle,
      color: 'text-pink-600',
    },
    {
      title: 'Manage Categories',
      description: 'Add, edit, or remove product categories',
      link: '/admin/categories',
      icon: FiGrid,
      color: 'text-orange-600',
    },
    {
      title: 'Navbar Settings',
      description: 'Manage which categories appear in the navbar',
      link: '/admin/navbar-settings',
      icon: FiMenu,
      color: 'text-teal-600',
    },
    {
      title: 'Manage Offers',
      description: 'Create promotional banners for festivals and sales',
      link: '/admin/offers',
      icon: FiGift,
      color: 'text-red-600',
    },
    {
      title: 'Treasure Settings',
      description: 'Configure the floating treasure box coupon code',
      link: '/admin/treasure-settings',
      icon: FiBox,
      color: 'text-yellow-600',
    },
  ];

  return (
    <>
      <DashboardBreadcrumb dashboardType="admin" showBackButton={false} />
      <div className="container-custom py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link
              key={index}
              to={stat.link}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-4 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                to={action.link}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <Icon className={`w-8 h-8 ${action.color}`} />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                    <p className="text-gray-600 text-sm">{action.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <p className="text-gray-600">No recent activity to display</p>
      </div>
      </div>
    </>
  );
};

export default AdminDashboard;
