import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiImage, FiCalendar, FiPackage, FiToggleLeft, FiToggleRight, FiLayers, FiGrid, FiShoppingBag } from 'react-icons/fi';
import DashboardBreadcrumb from '../../components/common/DashboardBreadcrumb';

const comboTypes = [
  {
    value: 'fixed_products',
    label: 'Fixed Products Combo',
    icon: FiPackage,
    description: 'Specific products together at a fixed price (e.g., Frame A + Frame B = ₹1200)'
  },
  {
    value: 'category_combo',
    label: 'Category Combo',
    icon: FiGrid,
    description: 'Any N items from selected categories (e.g., Any 3 from Wall Frames = 20% off)'
  },
  {
    value: 'any_n_products',
    label: 'Any N Products',
    icon: FiShoppingBag,
    description: 'Buy any N products (e.g., Buy any 4 products = ₹500 off)'
  },
];

const ComboOfferManagement = () => {
  const [combos, setCombos] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    comboType: 'fixed_products',
    comboProducts: [],
    comboPrice: 0,
    applicableCategories: [],
    minItemsFromCategory: 2,
    minProducts: 2,
    discountType: 'percentage',
    discountValue: 0,
    maxDiscountAmount: 0,
    allowAdminOffersOnTop: false,
    priority: 0,
    startDate: '',
    endDate: '',
    usageLimit: 0,
    perUserLimit: 0,
    badge: 'COMBO',
    isActive: true,
  });
  const [pricingMode, setPricingMode] = useState('fixed_discount'); // 'fixed_discount' or 'fixed_price'
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filter, setFilter] = useState('all');
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    document.title = 'Combo Offers - Pokisham Admin';
    fetchCombos();
    fetchProducts();
    fetchCategories();
  }, [filter]);

  const fetchCombos = async () => {
    try {
      setLoading(true);
      let url = '/combo-offers/admin/all';
      if (filter !== 'all') {
        url += `?status=${filter}`;
      }
      const { data } = await API.get(url);
      if (data.success) {
        setCombos(data.comboOffers);
      }
    } catch (error) {
      toast.error('Failed to fetch combo offers');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await API.get('/products?limit=1000');
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await API.get('/categories');
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleOpenModal = (combo = null) => {
    if (combo) {
      setEditingCombo(combo);
      setFormData({
        title: combo.title,
        description: combo.description || '',
        comboType: combo.comboType,
        comboProducts: combo.comboProducts?.map(cp => ({
          product: cp.product?._id || cp.product,
          quantity: cp.quantity || 1,
          variant: cp.variant || { size: '' },
        })) || [],
        comboPrice: combo.comboPrice || 0,
        applicableCategories: combo.applicableCategories?.map(c => c._id || c) || [],
        minItemsFromCategory: combo.minItemsFromCategory || 2,
        minProducts: combo.minProducts || 2,
        discountType: combo.discountType || 'percentage',
        discountValue: combo.discountValue || 0,
        maxDiscountAmount: combo.maxDiscountAmount || 0,
        allowAdminOffersOnTop: combo.allowAdminOffersOnTop || false,
        priority: combo.priority || 0,
        startDate: combo.startDate ? new Date(combo.startDate).toISOString().split('T')[0] : '',
        endDate: combo.endDate ? new Date(combo.endDate).toISOString().split('T')[0] : '',
        usageLimit: combo.usageLimit || 0,
        perUserLimit: combo.perUserLimit || 0,
        badge: combo.badge || 'COMBO',
        isActive: combo.isActive,
      });
      setImagePreview(combo.image || '');
      // Set pricing mode based on existing data
      setPricingMode(combo.comboPrice > 0 && !combo.discountValue ? 'fixed_price' : 'fixed_discount');
    } else {
      setEditingCombo(null);
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setFormData({
        title: '',
        description: '',
        comboType: 'fixed_products',
        comboProducts: [],
        comboPrice: 0,
        applicableCategories: [],
        minItemsFromCategory: 2,
        minProducts: 2,
        discountType: 'percentage',
        discountValue: 0,
        maxDiscountAmount: 0,
        allowAdminOffersOnTop: false,
        priority: 0,
        startDate: today,
        endDate: nextMonth,
        usageLimit: 0,
        perUserLimit: 0,
        badge: 'COMBO',
        isActive: true,
      });
      setImagePreview('');
      setPricingMode('fixed_discount');
    }
    setImageFile(null);
    setProductSearch('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCombo(null);
    setImageFile(null);
    setImagePreview('');
    setProductSearch('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = (productId) => {
    if (formData.comboProducts.find(p => p.product === productId)) {
      toast.error('Product already added');
      return;
    }
    const product = products.find(p => p._id === productId);
    const defaultVariant = { size: '' };
    setFormData({
      ...formData,
      comboProducts: [...formData.comboProducts, { product: productId, quantity: 1, variant: defaultVariant }],
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

  const handleProductVariantChange = (productId, size) => {
    setFormData({
      ...formData,
      comboProducts: formData.comboProducts.map(p =>
        p.product === productId ? { ...p, variant: { size } } : p
      ),
    });
  };

  const handleCategoryChange = (categoryId) => {
    const currentCategories = formData.applicableCategories;
    if (currentCategories.includes(categoryId)) {
      setFormData({
        ...formData,
        applicableCategories: currentCategories.filter(c => c !== categoryId),
      });
    } else {
      setFormData({
        ...formData,
        applicableCategories: [...currentCategories, categoryId],
      });
    }
  };

  const getProductPrice = (product, variantInfo) => {
    if (product.hasVariants && variantInfo?.size && product.variants?.length > 0) {
      const variant = product.variants.find(v => v.size === variantInfo.size);
      if (variant) return variant.price;
    }
    return product.discountPrice || product.price;
  };

  const calculateOriginalPrice = () => {
    return formData.comboProducts.reduce((total, cp) => {
      const product = products.find(p => p._id === cp.product);
      if (product) {
        return total + (getProductPrice(product, cp.variant) * cp.quantity);
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

    if (!formData.startDate || !formData.endDate) {
      toast.error('Start and end dates are required');
      return;
    }

    if (formData.comboType === 'fixed_products' && formData.comboProducts.length < 2) {
      toast.error('Please add at least 2 products for fixed combo');
      return;
    }

    if (formData.comboType === 'fixed_products') {
      if (pricingMode === 'fixed_discount' && formData.discountValue <= 0) {
        toast.error('Please enter a discount amount greater than 0');
        return;
      }
      if (pricingMode === 'fixed_price' && formData.comboPrice <= 0) {
        toast.error('Please enter a combo price greater than 0');
        return;
      }
    }

    if (formData.comboType === 'category_combo' && formData.applicableCategories.length === 0) {
      toast.error('Please select at least one category');
      return;
    }

    setSubmitting(true);
    try {
      const formDataToSend = new FormData();

      // Add basic fields
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('comboType', formData.comboType);
      formDataToSend.append('comboPrice', formData.comboPrice);
      formDataToSend.append('minItemsFromCategory', formData.minItemsFromCategory);
      formDataToSend.append('minProducts', formData.minProducts);
      formDataToSend.append('discountType', formData.discountType);
      formDataToSend.append('discountValue', formData.discountValue);
      formDataToSend.append('maxDiscountAmount', formData.maxDiscountAmount);
      formDataToSend.append('allowAdminOffersOnTop', formData.allowAdminOffersOnTop);
      formDataToSend.append('priority', formData.priority);
      formDataToSend.append('startDate', formData.startDate);
      formDataToSend.append('endDate', formData.endDate);
      formDataToSend.append('usageLimit', formData.usageLimit);
      formDataToSend.append('perUserLimit', formData.perUserLimit);
      formDataToSend.append('badge', formData.badge);
      formDataToSend.append('isActive', formData.isActive);

      // Add arrays as JSON
      formDataToSend.append('comboProducts', JSON.stringify(formData.comboProducts));
      formDataToSend.append('applicableCategories', formData.applicableCategories.join(','));

      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      if (editingCombo) {
        const { data } = await API.put(`/combo-offers/${editingCombo._id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (data.success) {
          toast.success('Combo offer updated successfully');
          fetchCombos();
          handleCloseModal();
        }
      } else {
        const { data } = await API.post('/combo-offers', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (data.success) {
          toast.success('Combo offer created successfully');
          fetchCombos();
          handleCloseModal();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save combo offer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (comboId) => {
    try {
      const { data } = await API.delete(`/combo-offers/${comboId}`);
      if (data.success) {
        toast.success('Combo offer deleted successfully');
        fetchCombos();
        setDeleteConfirm(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete combo offer');
    }
  };

  const handleToggleStatus = async (comboId) => {
    try {
      const { data } = await API.put(`/combo-offers/${comboId}/toggle`);
      if (data.success) {
        toast.success(data.message);
        fetchCombos();
      }
    } catch (error) {
      toast.error('Failed to toggle combo status');
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

  const getComboTypeIcon = (type) => {
    const comboType = comboTypes.find(ct => ct.value === type);
    return comboType ? comboType.icon : FiLayers;
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

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
        items={[{ label: 'Combo Offers' }]}
      />
      <div className="container-custom py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 flex items-center gap-3">
              <FiLayers className="text-primary-600" />
              Combo Offers
            </h1>
            <p className="text-gray-600 mt-1">Create bundle deals and combo discounts</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus /> Create Combo
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'active', 'inactive', 'expired'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                filter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Combos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {combos.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-md">
              <FiLayers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No combo offers found</p>
              <p className="text-gray-500 mb-4">Create your first combo deal</p>
              <button
                onClick={() => handleOpenModal()}
                className="btn-primary inline-flex items-center gap-2"
              >
                <FiPlus /> Create Combo
              </button>
            </div>
          ) : (
            combos.map((combo) => {
              const status = getComboStatus(combo);
              const Icon = getComboTypeIcon(combo.comboType);
              return (
                <div
                  key={combo._id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Combo Header */}
                  <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-4">
                    {combo.image ? (
                      <img
                        src={combo.image}
                        alt={combo.title}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="h-32 flex items-center justify-center text-white">
                        <div className="text-center">
                          <Icon className="w-12 h-12 mx-auto mb-2" />
                          <span className="text-xl font-bold">{combo.badge}</span>
                        </div>
                      </div>
                    )}
                    <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                    {combo.isGlobal && (
                      <span className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Global
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg text-gray-900">{combo.title}</h3>
                    </div>

                    {combo.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{combo.description}</p>
                    )}

                    {/* Combo Type Info */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Icon className="w-4 h-4" />
                        <span className="font-medium">
                          {comboTypes.find(ct => ct.value === combo.comboType)?.label}
                        </span>
                      </div>
                      {combo.comboType === 'fixed_products' && (
                        <p className="text-primary-600 font-bold">
                          {combo.discountValue > 0
                            ? `Save ₹${combo.discountValue.toLocaleString('en-IN')} per set`
                            : combo.comboPrice > 0
                            ? `Bundle at ₹${combo.comboPrice.toLocaleString('en-IN')}`
                            : 'No pricing set'}
                        </p>
                      )}
                      {combo.comboType === 'category_combo' && (
                        <p className="text-sm">
                          Min {combo.minItemsFromCategory} items → {combo.discountValue}
                          {combo.discountType === 'percentage' ? '%' : '₹'} OFF
                        </p>
                      )}
                      {combo.comboType === 'any_n_products' && (
                        <p className="text-sm">
                          Buy {combo.minProducts}+ → {combo.discountValue}
                          {combo.discountType === 'percentage' ? '%' : '₹'} OFF
                        </p>
                      )}
                    </div>

                    {/* Products Preview (for fixed combo) */}
                    {combo.comboType === 'fixed_products' && combo.comboProducts?.length > 0 && (
                      <div className="text-xs text-gray-500 mb-3">
                        {combo.comboProducts.slice(0, 3).map(cp => cp.product?.name).filter(Boolean).join(', ')}
                        {combo.comboProducts.length > 3 && ` +${combo.comboProducts.length - 3} more`}
                      </div>
                    )}

                    {/* Dates */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <FiCalendar className="w-4 h-4" />
                      <span>
                        {new Date(combo.startDate).toLocaleDateString()} - {new Date(combo.endDate).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <button
                        onClick={() => handleToggleStatus(combo._id)}
                        className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md transition-colors ${
                          combo.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        title={combo.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {combo.isActive ? <FiToggleRight className="w-4 h-4" /> : <FiToggleLeft className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleOpenModal(combo)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(combo._id)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-8">
              <div className="p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingCombo ? 'Edit Combo Offer' : 'Create Combo Offer'}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Combo Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Combo Type *
                    </label>
                    <div className="grid grid-cols-1 gap-3">
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
                              applicableCategories: [],
                            })}
                            className={`p-4 rounded-lg border-2 text-left transition-all ${
                              formData.comboType === type.value
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className={`w-6 h-6 ${formData.comboType === type.value ? 'text-primary-600' : 'text-gray-500'}`} />
                              <div>
                                <p className={`font-medium ${formData.comboType === type.value ? 'text-primary-700' : 'text-gray-900'}`}>
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

                  {/* Title & Description */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="e.g., Frame Bundle Deal"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Badge Text
                      </label>
                      <input
                        type="text"
                        value={formData.badge}
                        onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="COMBO"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Describe this combo offer"
                    />
                  </div>

                  {/* Fixed Products Selection */}
                  {formData.comboType === 'fixed_products' && (
                    <div className="bg-purple-50 rounded-lg p-4 space-y-4">
                      <h4 className="font-medium text-gray-900">Select Products for Combo</h4>

                      {/* Product Search */}
                      <div>
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Search products to add..."
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

                      {/* Selected Products */}
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
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm">{product.name}</p>
                                  <p className="text-xs text-gray-500">₹{getProductPrice(product, cp.variant)}</p>
                                  {product.hasVariants && product.variants?.length > 0 && (
                                    <select
                                      value={cp.variant?.size || ''}
                                      onChange={(e) => handleProductVariantChange(cp.product, e.target.value)}
                                      className="mt-1 w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                                    >
                                      <option value="">Any Variant</option>
                                      {product.variants.map(v => (
                                        <option key={v.size} value={v.size}>
                                          {v.size} — ₹{v.price}
                                        </option>
                                      ))}
                                    </select>
                                  )}
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

                      {/* Pricing Mode */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pricing Mode *
                        </label>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <button
                            type="button"
                            onClick={() => {
                              setPricingMode('fixed_discount');
                              setFormData({ ...formData, comboPrice: 0 });
                            }}
                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                              pricingMode === 'fixed_discount'
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <p className={`font-medium text-sm ${pricingMode === 'fixed_discount' ? 'text-green-700' : 'text-gray-700'}`}>
                              Fixed Discount
                            </p>
                            <p className="text-xs text-gray-500">e.g. Save ₹100</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPricingMode('fixed_price');
                              setFormData({ ...formData, discountValue: 0 });
                            }}
                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                              pricingMode === 'fixed_price'
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <p className={`font-medium text-sm ${pricingMode === 'fixed_price' ? 'text-purple-700' : 'text-gray-700'}`}>
                              Fixed Combo Price
                            </p>
                            <p className="text-xs text-gray-500">e.g. Hamper at ₹499</p>
                          </button>
                        </div>

                        {/* Fixed Discount Input */}
                        {pricingMode === 'fixed_discount' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Discount Amount (₹) *
                            </label>
                            <input
                              type="number"
                              value={formData.discountValue}
                              onChange={(e) => setFormData({ ...formData, discountValue: parseInt(e.target.value) || 0, comboPrice: 0 })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              min="0"
                              placeholder="e.g. 100"
                            />
                            {formData.discountValue > 0 && (
                              <div className="text-sm mt-1 space-y-0.5">
                                <p className="text-green-600 font-medium">
                                  Customers save: ₹{formData.discountValue.toLocaleString('en-IN')} (fixed)
                                </p>
                                {calculateOriginalPrice() > 0 && (
                                  <p className="text-gray-500">
                                    Effective Price: ₹{(calculateOriginalPrice() - formData.discountValue).toLocaleString('en-IN')}
                                    <span className="text-gray-400"> (varies with variant)</span>
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Fixed Combo Price Input */}
                        {pricingMode === 'fixed_price' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Combo Price (₹) *
                            </label>
                            <input
                              type="number"
                              value={formData.comboPrice}
                              onChange={(e) => setFormData({ ...formData, comboPrice: parseInt(e.target.value) || 0, discountValue: 0 })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              min="0"
                              placeholder="e.g. 499"
                            />
                            {formData.comboPrice > 0 && calculateOriginalPrice() > 0 && (
                              <div className="text-sm mt-1 space-y-0.5">
                                <p className="text-purple-600 font-medium">
                                  Bundle at ₹{formData.comboPrice.toLocaleString('en-IN')} (fixed price)
                                </p>
                                <p className="text-gray-500">
                                  Customers save: ₹{(calculateOriginalPrice() - formData.comboPrice).toLocaleString('en-IN')}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Category Selection */}
                  {formData.comboType === 'category_combo' && (
                    <div className="bg-blue-50 rounded-lg p-4 space-y-4">
                      <h4 className="font-medium text-gray-900">Category Combo Settings</h4>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Categories *
                        </label>
                        <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto bg-white">
                          <div className="grid grid-cols-2 gap-2">
                            {categories.map((category) => (
                              <label
                                key={category._id}
                                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                  formData.applicableCategories.includes(category._id)
                                    ? 'bg-primary-50 border border-primary-200'
                                    : 'hover:bg-gray-50 border border-transparent'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.applicableCategories.includes(category._id)}
                                  onChange={() => handleCategoryChange(category._id)}
                                  className="rounded text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-700">{category.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minimum Items Required
                        </label>
                        <input
                          type="number"
                          value={formData.minItemsFromCategory}
                          onChange={(e) => setFormData({ ...formData, minItemsFromCategory: parseInt(e.target.value) || 2 })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          min="2"
                        />
                      </div>
                    </div>
                  )}

                  {/* Any N Products Settings */}
                  {formData.comboType === 'any_n_products' && (
                    <div className="bg-green-50 rounded-lg p-4 space-y-4">
                      <h4 className="font-medium text-gray-900">Any N Products Settings</h4>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    </div>
                  )}

                  {/* Discount Settings (for category and any_n) */}
                  {(formData.comboType === 'category_combo' || formData.comboType === 'any_n_products') && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      {formData.discountType === 'percentage' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Discount (₹)
                          </label>
                          <input
                            type="number"
                            value={formData.maxDiscountAmount}
                            onChange={(e) => setFormData({ ...formData, maxDiscountAmount: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            min="0"
                            placeholder="0 = No limit"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <input
                        type="number"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Usage Limits */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Usage Limit
                      </label>
                      <input
                        type="number"
                        value={formData.usageLimit}
                        onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        min="0"
                        placeholder="0 = Unlimited"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Per User Limit
                      </label>
                      <input
                        type="number"
                        value={formData.perUserLimit}
                        onChange={(e) => setFormData({ ...formData, perUserLimit: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        min="0"
                        placeholder="0 = Unlimited"
                      />
                    </div>
                  </div>

                  {/* Admin Offer Stacking */}
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.allowAdminOffersOnTop}
                        onChange={(e) => setFormData({ ...formData, allowAdminOffersOnTop: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                    <span className="text-sm font-medium text-gray-700">Allow admin offers on top of this combo</span>
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Saving...' : editingCombo ? 'Update Combo' : 'Create Combo'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Combo Offer</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this combo offer? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ComboOfferManagement;
