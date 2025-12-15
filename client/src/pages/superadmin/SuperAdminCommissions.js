import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { FiDollarSign, FiTrendingUp, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import DashboardBreadcrumb from '../../components/common/DashboardBreadcrumb';

const SuperAdminCommissions = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCommission, setEditingCommission] = useState(null);
  const [newRate, setNewRate] = useState('');

  useEffect(() => {
    document.title = 'Commissions - Super Admin - Pokisham';
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/tenants');
      if (data.success) {
        setTenants(data.tenants.filter(t => t.status === 'approved'));
      }
    } catch (error) {
      toast.error('Failed to load tenants');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCommission = (tenant) => {
    setEditingCommission(tenant._id);
    setNewRate(tenant.commissionRate.toString());
  };

  const handleSaveCommission = async (tenantId) => {
    const rate = parseFloat(newRate);

    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Commission rate must be between 0 and 100');
      return;
    }

    try {
      const { data } = await API.put(`/tenants/${tenantId}/commission`, {
        commissionRate: rate
      });

      if (data.success) {
        toast.success('Commission rate updated');
        setEditingCommission(null);
        fetchTenants();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update commission');
    }
  };

  const handleCancelEdit = () => {
    setEditingCommission(null);
    setNewRate('');
  };

  const totalStats = tenants.reduce((acc, tenant) => ({
    totalRevenue: acc.totalRevenue + (tenant.totalRevenue || 0),
    totalCommission: acc.totalCommission + (tenant.totalCommission || 0),
    totalOrders: acc.totalOrders + (tenant.totalOrders || 0),
  }), { totalRevenue: 0, totalCommission: 0, totalOrders: 0 });

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
        items={[{ label: 'Commissions' }]}
      />
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Commission Management
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Track and manage commission rates for all tenants
              </p>
            </div>
            <Link
              to="/superadmin/product-commissions"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              <FiTrendingUp className="w-4 h-4" />
              Product Commissions
            </Link>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Platform Revenue</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  ₹{totalStats.totalRevenue.toLocaleString('en-IN')}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  From {totalStats.totalOrders} orders
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FiDollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Commission Earned</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  ₹{totalStats.totalCommission.toLocaleString('en-IN')}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  {totalStats.totalRevenue > 0
                    ? `${((totalStats.totalCommission / totalStats.totalRevenue) * 100).toFixed(1)}% average rate`
                    : 'No revenue yet'}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <FiTrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Net to Tenants</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  ₹{(totalStats.totalRevenue - totalStats.totalCommission).toLocaleString('en-IN')}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Across {tenants.length} tenants
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FiDollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tenants Commission Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 sm:p-6 border-b">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Tenant Commission Breakdown
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Total Revenue
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission Rate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission Earned
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Net to Tenant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tenants.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      No approved tenants found
                    </td>
                  </tr>
                ) : (
                  tenants.map((tenant) => {
                    const revenue = tenant.totalRevenue || 0;
                    const commission = tenant.totalCommission || 0;
                    const netRevenue = revenue - commission;
                    const isEditing = editingCommission === tenant._id;

                    return (
                      <tr key={tenant._id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{tenant.businessName}</p>
                            <p className="text-sm text-gray-500">{tenant.ownerName}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900 hidden md:table-cell">
                          ₹{revenue.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-4">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={newRate}
                                onChange={(e) => setNewRate(e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                min="0"
                                max="100"
                                step="0.1"
                              />
                              <span className="text-sm">%</span>
                            </div>
                          ) : (
                            <span className="text-sm font-medium text-gray-900">
                              {tenant.commissionRate}%
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-orange-600">
                          ₹{commission.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-green-600 hidden sm:table-cell">
                          ₹{netRevenue.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-4">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveCommission(tenant._id)}
                                className="text-green-600 hover:text-green-800"
                                title="Save"
                              >
                                <FiCheck className="w-5 h-5" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-red-600 hover:text-red-800"
                                title="Cancel"
                              >
                                <FiX className="w-5 h-5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditCommission(tenant)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit Commission Rate"
                            >
                              <FiEdit2 className="w-5 h-5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">About Commission Rates</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Commission rates can be customized per tenant</li>
            <li>• Changes apply to all future orders</li>
            <li>• Rate must be between 0% and 100%</li>
            <li>• Commission is calculated only on delivered orders</li>
            <li>• Net revenue = Total Revenue - Commission</li>
          </ul>
        </div>
      </div>
      </div>
    </>
  );
};

export default SuperAdminCommissions;
