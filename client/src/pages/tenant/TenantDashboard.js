import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { FiPackage, FiShoppingBag, FiDollarSign, FiTrendingUp, FiClock, FiTag } from 'react-icons/fi';
import DashboardBreadcrumb from '../../components/common/DashboardBreadcrumb';

const TenantDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Tenant Dashboard - Pokisham';
    if (user?.tenantId) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch tenant stats
      const { data: statsData } = await API.get(`/tenants/${user.tenantId}/stats`);
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // Fetch recent orders for this tenant (already filtered by backend)
      const { data: ordersData } = await API.get(`/orders/my-orders`);
      if (ordersData.success) {
        // Get the 5 most recent (backend already filters by tenantId)
        const recentOrders = ordersData.orders
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        setRecentOrders(recentOrders);
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Processing':
        return 'bg-blue-100 text-blue-800';
      case 'Out for Delivery':
        return 'bg-purple-100 text-purple-800';
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Unable to load dashboard data</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardBreadcrumb
        dashboardType="tenant"
        showBackButton={false}
      />
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Seller Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage your products, orders, and track your performance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Total Products */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Products</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.productCount}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FiPackage className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
                <p className="text-xs sm:text-sm text-green-600 mt-1">
                  {stats.completedOrders} completed
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <FiShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Orders</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.pendingOrders}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Awaiting processing
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <FiClock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Net Revenue */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Net Revenue</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  ₹{stats.netRevenue?.toLocaleString('en-IN') || 0}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  After {stats.commissionRate}% commission
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FiDollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Revenue Breakdown</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Total Revenue</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">
                ₹{stats.totalRevenue?.toLocaleString('en-IN') || 0}
              </p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Platform Commission ({stats.commissionRate}%)</p>
              <p className="text-xl sm:text-2xl font-bold text-orange-600">
                ₹{stats.commissionAmount?.toLocaleString('en-IN') || 0}
              </p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Your Earnings</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">
                ₹{stats.netRevenue?.toLocaleString('en-IN') || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Recent Orders</h2>
              <Link
                to="/tenant/orders"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View All →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{order.totalPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <Link
                          to={`/tenant/orders/${order._id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Link
              to="/tenant/products"
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 sm:p-6 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              <FiPackage className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
              <h3 className="font-semibold text-sm sm:text-base">Manage Products</h3>
              <p className="text-xs sm:text-sm opacity-90 mt-1">Add or edit your products</p>
            </Link>

            <Link
              to="/tenant/orders"
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 sm:p-6 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
            >
              <FiShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
              <h3 className="font-semibold text-sm sm:text-base">View Orders</h3>
              <p className="text-xs sm:text-sm opacity-90 mt-1">Manage and process orders</p>
            </Link>

            <Link
              to="/tenant/orders?status=pending"
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-4 sm:p-6 rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-md hover:shadow-lg"
            >
              <FiClock className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
              <h3 className="font-semibold text-sm sm:text-base">Pending Orders</h3>
              <p className="text-xs sm:text-sm opacity-90 mt-1">{stats.pendingOrders} awaiting action</p>
            </Link>

            <Link
              to="/tenant/offers"
              className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-4 sm:p-6 rounded-lg hover:from-red-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
            >
              <FiTag className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
              <h3 className="font-semibold text-sm sm:text-base">My Offers</h3>
              <p className="text-xs sm:text-sm opacity-90 mt-1">Create discount coupons</p>
            </Link>

            <Link
              to="/tenant/profile"
              className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 sm:p-6 rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
            >
              <FiTrendingUp className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
              <h3 className="font-semibold text-sm sm:text-base">Business Profile</h3>
              <p className="text-xs sm:text-sm opacity-90 mt-1">Update your information</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default TenantDashboard;
