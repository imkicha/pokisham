import React, { useState, useEffect } from 'react';
import { FiCreditCard, FiTruck, FiToggleLeft, FiToggleRight, FiPlus, FiX, FiMapPin, FiDollarSign } from 'react-icons/fi';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import DashboardBreadcrumb from '../../components/common/DashboardBreadcrumb';

const PaymentSettings = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCity, setNewCity] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await API.get('/payment-config');
      if (data.success) setConfig(data.config);
    } catch (error) {
      toast.error('Failed to load payment settings');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (updates) => {
    setSaving(true);
    try {
      const { data } = await API.put('/payment-config', updates);
      if (data.success) {
        setConfig(data.config);
        toast.success('Payment settings updated');
      }
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleOnline = () => {
    saveConfig({ onlinePaymentEnabled: !config.onlinePaymentEnabled });
  };

  const handleToggleCOD = () => {
    saveConfig({ codEnabled: !config.codEnabled });
  };

  const handleToggleCODAllCities = () => {
    saveConfig({ codAllCities: !config.codAllCities });
  };

  const handleAddCity = (e) => {
    e.preventDefault();
    if (!newCity.trim()) return;
    const cityLower = newCity.trim().toLowerCase();
    if (config.codCities.includes(cityLower)) {
      toast.error('City already added');
      return;
    }
    saveConfig({ codCities: [...config.codCities, cityLower] });
    setNewCity('');
  };

  const handleRemoveCity = (city) => {
    saveConfig({ codCities: config.codCities.filter((c) => c !== city) });
  };

  const handleOrderLimits = (e) => {
    e.preventDefault();
    saveConfig({
      codMinOrder: config.codMinOrder,
      codMaxOrder: config.codMaxOrder,
    });
  };

  if (loading) {
    return (
      <>
        <DashboardBreadcrumb dashboardType="admin" items={[{ label: 'Payment Settings' }]} />
        <div className="container-custom py-12 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardBreadcrumb dashboardType="admin" items={[{ label: 'Payment Settings' }]} />
      <div className="container-custom py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900">Payment Settings</h1>
          <p className="text-gray-600 mt-1">Manage payment methods and Cash on Delivery availability</p>
        </div>

        {/* Online Payment Toggle */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiCreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Online Payment (Razorpay)</h2>
                <p className="text-sm text-gray-500">UPI, Cards, Net Banking, Wallets</p>
              </div>
            </div>
            <button
              onClick={handleToggleOnline}
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                config?.onlinePaymentEnabled
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {config?.onlinePaymentEnabled ? (
                <><FiToggleRight className="w-5 h-5" /> Enabled</>
              ) : (
                <><FiToggleLeft className="w-5 h-5" /> Disabled</>
              )}
            </button>
          </div>
        </div>

        {/* COD Toggle */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <FiTruck className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Cash on Delivery</h2>
                <p className="text-sm text-gray-500">Pay when order is delivered</p>
              </div>
            </div>
            <button
              onClick={handleToggleCOD}
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                config?.codEnabled
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {config?.codEnabled ? (
                <><FiToggleRight className="w-5 h-5" /> Enabled</>
              ) : (
                <><FiToggleLeft className="w-5 h-5" /> Disabled</>
              )}
            </button>
          </div>

          {config?.codEnabled && (
            <div className="space-y-6 border-t border-gray-100 pt-6">
              {/* COD City Restriction */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FiMapPin className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-800">COD Available Cities</h3>
                  </div>
                  <button
                    onClick={handleToggleCODAllCities}
                    disabled={saving}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                      config?.codAllCities
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {config?.codAllCities ? 'All Cities Allowed' : 'Specific Cities Only'}
                  </button>
                </div>

                {!config?.codAllCities && (
                  <>
                    <form onSubmit={handleAddCity} className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        placeholder="Enter city name (e.g. Madurai)"
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      />
                      <button
                        type="submit"
                        disabled={saving || !newCity.trim()}
                        className="px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                      >
                        <FiPlus className="w-4 h-4" /> Add
                      </button>
                    </form>

                    {config?.codCities?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {config.codCities.map((city) => (
                          <span
                            key={city}
                            className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium capitalize"
                          >
                            <FiMapPin className="w-3.5 h-3.5" />
                            {city}
                            <button
                              onClick={() => handleRemoveCity(city)}
                              disabled={saving}
                              className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <FiX className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">No cities added. COD won't be available for any city.</p>
                    )}
                  </>
                )}
              </div>

              {/* COD Order Limits */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FiDollarSign className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-800">COD Order Limits</h3>
                </div>
                <form onSubmit={handleOrderLimits} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Minimum Order (0 = no limit)</label>
                    <input
                      type="number"
                      value={config.codMinOrder}
                      onChange={(e) => setConfig((prev) => ({ ...prev, codMinOrder: Number(e.target.value) }))}
                      min="0"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Maximum Order (0 = no limit)</label>
                    <input
                      type="number"
                      value={config.codMaxOrder}
                      onChange={(e) => setConfig((prev) => ({ ...prev, codMaxOrder: Number(e.target.value) }))}
                      min="0"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors text-sm"
                    >
                      {saving ? 'Saving...' : 'Save Limits'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-1">How it works</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• If Online Payment is disabled, customers can only use COD</li>
            <li>• If COD is disabled, customers can only pay online</li>
            <li>• When "Specific Cities Only" is selected, COD is only available for listed cities</li>
            <li>• City matching is case-insensitive (Madurai = madurai = MADURAI)</li>
            <li>• Order limits let you restrict COD for very small or large orders</li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default PaymentSettings;
