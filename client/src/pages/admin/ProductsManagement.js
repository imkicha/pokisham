import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiEdit, FiTrash2, FiPlus, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import DashboardBreadcrumb from '../../components/common/DashboardBreadcrumb';

const ProductsManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Products Management - Pokisham Admin';
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Include inactive products for admin view
      const { data } = await API.get('/products?includeInactive=true&limit=1000');
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const { data } = await API.delete(`/products/${id}`);
      if (data.success) {
        toast.success('Product deleted successfully');
        fetchProducts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const { data } = await API.put(`/products/${id}/toggle-status`);
      if (data.success) {
        toast.success(data.message);
        fetchProducts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to toggle product status');
    }
  };

  if (loading) {
    return (
      <div className="container-custom py-12">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardBreadcrumb
        dashboardType="admin"
        items={[{ label: 'Products' }]}
      />
      <div className="container-custom py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-display font-bold text-gray-900">Products Management</h1>
          <Link to="/admin/products/add" className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
            <FiPlus /> Add New Product
          </Link>
        </div>

        {/* Desktop Table View - Hidden on mobile */}
        <div className="hidden md:block bg-white rounded-lg shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[300px]">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[120px]">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[100px]">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[120px]">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[100px]">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[120px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No products found. Add your first product!
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img
                            className="h-12 w-12 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                            src={product.images[0]?.url || 'https://via.placeholder.com/48'}
                            alt={product.name}
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]" title={product.name}>
                              {product.name}
                            </div>
                            <div className="text-xs text-gray-500">{product.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">
                          {product.category?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">₹{product.price}</div>
                        {product.discountPrice > 0 && (
                          <div className="text-xs text-gray-400 line-through">₹{product.discountPrice}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {product.hasVariants ? (
                          <div className="text-sm text-gray-700">
                            {product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0)} units
                            <span className="text-xs text-gray-500 block">(variants)</span>
                          </div>
                        ) : (
                          <span className={`text-sm font-medium ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-orange-500' : 'text-red-600'}`}>
                            {product.stock} units
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(product._id)}
                          className={`px-3 py-1 inline-flex items-center gap-1 text-xs font-semibold rounded-full cursor-pointer transition-colors ${
                            product.isActive
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                          title={product.isActive ? 'Click to deactivate' : 'Click to activate'}
                        >
                          {product.isActive ? (
                            <FiToggleRight className="w-4 h-4" />
                          ) : (
                            <FiToggleLeft className="w-4 h-4" />
                          )}
                          {product.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <Link
                            to={`/admin/products/edit/${product._id}`}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <FiEdit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Product"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View - Visible only on mobile */}
        <div className="md:hidden space-y-4">
          {products.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
              No products found. Add your first product!
            </div>
          ) : (
            products.map((product) => (
              <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Product Header */}
                <div className="p-4 flex items-start gap-3">
                  <img
                    className="h-16 w-16 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                    src={product.images[0]?.url || 'https://via.placeholder.com/64'}
                    alt={product.name}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{product.sku}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        {product.category?.name || 'N/A'}
                      </span>
                      <button
                        onClick={() => handleToggleStatus(product._id)}
                        className={`px-2 py-0.5 text-xs font-semibold rounded-full flex items-center gap-1 ${
                          product.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {product.isActive ? (
                          <FiToggleRight className="w-3 h-3" />
                        ) : (
                          <FiToggleLeft className="w-3 h-3" />
                        )}
                        {product.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Product Details */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      {/* Price */}
                      <div>
                        <p className="text-xs text-gray-500">Price</p>
                        <p className="text-sm font-bold text-gray-900">₹{product.price}</p>
                        {product.discountPrice > 0 && (
                          <p className="text-xs text-gray-400 line-through">₹{product.discountPrice}</p>
                        )}
                      </div>
                      {/* Stock */}
                      <div>
                        <p className="text-xs text-gray-500">Stock</p>
                        {product.hasVariants ? (
                          <p className="text-sm font-medium text-gray-700">
                            {product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0)} units
                          </p>
                        ) : (
                          <p className={`text-sm font-medium ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-orange-500' : 'text-red-600'}`}>
                            {product.stock} units
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/admin/products/edit/${product._id}`}
                        className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <FiEdit className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Product Count */}
        <div className="mt-4 text-sm text-gray-500 text-center sm:text-left">
          Showing {products.length} product{products.length !== 1 ? 's' : ''}
        </div>
      </div>
    </>
  );
};

export default ProductsManagement;
