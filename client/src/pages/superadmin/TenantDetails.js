import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiCheck, FiX, FiPause, FiPlay, FiEdit2, FiSave, FiMail, FiPhone, FiMapPin, FiPercent, FiCalendar, FiPackage, FiShoppingBag, FiDollarSign } from 'react-icons/fi';
import DashboardBreadcrumb from '../../components/common/DashboardBreadcrumb';

const TenantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [commissionRate, setCommissionRate] = useState('');
  const [updatingCommission, setUpdatingCommission] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = 'Tenant Details - Pokisham';
    fetchTenantDetails();
  }, [id]);

  const fetchTenantDetails = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/tenants/${id}`);
      if (data.success) {
        setTenant(data.tenant);
        setCommissionRate(data.tenant.commissionRate?.toString() || '10');
        setEditForm({
          businessName: data.tenant.businessName || '',
          ownerName: data.tenant.ownerName || '',
          email: data.tenant.email || '',
          phone: data.tenant.phone || '',
          gstNumber: data.tenant.gstNumber || '',
          panNumber: data.tenant.panNumber || '',
          address: {
            street: data.tenant.address?.street || '',
            city: data.tenant.address?.city || '',
            state: data.tenant.address?.state || '',
            pincode: data.tenant.address?.pincode || '',
          },
          bankDetails: {
            bankName: data.tenant.bankDetails?.bankName || '',
            accountNumber: data.tenant.bankDetails?.accountNumber || '',
            ifscCode: data.tenant.bankDetails?.ifscCode || '',
          }
        });
        fetchTenantStats();
      }
    } catch (error) {
      toast.error('Failed to load tenant details');
      console.error('Fetch tenant error:', error);
      navigate('/superadmin/tenants');
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantStats = async () => {
    try {
      const { data } = await API.get(`/tenants/${id}/stats`);
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve this tenant?')) return;

    try {
      const { data } = await API.put(`/tenants/${id}/approve`);
      if (data.success) {
        toast.success('Tenant approved successfully');
        fetchTenantDetails();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve tenant');
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Are you sure you want to reject this tenant?')) return;

    try {
      const { data } = await API.put(`/tenants/${id}/reject`);
      if (data.success) {
        toast.success('Tenant rejected');
        fetchTenantDetails();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject tenant');
    }
  };

  const handleSuspend = async () => {
    if (!window.confirm('Are you sure you want to suspend this tenant? They will not be able to access their account.')) return;

    try {
      const { data } = await API.put(`/tenants/${id}/suspend`);
      if (data.success) {
        toast.success('Tenant suspended successfully');
        fetchTenantDetails();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to suspend tenant');
    }
  };

  const handleReactivate = async () => {
    if (!window.confirm('Are you sure you want to reactivate this tenant?')) return;

    try {
      const { data } = await API.put(`/tenants/${id}/reactivate`);
      if (data.success) {
        toast.success('Tenant reactivated successfully');
        fetchTenantDetails();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reactivate tenant');
    }
  };

  const handleUpdateCommission = async () => {
    const rate = parseFloat(commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Commission rate must be between 0 and 100');
      return;
    }

    setUpdatingCommission(true);
    try {
      const { data } = await API.put(`/tenants/${id}/commission`, { commissionRate: rate });
      if (data.success) {
        toast.success('Commission rate updated');
        setTenant({ ...tenant, commissionRate: rate });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update commission rate');
    } finally {
      setUpdatingCommission(false);
    }
  };

  const handleEditChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setEditForm({
        ...editForm,
        [parent]: {
          ...editForm[parent],
          [child]: value
        }
      });
    } else {
      setEditForm({ ...editForm, [field]: value });
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const { data } = await API.put(`/tenants/${id}`, editForm);
      if (data.success) {
        toast.success('Tenant details updated successfully');
        setTenant(data.tenant);
        setIsEditing(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update tenant details');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      businessName: tenant.businessName || '',
      ownerName: tenant.ownerName || '',
      email: tenant.email || '',
      phone: tenant.phone || '',
      gstNumber: tenant.gstNumber || '',
      panNumber: tenant.panNumber || '',
      address: {
        street: tenant.address?.street || '',
        city: tenant.address?.city || '',
        state: tenant.address?.state || '',
        pincode: tenant.address?.pincode || '',
      },
      bankDetails: {
        bankName: tenant.bankDetails?.bankName || '',
        accountNumber: tenant.bankDetails?.accountNumber || '',
        ifscCode: tenant.bankDetails?.ifscCode || '',
      }
    });
    setIsEditing(false);
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

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Tenant not found</p>
      </div>
    );
  }

  return (
    <>
      <DashboardBreadcrumb
        dashboardType="superadmin"
        items={[
          { label: 'Tenants', href: '/superadmin/tenants' },
          { label: tenant.businessName }
        ]}
      />
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/superadmin/tenants')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <FiArrowLeft className="w-5 h-5" />
            Back to Tenants
          </button>

          {/* Header Card */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {tenant.businessName}
                  </h1>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadge(tenant.status)}`}>
                    {tenant.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-600">Owner: {tenant.ownerName}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <FiEdit2 className="w-4 h-4" />
                    Edit
                  </button>
                )}
                {tenant.status === 'pending' && (
                  <>
                    <button
                      onClick={handleApprove}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <FiCheck className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={handleReject}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <FiX className="w-4 h-4" />
                      Reject
                    </button>
                  </>
                )}
                {tenant.status === 'approved' && (
                  <button
                    onClick={handleSuspend}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <FiPause className="w-4 h-4" />
                    Suspend
                  </button>
                )}
                {(tenant.status === 'suspended' || tenant.status === 'rejected') && (
                  <button
                    onClick={handleReactivate}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <FiPlay className="w-4 h-4" />
                    Reactivate
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <FiPackage className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.productCount}</p>
                    <p className="text-sm text-gray-600">Products</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <FiShoppingBag className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                    <p className="text-sm text-gray-600">Total Orders</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <FiDollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">₹{(stats.totalRevenue || 0).toLocaleString('en-IN')}</p>
                    <p className="text-sm text-gray-600">Revenue</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <FiPercent className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">₹{(stats.commissionAmount || 0).toLocaleString('en-IN')}</p>
                    <p className="text-sm text-gray-600">Commission</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Mode Save/Cancel Buttons */}
          {isEditing && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-yellow-800 font-medium">You are in edit mode. Make your changes and save.</p>
              <div className="flex gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <FiSave className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h2>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Business Name</label>
                    <input
                      type="text"
                      value={editForm.businessName}
                      onChange={(e) => handleEditChange('businessName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Owner Name</label>
                    <input
                      type="text"
                      value={editForm.ownerName}
                      onChange={(e) => handleEditChange('ownerName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => handleEditChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Phone</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => handleEditChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Street Address</label>
                    <input
                      type="text"
                      value={editForm.address.street}
                      onChange={(e) => handleEditChange('address.street', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">City</label>
                      <input
                        type="text"
                        value={editForm.address.city}
                        onChange={(e) => handleEditChange('address.city', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">State</label>
                      <input
                        type="text"
                        value={editForm.address.state}
                        onChange={(e) => handleEditChange('address.state', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={editForm.address.pincode}
                      onChange={(e) => handleEditChange('address.pincode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FiMail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-900">{tenant.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiPhone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-gray-900">{tenant.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FiMapPin className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="text-gray-900">
                        {tenant.address?.street && `${tenant.address.street}, `}
                        {tenant.address?.city && `${tenant.address.city}, `}
                        {tenant.address?.state && `${tenant.address.state} `}
                        {tenant.address?.pincode && `- ${tenant.address.pincode}`}
                        {!tenant.address?.street && !tenant.address?.city && 'Not provided'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiCalendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Joined</p>
                      <p className="text-gray-900">
                        {new Date(tenant.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Business Details */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Business Details</h2>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">GST Number</label>
                    <input
                      type="text"
                      value={editForm.gstNumber}
                      onChange={(e) => handleEditChange('gstNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">PAN Number</label>
                    <input
                      type="text"
                      value={editForm.panNumber}
                      onChange={(e) => handleEditChange('panNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={editForm.bankDetails.bankName}
                      onChange={(e) => handleEditChange('bankDetails.bankName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={editForm.bankDetails.accountNumber}
                      onChange={(e) => handleEditChange('bankDetails.accountNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={editForm.bankDetails.ifscCode}
                      onChange={(e) => handleEditChange('bankDetails.ifscCode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">GST Number</p>
                    <p className="text-gray-900 font-mono">{tenant.gstNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">PAN Number</p>
                    <p className="text-gray-900 font-mono">{tenant.panNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bank Name</p>
                    <p className="text-gray-900">{tenant.bankDetails?.bankName || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Account Number</p>
                    <p className="text-gray-900 font-mono">{tenant.bankDetails?.accountNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">IFSC Code</p>
                    <p className="text-gray-900 font-mono">{tenant.bankDetails?.ifscCode || 'Not provided'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Commission Settings */}
            <div className="bg-white rounded-xl shadow-md p-6 md:col-span-2">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Commission Settings</h2>
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                <div className="flex-1 w-full sm:w-auto">
                  <label className="block text-sm text-gray-500 mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    className="w-full sm:w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleUpdateCommission}
                  disabled={updatingCommission}
                  className="w-full sm:w-auto bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {updatingCommission ? 'Updating...' : 'Update Commission'}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Current commission rate: {tenant.commissionRate}% of each order value
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TenantDetails;
