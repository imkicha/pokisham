import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiX, FiPackage, FiCalendar, FiShoppingBag, FiLayers, FiArrowLeft } from 'react-icons/fi';
import DashboardBreadcrumb from '../../components/common/DashboardBreadcrumb';

const comboTypes = [
  {
    value: 'fixed_products',
    label: 'Fixed Products Combo',
    icon: FiPackage,
    description: 'Specific products together at a fixed price'
  },
  {
    value: 'any_n_products',
    label: 'Any N Products',
    icon: FiShoppingBag,
    description: 'Buy any N of your products for a discount'
  },
];

const TenantComboOffers = () => {
  const { user } = useAuth();
  const [combos, setCombos] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [productSearch, setProductSearch] = useState('');

  const initialFormState = {
    title: '',
    description: '',
    comboType: 'fixed_products',
    comboProducts: [],
    comboPrice: 0,
    minProducts: 2,
    discountType: 'percentage',
    discountValue: 10,
    maxDiscountAmount: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimit: 0,
    perUserLimit: 0,
    badge: 'COMBO',
    isActive: true,
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    document.title = 'Combo Offers - Tenant Dashboard - Pokisham';
    if (user) {
      fetchCombos();
      fetchProducts();
    }
  }, [user, statusFilter]);

  const fetchCombos = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const { data } = await API.get(`/combo-offers/tenant/my-combos${params}`);
      if (data.success) {
        setCombos(data.comboOffers);
      }
    } catch (error) {
      console.error('Failed to fetch combos:', error);
      toast.error('Failed to load combo offers');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await API.get('/combo-offers/tenant/my-products');
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingCombo(null);
    setProductSearch('');
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (combo) => {
    setEditingCombo(combo);
    setFormData({
      title: combo.title,
      description: combo.description || '',
      comboType: combo.comboType,
      comboProducts: combo.comboProducts?.map(cp => ({
        product: cp.product?._id || cp.product,
        quantity: cp.quantity || 1,
      })) || [],
      comboPrice: combo.comboPrice || 0,
      minProducts: combo.minProducts || 2,
      discountType: combo.discountType || 'percentage',
      discountValue: combo.discountValue || 0,
      maxDiscountAmount: combo.maxDiscountAmount || 0,
      startDate: combo.startDate ? new Date(combo.startDate).toISOString().split('T')[0] : '',
      endDate: combo.endDate ? new Date(combo.endDate).toISOString().split('T')[0] : '',
      usageLimit: combo.usageLimit || 0,
      perUserLimit: combo.perUserLimit || 0,
      badge: combo.badge || 'COMBO',
      isActive: combo.isActive,
    });
    setShowModal(true);
  };

  const handleAddProduct = (productId) => {
    if (formData.comboProducts.find(p => p.product === productId)) {
      toast.error('Product already added');
      return;
    }
    setFormData({
      ...formData,
      comboProducts: [...formData.comboProducts, { product: productId, quantity: 1 }],
    });
    setProductSearch('');
  };

  const handleRemoveProduct = (productId) => {
    setFormData({
      ...formData,
      comboProducts: formData.comboProducts.filter(p => p.product !== productId),
    });
  };

  const handleProductQuantityChange = (productId, quantity) => {
    setFormData({
      ...formData,
      comboProducts: formData.comboProducts.map(p =>
        p.product === productId ? { ...p, quantity: parseInt(quantity) || 1 } : p
      ),
    });
  };

  const calculateOriginalPrice = () => {
    return formData.comboProducts.reduce((total, cp) => {
      const product = products.find(p => p._id === cp.product);
      if (product) {
        const price = product.discountPrice || product.price;
        return total + (price * cp.quantity);
      }
      return total;
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Combo title is required');
      return;
    }

    if (formData.comboType === 'fixed_products' && formData.comboProducts.length < 2) {
      toast.error('Please add at least 2 products for fixed combo');
      return;
    }

    try {
      setFormLoading(true);

      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('comboType', formData.comboType);
      submitData.append('comboProducts', JSON.stringify(formData.comboProducts));
      submitData.append('comboPrice', formData.comboPrice);
      submitData.append('minProducts', formData.minProducts);
      submitData.append('discountType', formData.discountType);
      submitData.append('discountValue', formData.discountValue);
      submitData.append('maxDiscountAmount', formData.maxDiscountAmount);
      submitData.append('startDate', formData.startDate);
      submitData.append('endDate', formData.endDate);
      submitData.append('usageLimit', formData.usageLimit);
      submitData.append('perUserLimit', formData.perUserLimit);
      submitData.append('badge', formData.badge);
      submitData.append('isActive', formData.isActive);

      let response;
      if (editingCombo) {
        response = await API.put(`/combo-offers/tenant/${editingCombo._id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await API.post('/combo-offers/tenant', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (response.data.success) {
        toast.success(editingCombo ? 'Combo updated successfully!' : 'Combo created successfully!');
        setShowModal(false);
        resetForm();
        fetchCombos();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save combo');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (comboId) => {
    if (!window.confirm('Are you sure you want to delete this combo offer?')) return;

    try {
      const { data } = await API.delete(`/combo-offers/tenant/${comboId}`);
      if (data.success) {
        toast.success('Combo deleted successfully');
        fetchCombos();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete combo');
    }
  };

  const getComboStatus = (combo) => {
    const now = new Date();
    const start = new Date(combo.startDate);
    const end = new Date(combo.endDate);

    if (!combo.isActive) return { label: 'Inactive', color: 'bg-gray-100 text-gray-700' };
    if (now < start) return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700' };
    if (now > end) return { label: 'Expired', color: 'bg-red-100 text-red-700' };
    return { label: 'Active', color: 'bg-green-100 text-green-700' };
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <>
      <DashboardBreadcrumb dashboardType="tenant" currentPage="Combo Offers" />
      <div className="container-custom py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link to="/tenant/offers" className="text-gray-500 hover:text-gray-700">
                <FiArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Combo Offers</h1>
            </div>
            <p className="text-gray-600">Create bundle deals for your products</p>
          </div>
          <button
            onClick={openCreateModal}
            className="btn-primary flex items-center gap-2 self-start sm:self-auto"
          >
            <FiPlus className="w-5 h-5" />
            Create Combo
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'active', 'inactive', 'expired'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Combos List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : combos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FiLayers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Combo Offers Found</h3>
            <p className="text-gray-500 mb-6">
              Create combo deals to increase your sales!
            </p>
            <button onClick={openCreateModal} className="btn-primary">
              Create Your First Combo
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {combos.map((combo) => {
              const status = getComboStatus(combo);
              const ComboIcon = comboTypes.find(ct => ct.value === combo.comboType)?.icon || FiLayers;
              return (
                <div
                  key={combo._id}
                  className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <ComboIcon className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{combo.title}</h3>
                        <p className="text-sm text-gray-500">
                          {comboTypes.find(ct => ct.value === combo.comboType)?.label}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  {combo.description && (
                    <p className="text-gray-600 text-sm mb-3">{combo.description}</p>
                  )}

                  {/* Combo Details */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    {combo.comboType === 'fixed_products' && (
                      <>
                        <p className="text-sm text-gray-600 mb-1">
                          {combo.comboProducts?.length} products in combo
                        </p>
                        <p className="text-lg font-bold text-primary-600">
                          Combo Price: ₹{combo.comboPrice?.toLocaleString('en-IN')}
                        </p>
                      </>
                    )}
                    {combo.comboType === 'any_n_products' && (
                      <p className="text-sm">
                        Buy {combo.minProducts}+ products → {combo.discountValue}
                        {combo.discountType === 'percentage' ? '%' : '₹'} OFF
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <FiCalendar className="w-4 h-4" />
                    <span>{formatDate(combo.startDate)} - {formatDate(combo.endDate)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => openEditModal(combo)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <FiEdit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(combo._id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingCombo ? 'Edit Combo' : 'Create Combo'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Combo Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Combo Type *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {comboTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            comboType: type.value,
                            comboProducts: [],
                          })}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            formData.comboType === type.value
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-5 h-5 ${formData.comboType === type.value ? 'text-primary-600' : 'text-gray-500'}`} />
                            <div>
                              <p className={`font-medium text-sm ${formData.comboType === type.value ? 'text-primary-700' : 'text-gray-900'}`}>
                                {type.label}
                              </p>
                              <p className="text-xs text-gray-500">{type.description}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title & Badge */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Combo Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Frame Bundle Deal"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Badge Text
                    </label>
                    <input
                      type="text"
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      placeholder="COMBO"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe this combo offer"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Fixed Products Selection */}
                {formData.comboType === 'fixed_products' && (
                  <div className="bg-purple-50 rounded-lg p-4 space-y-4">
                    <h4 className="font-medium text-gray-900">Select Products for Combo</h4>

                    <div>
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Search your products..."
                      />
                      {productSearch && (
                        <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                          {filteredProducts.slice(0, 10).map(product => (
                            <button
                              key={product._id}
                              type="button"
                              onClick={() => handleAddProduct(product._id)}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                            >
                              {product.images?.[0]?.url && (
                                <img src={product.images[0].url} alt="" className="w-10 h-10 object-cover rounded" />
                              )}
                              <div>
                                <p className="font-medium text-sm">{product.name}</p>
                                <p className="text-xs text-gray-500">₹{product.discountPrice || product.price}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {formData.comboProducts.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Selected Products:</p>
                        {formData.comboProducts.map(cp => {
                          const product = products.find(p => p._id === cp.product);
                          return product ? (
                            <div key={cp.product} className="flex items-center gap-3 bg-white p-2 rounded-lg">
                              {product.images?.[0]?.url && (
                                <img src={product.images[0].url} alt="" className="w-12 h-12 object-cover rounded" />
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-sm">{product.name}</p>
                                <p className="text-xs text-gray-500">₹{product.discountPrice || product.price}</p>
                              </div>
                              <input
                                type="number"
                                min="1"
                                value={cp.quantity}
                                onChange={(e) => handleProductQuantityChange(cp.product, e.target.value)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveProduct(cp.product)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <FiX className="w-5 h-5" />
                              </button>
                            </div>
                          ) : null;
                        })}
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-sm text-gray-600">Original Total:</span>
                          <span className="font-medium">₹{calculateOriginalPrice().toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Combo Price (₹) *
                      </label>
                      <input
                        type="number"
                        value={formData.comboPrice}
                        onChange={(e) => setFormData({ ...formData, comboPrice: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        min="0"
                      />
                      {formData.comboPrice > 0 && (
                        <p className="text-sm text-green-600 mt-1">
                          Customers save: ₹{(calculateOriginalPrice() - formData.comboPrice).toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Any N Products Settings */}
                {formData.comboType === 'any_n_products' && (
                  <div className="bg-green-50 rounded-lg p-4 space-y-4">
                    <h4 className="font-medium text-gray-900">Discount Settings</h4>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Products Required
                      </label>
                      <input
                        type="number"
                        value={formData.minProducts}
                        onChange={(e) => setFormData({ ...formData, minProducts: parseInt(e.target.value) || 2 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        min="2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Discount Type
                        </label>
                        <select
                          value={formData.discountType}
                          onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount (₹)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Discount Value
                        </label>
                        <input
                          type="number"
                          value={formData.discountValue}
                          onChange={(e) => setFormData({ ...formData, discountValue: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Validity Period */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      formData.isActive ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        formData.isActive ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-700">
                    {formData.isActive ? 'Combo is Active' : 'Combo is Inactive'}
                  </span>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    {formLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      editingCombo ? 'Update Combo' : 'Create Combo'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TenantComboOffers;
