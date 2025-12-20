import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiUser, FiMail, FiPhone, FiShield, FiEdit2, FiSave, FiX, FiCamera, FiPackage, FiHeart, FiMapPin } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import Breadcrumb from '../../components/common/Breadcrumb';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });

  useEffect(() => {
    document.title = 'My Profile - Pokisham';
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // For phone, only allow digits and limit to 10
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, phone: digitsOnly });

      // Validate phone number
      if (digitsOnly.length > 0 && digitsOnly.length !== 10) {
        setPhoneError('Phone number must be exactly 10 digits');
      } else {
        setPhoneError('');
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSave = async () => {
    // Validate phone before saving
    if (formData.phone && formData.phone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }

    setLoading(true);
    try {
      console.log('Sending profile update:', formData);
      const { data } = await API.put('/auth/profile', formData);
      console.log('Profile update response:', data);
      if (data.success) {
        updateUser(data.user);
        toast.success('Profile updated successfully');
        setEditing(false);
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      console.error('Error response:', error.response);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
    });
    setPhoneError('');
    setEditing(false);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const quickLinks = [
    { icon: FiPackage, label: 'My Orders', path: '/orders', color: 'bg-blue-100 text-blue-600' },
    { icon: FiHeart, label: 'Wishlist', path: '/wishlist', color: 'bg-pink-100 text-pink-600' },
    { icon: FiMapPin, label: 'Addresses', path: '/addresses', color: 'bg-green-100 text-green-600' },
  ];

  const breadcrumbs = [
    { label: 'My Profile' }
  ];

  return (
    <>
      <Breadcrumb items={breadcrumbs} />
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8">
        <div className="container-custom">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-2">My Profile</h1>
            <p className="text-gray-600">Manage your account information</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Profile Header with Gradient */}
                <div className="bg-gradient-to-r from-primary-500 to-secondary-500 h-24 relative">
                  <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg">
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white text-2xl font-bold">
                          {getInitials(user?.name)}
                        </div>
                      </div>
                      <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-primary-700 transition-colors">
                        <FiCamera className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="pt-16 pb-6 px-6 text-center">
                  <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                  <p className="text-gray-500 text-sm">{user?.email}</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full capitalize">
                    {user?.role}
                  </span>
                </div>

                {/* Quick Stats */}
                <div className="border-t border-gray-100 px-6 py-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                      <p className="text-xs text-gray-500">Orders</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                      <p className="text-xs text-gray-500">Wishlist</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                      <p className="text-xs text-gray-500">Reviews</p>
                    </div>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="border-t border-gray-100 p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3 px-2">Quick Links</p>
                  <div className="space-y-2">
                    {quickLinks.map((link, index) => (
                      <Link
                        key={index}
                        to={link.path}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-lg ${link.color} flex items-center justify-center`}>
                          <link.icon className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-gray-700">{link.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Profile Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
                    <p className="text-sm text-gray-500">Update your personal details</p>
                  </div>
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors font-medium"
                    >
                      <FiEdit2 className="w-4 h-4" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >
                        <FiX className="w-4 h-4" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
                      >
                        <FiSave className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <FiUser className="w-4 h-4 text-gray-400" />
                      Full Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="Enter your name"
                      />
                    ) : (
                      <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">{user?.name || 'Not set'}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <FiMail className="w-4 h-4 text-gray-400" />
                      Email Address
                    </label>
                    <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900 flex items-center justify-between">
                      {user?.email}
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Verified</span>
                    </p>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <FiPhone className="w-4 h-4 text-gray-400" />
                      Phone Number
                    </label>
                    {editing ? (
                      <div>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                            phoneError ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter 10 digit phone number"
                          maxLength={10}
                        />
                        {phoneError && (
                          <p className="text-red-500 text-sm mt-1">{phoneError}</p>
                        )}
                      </div>
                    ) : (
                      <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">{user?.phone || 'Not set'}</p>
                    )}
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <FiShield className="w-4 h-4 text-gray-400" />
                      Account Type
                    </label>
                    <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900 capitalize">{user?.role}</p>
                  </div>
                </div>
              </div>

              {/* Account Security */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Account Security</h3>
                  <p className="text-sm text-gray-500">Manage your password and security settings</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <FiShield className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Password</p>
                        <p className="text-sm text-gray-500">Last changed: Never</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 text-primary-600 font-medium hover:bg-primary-50 rounded-lg transition-colors">
                      Change
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <FiMail className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Email Verification</p>
                        <p className="text-sm text-gray-500">Your email is verified</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                      Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-red-100">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-red-600">Danger Zone</h3>
                  <p className="text-sm text-gray-500">Irreversible account actions</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">Delete Account</p>
                    <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
                  </div>
                  <button className="px-4 py-2 bg-red-100 text-red-600 font-medium rounded-lg hover:bg-red-200 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
