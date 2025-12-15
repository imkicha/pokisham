import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { FiPackage, FiDollarSign, FiTrendingUp, FiShoppingBag } from 'react-icons/fi';
import DashboardBreadcrumb from '../../components/common/DashboardBreadcrumb';

const SuperAdminProductCommissions = () => {
  const [products, setProducts] = useState([]);
  const [overallStats, setOverallStats] = useState({
    totalProducts: 0,
    totalRevenue: 0,
    totalCommission: 0,
    totalUnitsSold: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('revenue'); // revenue, commission, sold

  useEffect(() => {
    document.title = 'Product Commissions - Super Admin - Pokisham';
    fetchProductCommissions();
  }, []);

  const fetchProductCommissions = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/products/admin/commission-stats');
      if (data.success) {
        setProducts(data.products);
        setOverallStats(data.overallStats);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to load product commission data';
      toast.error(errorMessage);
      console.error('Fetch error:', error);
      console.error('Error response:', error.response);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'revenue':
        return b.totalRevenue - a.totalRevenue;
      case 'commission':
        return b.totalCommission - a.totalCommission;
      case 'sold':
        return b.totalSold - a.totalSold;
      default:
        return 0;
    }
  });

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
        items={[{ label: 'Product Commissions' }]}
      />
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Product Commission Analytics
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Track commission earnings by product from delivered orders
          </p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Products Sold</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {overallStats.totalProducts}
                </p>
                <p className="text-xs text-gray-500 mt-1">Unique products</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FiPackage className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Units Sold</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {overallStats.totalUnitsSold}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total quantity</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <FiShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  ₹{overallStats.totalRevenue.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-gray-500 mt-1">From products</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FiDollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Commission Earned</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  ₹{overallStats.totalCommission.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {overallStats.totalRevenue > 0
                    ? `${((overallStats.totalCommission / overallStats.totalRevenue) * 100).toFixed(1)}% average`
                    : 'No revenue'}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <FiTrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="revenue">Sort by Revenue</option>
                <option value="commission">Sort by Commission</option>
                <option value="sold">Sort by Units Sold</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Units Sold
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Orders
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Tenants
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedProducts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      {searchTerm ? 'No products found matching your search' : 'No product sales data available'}
                    </td>
                  </tr>
                ) : (
                  sortedProducts.map((product) => {
                    const commissionRate = product.totalRevenue > 0
                      ? ((product.totalCommission / product.totalRevenue) * 100).toFixed(1)
                      : 0;

                    return (
                      <tr key={product.productId} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.productImage || 'https://via.placeholder.com/50'}
                              alt={product.productName}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div>
                              <p className="font-medium text-gray-900 text-sm">
                                {product.productName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900 hidden sm:table-cell">
                          {product.totalSold}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500 hidden md:table-cell">
                          {product.orderCount}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-green-600">
                          ₹{product.totalRevenue.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="text-sm font-medium text-orange-600">
                              ₹{product.totalCommission.toLocaleString('en-IN')}
                            </p>
                            <p className="text-xs text-gray-500">{commissionRate}%</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {product.tenants.length > 0 ? (
                              product.tenants.map((tenant, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                                >
                                  {tenant}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-500">Platform</span>
                            )}
                          </div>
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
          <h3 className="font-semibold text-blue-900 mb-2">About Product Commissions</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Commission is calculated only from delivered orders</li>
            <li>• Revenue shown is the total sales value for each product</li>
            <li>• Commission rate may vary by tenant</li>
            <li>• Products sold by multiple tenants show all tenant names</li>
            <li>• Data updates in real-time as orders are delivered</li>
          </ul>
        </div>
      </div>
      </div>
    </>
  );
};

export default SuperAdminProductCommissions;
