import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { FiCheck, FiX, FiEye, FiPause, FiFilter, FiRefreshCw } from 'react-icons/fi';
import DashboardBreadcrumb from '../../components/common/DashboardBreadcrumb';

const TenantManagement = () => {
  const [tenants, setTenants] = useState([]);
  const [filteredTenants, setFilteredTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    document.title = 'Tenant Management - Pokisham';
    fetchTenants();
  }, []);

  useEffect(() => {
    filterTenants();
  }, [statusFilter, searchTerm, tenants]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/tenants');
      if (data.success) {
        setTenants(data.tenants);
        setFilteredTenants(data.tenants);
      }
    } catch (error) {
      toast.error('Failed to load tenants');
      console.error('Fetch tenants error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTenants = () => {
    let filtered = tenants;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTenants(filtered);
  };

  const handleApprove = async (tenantId) => {
    if (!window.confirm('Are you sure you want to approve this tenant?')) return;

    try {
      const { data } = await API.put(`/tenants/${tenantId}/approve`);
      if (data.success) {
        toast.success('Tenant approved successfully');
        fetchTenants();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve tenant');
    }
  };

  const handleReject = async (tenantId) => {
    if (!window.confirm('Are you sure you want to reject this tenant? This action cannot be undone.')) return;

    try {
      const { data } = await API.put(`/tenants/${tenantId}/reject`);
      if (data.success) {
        toast.success('Tenant rejected');
        fetchTenants();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject tenant');
    }
  };

  const handleSuspend = async (tenantId) => {
    if (!window.confirm('Are you sure you want to suspend this tenant? They will no longer be able to access their account.')) return;

    try {
      const { data } = await API.put(`/tenants/${tenantId}/suspend`);
      if (data.success) {
        toast.success('Tenant suspended');
        fetchTenants();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to suspend tenant');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-gray-100 text-gray-800';
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

  return (
    <>
      <DashboardBreadcrumb
        dashboardType="superadmin"
        items={[{ label: 'Tenants' }]}
      />
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Tenant Management
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Manage and monitor all sellers on the platform
              </p>
            </div>
            <button
              onClick={fetchTenants}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 self-start sm:self-auto"
            >
              <FiRefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by business name, owner, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <FiFilter className="w-5 h-5 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {tenants.length}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {tenants.filter(t => t.status === 'pending').length}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {tenants.filter(t => t.status === 'approved').length}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">Approved</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">
                {tenants.filter(t => t.status === 'suspended').length}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">Suspended</p>
            </div>
          </div>
        </div>

        {/* Tenants List */}
        <div className="space-y-4">
          {filteredTenants.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <p className="text-gray-600">No tenants found</p>
            </div>
          ) : (
            filteredTenants.map((tenant) => (
              <div
                key={tenant._id}
                className="bg-white rounded-xl shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Tenant Info */}
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                        {tenant.businessName}
                      </h3>
                      <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${getStatusBadge(tenant.status)} self-start`}>
                        {tenant.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Owner:</span> {tenant.ownerName}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {tenant.email}
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span> {tenant.phone}
                      </div>
                      <div>
                        <span className="font-medium">Commission:</span> {tenant.commissionRate}%
                      </div>
                      {tenant.gstNumber && (
                        <div>
                          <span className="font-medium">GST:</span> {tenant.gstNumber}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Joined:</span>{' '}
                        {new Date(tenant.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-4 mt-3 text-xs sm:text-sm">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-700">Orders:</span>
                        <span className="text-gray-600">{tenant.totalOrders || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-700">Revenue:</span>
                        <span className="text-gray-600">₹{(tenant.totalRevenue || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-700">Commission:</span>
                        <span className="text-gray-600">₹{(tenant.totalCommission || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 lg:flex-col lg:w-40">
                    <Link
                      to={`/superadmin/tenants/${tenant._id}`}
                      className="flex-1 lg:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <FiEye className="w-4 h-4" />
                      View Details
                    </Link>

                    {tenant.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(tenant._id)}
                          className="flex-1 lg:flex-none bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          <FiCheck className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(tenant._id)}
                          className="flex-1 lg:flex-none bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          <FiX className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    )}

                    {tenant.status === 'approved' && (
                      <button
                        onClick={() => handleSuspend(tenant._id)}
                        className="flex-1 lg:flex-none bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <FiPause className="w-4 h-4" />
                        Suspend
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      </div>
    </>
  );
};

export default TenantManagement;
