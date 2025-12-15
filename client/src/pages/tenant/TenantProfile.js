import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { FiEdit2, FiSave, FiX, FiUser, FiMail, FiPhone, FiMapPin, FiCreditCard, FiFileText } from 'react-icons/fi';
import DashboardBreadcrumb from '../../components/common/DashboardBreadcrumb';

const TenantProfile = () => {
  const { user } = useAuth();
  const [tenantData, setTenantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    document.title = 'Business Profile - Tenant Dashboard - Pokisham';
    if (user?.tenantId) {
      fetchTenantProfile();
    }
  }, [user]);

  const fetchTenantProfile = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/tenants/${user.tenantId}`);

      if (data.success) {
        setTenantData(data.tenant);
        setFormData({
          businessName: data.tenant.businessName || '',
          ownerName: data.tenant.ownerName || '',
          phone: data.tenant.phone || '',
          address: {
            street: data.tenant.address?.street || '',
            city: data.tenant.address?.city || '',
            state: data.tenant.address?.state || '',
            postalCode: data.tenant.address?.postalCode || '',
            country: data.tenant.address?.country || 'India',
          },
          gstNumber: data.tenant.gstNumber || '',
          panNumber: data.tenant.panNumber || '',
          bankDetails: {
            accountHolderName: data.tenant.bankDetails?.accountHolderName || '',
            accountNumber: data.tenant.bankDetails?.accountNumber || '',
            ifscCode: data.tenant.bankDetails?.ifscCode || '',
            bankName: data.tenant.bankDetails?.bankName || '',
          },
        });
      }
    } catch (error) {
      toast.error('Failed to load profile');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    try {
      const { data } = await API.put(`/tenants/${user.tenantId}`, formData);

      if (data.success) {
        toast.success('Profile updated successfully');
        setTenantData(data.tenant);
        setEditing(false);
        fetchTenantProfile();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setEditing(false);
    // Reset form data to original
    if (tenantData) {
      setFormData({
        businessName: tenantData.businessName || '',
        ownerName: tenantData.ownerName || '',
        phone: tenantData.phone || '',
        address: {
          street: tenantData.address?.street || '',
          city: tenantData.address?.city || '',
          state: tenantData.address?.state || '',
          postalCode: tenantData.address?.postalCode || '',
          country: tenantData.address?.country || 'India',
        },
        gstNumber: tenantData.gstNumber || '',
        panNumber: tenantData.panNumber || '',
        bankDetails: {
          accountHolderName: tenantData.bankDetails?.accountHolderName || '',
          accountNumber: tenantData.bankDetails?.accountNumber || '',
          ifscCode: tenantData.bankDetails?.ifscCode || '',
          bankName: tenantData.bankDetails?.bankName || '',
        },
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!tenantData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Unable to load profile data</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardBreadcrumb
        dashboardType="tenant"
        items={[{ label: 'Business Profile' }]}
      />
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  Business Profile
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Manage your business information and settings
              </p>
            </div>

            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 self-start sm:self-auto"
              >
                <FiEdit2 className="w-5 h-5" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2 self-start sm:self-auto">
                <button
                  onClick={handleSave}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <FiSave className="w-5 h-5" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <FiX className="w-5 h-5" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Card */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Account Status</h2>
                  <p className="text-sm text-gray-600">
                    Your seller account status and commission details
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <span className={`px-4 py-2 rounded-lg font-semibold ${
                      tenantData.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : tenantData.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {tenantData.status.charAt(0).toUpperCase() + tenantData.status.slice(1)}
                    </span>
                  </div>
                  <div className="bg-blue-50 px-4 py-2 rounded-lg">
                    <p className="text-xs text-gray-600">Commission Rate</p>
                    <p className="text-lg font-bold text-blue-600">{tenantData.commissionRate}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FiUser className="w-5 h-5" />
                Business Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{tenantData.businessName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Owner Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="ownerName"
                      value={formData.ownerName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{tenantData.ownerName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FiMail className="w-4 h-4" />
                    Email
                  </label>
                  <p className="text-gray-900">{tenantData.email}</p>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FiPhone className="w-4 h-4" />
                    Phone
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{tenantData.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FiMapPin className="w-5 h-5" />
                Business Address
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{tenantData.address?.street || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  {editing ? (
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{tenantData.address?.city || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  {editing ? (
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{tenantData.address?.state || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                  {editing ? (
                    <input
                      type="text"
                      name="address.postalCode"
                      value={formData.address.postalCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{tenantData.address?.postalCode || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <p className="text-gray-900">{tenantData.address?.country || 'India'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tax & Bank Details */}
          <div className="space-y-6">
            {/* Tax Information */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FiFileText className="w-5 h-5" />
                Tax Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GST Number
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="gstNumber"
                      value={formData.gstNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{tenantData.gstNumber || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PAN Number
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="panNumber"
                      value={formData.panNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{tenantData.panNumber || 'N/A'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FiCreditCard className="w-5 h-5" />
                Bank Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Holder Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="bankDetails.accountHolderName"
                      value={formData.bankDetails.accountHolderName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{tenantData.bankDetails?.accountHolderName || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="bankDetails.accountNumber"
                      value={formData.bankDetails.accountNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {tenantData.bankDetails?.accountNumber
                        ? `**** **** ${tenantData.bankDetails.accountNumber.slice(-4)}`
                        : 'N/A'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IFSC Code
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="bankDetails.ifscCode"
                      value={formData.bankDetails.ifscCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{tenantData.bankDetails?.ifscCode || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="bankDetails.bankName"
                      value={formData.bankDetails.bankName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{tenantData.bankDetails?.bankName || 'N/A'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

export default TenantProfile;
