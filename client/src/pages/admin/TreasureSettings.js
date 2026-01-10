import React, { useState, useEffect } from 'react';
import { FiSave, FiGift, FiImage, FiTag, FiClock, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import DashboardBreadcrumb from '../../components/common/DashboardBreadcrumb';

const TreasureSettings = () => {
  const [config, setConfig] = useState({
    isActive: true,
    couponCode: '',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 0,
    maxDiscount: null,
    treasureImage: '/treasure-offer.png',
    title: 'You Found a Treasure!',
    description: 'Use this special coupon code on your next purchase!',
    appearanceInterval: 180000,
    validFrom: '',
    validUntil: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = 'Treasure Settings - Admin - Pokisham';
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await API.get('/treasure-config/admin');
      if (data.success && data.config) {
        setConfig({
          ...data.config,
          validFrom: data.config.validFrom ? new Date(data.config.validFrom).toISOString().slice(0, 16) : '',
          validUntil: data.config.validUntil ? new Date(data.config.validUntil).toISOString().slice(0, 16) : ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch treasure config:', error);
      toast.error('Failed to load treasure settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleToggleActive = () => {
    setConfig(prev => ({ ...prev, isActive: !prev.isActive }));
  };

  const handleSave = async () => {
    if (!config.couponCode.trim()) {
      toast.error('Coupon code is required');
      return;
    }
    if (config.discountValue <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...config,
        validFrom: config.validFrom ? new Date(config.validFrom).toISOString() : null,
        validUntil: config.validUntil ? new Date(config.validUntil).toISOString() : null,
        maxDiscount: config.maxDiscount || null
      };

      const { data } = await API.put('/treasure-config/admin', payload);
      if (data.success) {
        toast.success('Treasure settings saved successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Convert milliseconds to minutes for display
  const intervalMinutes = Math.round(config.appearanceInterval / 60000);

  const handleIntervalChange = (minutes) => {
    setConfig(prev => ({
      ...prev,
      appearanceInterval: minutes * 60000
    }));
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
        dashboardType="admin"
        items={[{ label: 'Treasure Settings' }]}
      />
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <FiGift className="text-primary-600" />
              Treasure Box Settings
            </h1>
            <p className="text-gray-600">
              Configure the floating treasure box that appears to users with special coupon codes
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Main Settings */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiTag className="text-primary-600" />
                Coupon Settings
              </h2>

              {/* Active Toggle */}
              <div className="mb-6 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Treasure Active</p>
                  <p className="text-sm text-gray-500">Enable or disable the treasure box</p>
                </div>
                <button
                  onClick={handleToggleActive}
                  className={`p-2 rounded-lg transition-colors ${
                    config.isActive
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {config.isActive ? (
                    <FiToggleRight className="w-8 h-8" />
                  ) : (
                    <FiToggleLeft className="w-8 h-8" />
                  )}
                </button>
              </div>

              {/* Coupon Code */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  name="couponCode"
                  value={config.couponCode}
                  onChange={handleChange}
                  placeholder="e.g., TREASURE10"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 uppercase"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Type
                  </label>
                  <select
                    name="discountType"
                    value={config.discountType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    name="discountValue"
                    value={config.discountValue}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Min Order & Max Discount */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    name="minOrderValue"
                    value={config.minOrderValue}
                    onChange={handleChange}
                    min="0"
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Discount (₹)
                  </label>
                  <input
                    type="number"
                    name="maxDiscount"
                    value={config.maxDiscount || ''}
                    onChange={handleChange}
                    min="0"
                    placeholder="No limit"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Validity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid From
                  </label>
                  <input
                    type="datetime-local"
                    name="validFrom"
                    value={config.validFrom}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid Until
                  </label>
                  <input
                    type="datetime-local"
                    name="validUntil"
                    value={config.validUntil}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Display Settings */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiImage className="text-primary-600" />
                Display Settings
              </h2>

              {/* Title */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={config.title}
                  onChange={handleChange}
                  placeholder="You Found a Treasure!"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={config.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Use this special coupon code on your next purchase!"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Treasure Image */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Treasure Image URL
                </label>
                <input
                  type="text"
                  name="treasureImage"
                  value={config.treasureImage}
                  onChange={handleChange}
                  placeholder="/treasure-offer.png"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {config.treasureImage && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                    <img
                      src={config.treasureImage}
                      alt="Treasure preview"
                      className="max-h-32 mx-auto object-contain"
                      onError={(e) => {
                        e.target.src = '/treasure-offer.png';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Appearance Interval */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <FiClock className="w-4 h-4" />
                  Appearance Interval
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={intervalMinutes}
                    onChange={(e) => handleIntervalChange(Number(e.target.value))}
                    min="1"
                    max="60"
                    className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <span className="text-gray-600">minutes</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  How often the treasure box appears to users (min: 1 min)
                </p>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-6 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Preview
            </h2>
            <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-50 rounded-xl p-6 max-w-md mx-auto">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {config.title || 'You Found a Treasure!'}
                </h3>

                {config.treasureImage && (
                  <img
                    src={config.treasureImage}
                    alt="Preview"
                    className="w-full h-32 object-contain mb-4"
                    onError={(e) => {
                      e.target.src = '/treasure-offer.png';
                    }}
                  />
                )}

                <div className="mb-3">
                  <span className="inline-block bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-1 rounded-full text-lg font-bold">
                    {config.discountType === 'percentage'
                      ? `${config.discountValue}% OFF`
                      : `₹${config.discountValue} OFF`}
                  </span>
                </div>

                <div className="bg-white rounded-lg p-3 mb-3 border-2 border-dashed border-yellow-400">
                  <p className="text-xs text-gray-500 mb-1">Your Coupon Code</p>
                  <span className="text-xl font-mono font-bold text-primary-600">
                    {config.couponCode || 'TREASURE10'}
                  </span>
                  {config.minOrderValue > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Min. order: ₹{config.minOrderValue}
                    </p>
                  )}
                </div>

                <p className="text-sm text-gray-600">
                  {config.description || 'Use this special coupon code on your next purchase!'}
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors shadow-lg"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="w-5 h-5" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TreasureSettings;
