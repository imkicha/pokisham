import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { FiUsers, FiShoppingBag, FiDollarSign, FiTrendingUp, FiClock, FiCheck, FiX, FiMessageCircle } from 'react-icons/fi';
import DashboardBreadcrumb from '../../components/common/DashboardBreadcrumb';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({
    totalTenants: 0,
    pendingApprovals: 0,
    approvedTenants: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCommission: 0,
  });
  const [pendingTenants, setPendingTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Super Admin Dashboard - Pokisham';
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/tenants');

      if (data.success) {
        const tenants = data.tenants;
        const pending = tenants.filter(t => t.status === 'pending');
        const approved = tenants.filter(t => t.status === 'approved');

        const totalRevenue = tenants.reduce((sum, t) => sum + (t.totalRevenue || 0), 0);
        const totalCommission = tenants.reduce((sum, t) => sum + (t.totalCommission || 0), 0);
        const totalOrders = tenants.reduce((sum, t) => sum + (t.totalOrders || 0), 0);

        setStats({
          totalTenants: tenants.length,
          pendingApprovals: pending.length,
          approvedTenants: approved.length,
          totalOrders,
          totalRevenue,
          totalCommission,
        });

        setPendingTenants(pending.slice(0, 5)); // Show only first 5
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (tenantId) => {
    try {
      const { data } = await API.put(`/tenants/${tenantId}/approve`);
      if (data.success) {
        toast.success('Tenant approved successfully');
        fetchDashboardData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve tenant');
    }
  };

  const handleReject = async (tenantId) => {
    try {
      const { data } = await API.put(`/tenants/${tenantId}/reject`);
      if (data.success) {
        toast.success('Tenant rejected');
        fetchDashboardData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject tenant');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <>
      <DashboardBreadcrumb dashboardType="superadmin" showBackButton={false} />
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Super Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage tenants, monitor orders, and track commissions
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {/* Total Tenants */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Tenants</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalTenants}</p>
                <p className="text-xs sm:text-sm text-green-600 mt-1">
                  {stats.approvedTenants} approved
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FiUsers className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Approvals</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.pendingApprovals}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Awaiting review
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <FiClock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Across all tenants
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <FiShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  ₹{stats.totalRevenue.toLocaleString('en-IN')}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Platform wide
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FiDollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Total Commission */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500 sm:col-span-2 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Commission Earned</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  ₹{stats.totalCommission.toLocaleString('en-IN')}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  {stats.totalRevenue > 0
                    ? `${((stats.totalCommission / stats.totalRevenue) * 100).toFixed(1)}% of total revenue`
                    : 'No revenue yet'}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <FiTrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Pending Approvals Section */}
        {pendingTenants.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Pending Tenant Approvals</h2>
              <Link
                to="/superadmin/tenants"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View All →
              </Link>
            </div>

            <div className="space-y-4">
              {pendingTenants.map((tenant) => (
                <div
                  key={tenant._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-base sm:text-lg">
                        {tenant.businessName}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Owner: {tenant.ownerName}
                      </p>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs sm:text-sm text-gray-500">
                        <span>📧 {tenant.email}</span>
                        <span>📱 {tenant.phone}</span>
                      </div>
                      {tenant.gstNumber && (
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          GST: {tenant.gstNumber}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 sm:gap-3">
                      <button
                        onClick={() => handleApprove(tenant._id)}
                        className="flex-1 sm:flex-none bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <FiCheck className="w-4 h-4" />
                        <span className="hidden sm:inline">Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(tenant._id)}
                        className="flex-1 sm:flex-none bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <FiX className="w-4 h-4" />
                        <span className="hidden sm:inline">Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Link
              to="/superadmin/tenants"
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 sm:p-6 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              <FiUsers className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
              <h3 className="font-semibold text-sm sm:text-base">Manage Tenants</h3>
              <p className="text-xs sm:text-sm opacity-90 mt-1">View and manage all tenants</p>
            </Link>

            <Link
              to="/superadmin/orders"
              className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 sm:p-6 rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
            >
              <FiDollarSign className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
              <h3 className="font-semibold text-sm sm:text-base">All Orders</h3>
              <p className="text-xs sm:text-sm opacity-90 mt-1">View and route orders</p>
            </Link>

            <Link
              to="/superadmin/commissions"
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 sm:p-6 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg"
            >
              <FiTrendingUp className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
              <h3 className="font-semibold text-sm sm:text-base">Commissions</h3>
              <p className="text-xs sm:text-sm opacity-90 mt-1">Track and manage commissions</p>
            </Link>

            <Link
              to="/admin/messages"
              className="bg-gradient-to-r from-pink-500 to-pink-600 text-white p-4 sm:p-6 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
            >
              <FiMessageCircle className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
              <h3 className="font-semibold text-sm sm:text-base">Contact Messages</h3>
              <p className="text-xs sm:text-sm opacity-90 mt-1">View customer inquiries</p>
            </Link>
          </div>

          {/* Additional Quick Links */}
          <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Advanced Analytics</h3>
            <Link
              to="/superadmin/product-commissions"
              className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
            >
              <FiTrendingUp className="w-4 h-4" />
              View Product Commission Analytics →
            </Link>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default SuperAdminDashboard;
