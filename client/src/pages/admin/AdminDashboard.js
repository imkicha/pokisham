import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiPackage, FiShoppingBag, FiUsers, FiTrendingUp, FiMessageCircle, FiGrid, FiMenu, FiGift, FiBox, FiLayers, FiImage } from 'react-icons/fi';
import DashboardBreadcrumb from '../../components/common/DashboardBreadcrumb';
import API from '../../api/axios';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    document.title = 'Admin Dashboard - Pokisham';
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const { data } = await API.get('/orders/admin/stats');
      if (data.success) {
        setDashboardStats({
          totalProducts: data.stats.totalProducts || 0,
          totalOrders: data.stats.totalOrders || 0,
          totalUsers: data.stats.totalUsers || 0,
          totalRevenue: data.stats.totalRevenue || 0,
        });
        setRecentOrders(data.stats.recentOrders || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const stats = [
    {
      title: 'Total Products',
      value: loading ? '...' : dashboardStats.totalProducts.toString(),
      icon: FiPackage,
      color: 'bg-blue-500',
      link: '/admin/products',
    },
    {
      title: 'Total Orders',
      value: loading ? '...' : dashboardStats.totalOrders.toString(),
      icon: FiShoppingBag,
      color: 'bg-green-500',
      link: '/admin/orders',
    },
    {
      title: 'Total Users',
      value: loading ? '...' : dashboardStats.totalUsers.toString(),
      icon: FiUsers,
      color: 'bg-purple-500',
      link: '/admin/users',
    },
    {
      title: 'Revenue',
      value: loading ? '...' : formatCurrency(dashboardStats.totalRevenue),
      icon: FiTrendingUp,
      color: 'bg-yellow-500',
      link: '/admin/orders',
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
      title: 'Combo Offers',
      description: 'Create bundle deals and combo discounts',
      link: '/admin/combo-offers',
      icon: FiLayers,
      color: 'text-purple-600',
    },
    {
      title: 'Popup Poster',
      description: 'Upload poster images for homepage popup',
      link: '/admin/popup-settings',
      icon: FiImage,
      color: 'text-indigo-600',
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

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
          <Link to="/admin/orders" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : recentOrders.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No recent orders to display</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Order ID</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Customer</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Amount</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.slice(0, 5).map((order) => (
                  <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm font-medium text-gray-900">
                      #{order._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600">
                      {order.user?.name || 'N/A'}
                    </td>
                    <td className="py-3 px-2 text-sm font-medium text-gray-900">
                      {formatCurrency(order.totalPrice)}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700' :
                        order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        order.orderStatus === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default AdminDashboard;
