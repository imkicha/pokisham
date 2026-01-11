import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiTag, FiX, FiImage, FiCalendar, FiPercent, FiDollarSign, FiToggleLeft, FiToggleRight, FiLayers } from 'react-icons/fi';
import DashboardBreadcrumb from '../../components/common/DashboardBreadcrumb';

const TenantOffers = () => {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const fileInputRef = useRef(null);

  const initialFormState = {
    title: '',
    description: '',
    couponCode: '',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    usageLimit: 0,
    perUserLimit: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    document.title = 'My Offers - Tenant Dashboard - Pokisham';
    if (user) {
      fetchOffers();
    }
  }, [user, statusFilter]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const { data } = await API.get(`/offers/tenant/my-offers${params}`);
      if (data.success) {
        setOffers(data.offers);
      }
    } catch (error) {
      console.error('Failed to fetch offers:', error);
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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

  const resetForm = () => {
    setFormData(initialFormState);
    setImageFile(null);
    setImagePreview(null);
    setEditingOffer(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (offer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description || '',
      couponCode: offer.couponCode || '',
      discountType: offer.discountType || 'percentage',
      discountValue: offer.discountValue || 0,
      minOrderAmount: offer.minOrderAmount || 0,
      maxDiscountAmount: offer.maxDiscountAmount || 0,
      usageLimit: offer.usageLimit || 0,
      perUserLimit: offer.perUserLimit || 1,
      startDate: offer.startDate ? new Date(offer.startDate).toISOString().split('T')[0] : '',
      endDate: offer.endDate ? new Date(offer.endDate).toISOString().split('T')[0] : '',
      isActive: offer.isActive,
    });
    setImagePreview(offer.image || null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Offer title is required');
      return;
    }

    if (!formData.couponCode.trim()) {
      toast.error('Coupon code is required');
      return;
    }

    if (formData.discountValue <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }

    try {
      setFormLoading(true);

      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });

      if (imageFile) {
        submitData.append('image', imageFile);
      }

      let response;
      if (editingOffer) {
        response = await API.put(`/offers/tenant/${editingOffer._id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await API.post('/offers/tenant', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (response.data.success) {
        toast.success(editingOffer ? 'Offer updated successfully!' : 'Offer created successfully!');
        setShowModal(false);
        resetForm();
        fetchOffers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save offer');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (offerId) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;

    try {
      const { data } = await API.delete(`/offers/tenant/${offerId}`);
      if (data.success) {
        toast.success('Offer deleted successfully');
        fetchOffers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete offer');
    }
  };

  const getOfferStatus = (offer) => {
    const now = new Date();
    const start = new Date(offer.startDate);
    const end = new Date(offer.endDate);

    if (!offer.isActive) return { label: 'Inactive', color: 'bg-gray-100 text-gray-700' };
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

  return (
    <>
      <DashboardBreadcrumb dashboardType="tenant" currentPage="My Offers" />
      <div className="container-custom py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">My Offers</h1>
            <p className="text-gray-600 mt-1">Create and manage discount coupons for your products</p>
          </div>
          <div className="flex gap-3 self-start sm:self-auto">
            <Link
              to="/tenant/combo-offers"
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium"
            >
              <FiLayers className="w-5 h-5" />
              Combo Offers
            </Link>
            <button
              onClick={openCreateModal}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus className="w-5 h-5" />
              Create Offer
            </button>
          </div>
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

        {/* Offers List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : offers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FiTag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Offers Found</h3>
            <p className="text-gray-500 mb-6">
              {statusFilter === 'all'
                ? 'Create your first offer to attract more customers!'
                : `No ${statusFilter} offers found.`}
            </p>
            {statusFilter === 'all' && (
              <button onClick={openCreateModal} className="btn-primary">
                Create Your First Offer
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {offers.map((offer) => {
              const status = getOfferStatus(offer);
              return (
                <div
                  key={offer._id}
                  className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Image */}
                    {offer.image && (
                      <div className="w-full sm:w-32 h-32 flex-shrink-0">
                        <img
                          src={offer.image}
                          alt={offer.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-grow">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{offer.title}</h3>
                          {offer.description && (
                            <p className="text-gray-600 text-sm mt-1">{offer.description}</p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm">
                        <div>
                          <p className="text-gray-500">Coupon Code</p>
                          <p className="font-mono font-semibold text-primary-600">{offer.couponCode}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Discount</p>
                          <p className="font-semibold">
                            {offer.discountType === 'percentage'
                              ? `${offer.discountValue}%`
                              : `₹${offer.discountValue}`}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Valid</p>
                          <p className="font-medium text-xs">
                            {formatDate(offer.startDate)} - {formatDate(offer.endDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Usage</p>
                          <p className="font-medium">
                            {offer.usageCount} / {offer.usageLimit || '∞'}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => openEditModal(offer)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <FiEdit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(offer._id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
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
                  {editingOffer ? 'Edit Offer' : 'Create New Offer'}
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
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Offer Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g., Diwali Special 20% Off"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Brief description of the offer"
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Coupon Code *
                    </label>
                    <input
                      type="text"
                      name="couponCode"
                      value={formData.couponCode}
                      onChange={handleInputChange}
                      placeholder="e.g., DIWALI20"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Customers will enter this code at checkout</p>
                  </div>
                </div>

                {/* Discount Settings */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <FiPercent className="w-4 h-4" />
                    Discount Settings
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discount Type
                      </label>
                      <select
                        name="discountType"
                        value={formData.discountType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                        value={formData.discountValue}
                        onChange={handleInputChange}
                        min="1"
                        max={formData.discountType === 'percentage' ? 100 : 10000}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Order Amount (₹)
                      </label>
                      <input
                        type="number"
                        name="minOrderAmount"
                        value={formData.minOrderAmount}
                        onChange={handleInputChange}
                        min="0"
                        placeholder="0 = No minimum"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Discount (₹)
                      </label>
                      <input
                        type="number"
                        name="maxDiscountAmount"
                        value={formData.maxDiscountAmount}
                        onChange={handleInputChange}
                        min="0"
                        placeholder="0 = No limit"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">For % discounts only</p>
                    </div>
                  </div>
                </div>

                {/* Usage Limits */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <FiTag className="w-4 h-4" />
                    Usage Limits
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Usage Limit
                      </label>
                      <input
                        type="number"
                        name="usageLimit"
                        value={formData.usageLimit}
                        onChange={handleInputChange}
                        min="0"
                        placeholder="0 = Unlimited"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Per User Limit
                      </label>
                      <input
                        type="number"
                        name="perUserLimit"
                        value={formData.perUserLimit}
                        onChange={handleInputChange}
                        min="0"
                        placeholder="0 = Unlimited"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Validity Period */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <FiCalendar className="w-4 h-4" />
                    Validity Period
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
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
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Offer Image (Optional)
                  </label>
                  <div className="flex items-center gap-4">
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                      <FiImage className="w-5 h-5" />
                      {imagePreview ? 'Change Image' : 'Upload Image'}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </label>
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
                    {formData.isActive ? 'Offer is Active' : 'Offer is Inactive'}
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
                      <>
                        {editingOffer ? 'Update Offer' : 'Create Offer'}
                      </>
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

export default TenantOffers;
