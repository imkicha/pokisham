import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiImage, FiCalendar, FiTag, FiToggleLeft, FiToggleRight, FiGift } from 'react-icons/fi';
import DashboardBreadcrumb from '../../components/common/DashboardBreadcrumb';

const festivalTypes = [
  { value: 'diwali', label: 'Diwali', emoji: '🪔' },
  { value: 'pongal', label: 'Pongal', emoji: '🌾' },
  { value: 'navratri', label: 'Navratri', emoji: '🙏' },
  { value: 'christmas', label: 'Christmas', emoji: '🎄' },
  { value: 'newyear', label: 'New Year', emoji: '🎉' },
  { value: 'onam', label: 'Onam', emoji: '🌺' },
  { value: 'ugadi', label: 'Ugadi', emoji: '🌸' },
  { value: 'holi', label: 'Holi', emoji: '🎨' },
  { value: 'eid', label: 'Eid', emoji: '🌙' },
  { value: 'sale', label: 'Sale', emoji: '🏷️' },
  { value: 'general', label: 'General', emoji: '📢' },
  { value: 'other', label: 'Other', emoji: '✨' },
];

const displayLocations = [
  { value: 'homepage_banner', label: 'Homepage Banner' },
  { value: 'homepage_card', label: 'Homepage Card' },
  { value: 'products_page', label: 'Products Page' },
  { value: 'checkout', label: 'Checkout Page' },
];

const OfferManagement = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discountType: 'none',
    discountValue: 0,
    couponCode: '',
    link: '/products',
    buttonText: 'Shop Now',
    backgroundColor: '#f97316',
    textColor: '#ffffff',
    festivalType: 'general',
    startDate: '',
    endDate: '',
    priority: 0,
    displayLocation: ['homepage_banner'],
    isActive: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    document.title = 'Offer Management - Pokisham Admin';
    fetchOffers();
  }, [filter]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      let url = '/offers/admin/all';
      if (filter !== 'all') {
        url += `?status=${filter}`;
      }
      const { data } = await API.get(url);
      if (data.success) {
        setOffers(data.offers);
      }
    } catch (error) {
      toast.error('Failed to fetch offers');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (offer = null) => {
    if (offer) {
      setEditingOffer(offer);
      setFormData({
        title: offer.title,
        description: offer.description || '',
        discountType: offer.discountType || 'none',
        discountValue: offer.discountValue || 0,
        couponCode: offer.couponCode || '',
        link: offer.link || '/products',
        buttonText: offer.buttonText || 'Shop Now',
        backgroundColor: offer.backgroundColor || '#f97316',
        textColor: offer.textColor || '#ffffff',
        festivalType: offer.festivalType || 'general',
        startDate: offer.startDate ? new Date(offer.startDate).toISOString().split('T')[0] : '',
        endDate: offer.endDate ? new Date(offer.endDate).toISOString().split('T')[0] : '',
        priority: offer.priority || 0,
        displayLocation: offer.displayLocation || ['homepage_banner'],
        isActive: offer.isActive,
      });
      setImagePreview(offer.image || '');
    } else {
      setEditingOffer(null);
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setFormData({
        title: '',
        description: '',
        discountType: 'none',
        discountValue: 0,
        couponCode: '',
        link: '/products',
        buttonText: 'Shop Now',
        backgroundColor: '#f97316',
        textColor: '#ffffff',
        festivalType: 'general',
        startDate: today,
        endDate: nextWeek,
        priority: 0,
        displayLocation: ['homepage_banner'],
        isActive: true,
      });
      setImagePreview('');
    }
    setImageFile(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingOffer(null);
    setImageFile(null);
    setImagePreview('');
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

  const handleLocationChange = (location) => {
    const currentLocations = formData.displayLocation;
    if (currentLocations.includes(location)) {
      setFormData({
        ...formData,
        displayLocation: currentLocations.filter(loc => loc !== location),
      });
    } else {
      setFormData({
        ...formData,
        displayLocation: [...currentLocations, location],
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Offer title is required');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error('Start and end dates are required');
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error('End date must be after start date');
      return;
    }

    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'displayLocation') {
          formDataToSend.append(key, formData[key].join(','));
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      if (editingOffer) {
        const { data } = await API.put(`/offers/${editingOffer._id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (data.success) {
          toast.success('Offer updated successfully');
          fetchOffers();
          handleCloseModal();
        }
      } else {
        const { data } = await API.post('/offers', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (data.success) {
          toast.success('Offer created successfully');
          fetchOffers();
          handleCloseModal();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save offer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (offerId) => {
    try {
      const { data } = await API.delete(`/offers/${offerId}`);
      if (data.success) {
        toast.success('Offer deleted successfully');
        fetchOffers();
        setDeleteConfirm(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete offer');
    }
  };

  const handleToggleStatus = async (offerId) => {
    try {
      const { data } = await API.put(`/offers/${offerId}/toggle`);
      if (data.success) {
        toast.success(data.message);
        fetchOffers();
      }
    } catch (error) {
      toast.error('Failed to toggle offer status');
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

  const getFestivalEmoji = (type) => {
    const festival = festivalTypes.find(f => f.value === type);
    return festival ? festival.emoji : '✨';
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
        items={[{ label: 'Offers' }]}
      />
      <div className="container-custom py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 flex items-center gap-3">
              <FiGift className="text-primary-600" />
              Offer Management
            </h1>
            <p className="text-gray-600 mt-1">Create and manage promotional offers for festivals and sales</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus /> Create Offer
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'active', 'inactive', 'upcoming', 'expired'].map((status) => (
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

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-md">
              <FiTag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No offers found</p>
              <p className="text-gray-500 mb-4">Create your first promotional offer</p>
              <button
                onClick={() => handleOpenModal()}
                className="btn-primary inline-flex items-center gap-2"
              >
                <FiPlus /> Create Offer
              </button>
            </div>
          ) : (
            offers.map((offer) => {
              const status = getOfferStatus(offer);
              return (
                <div
                  key={offer._id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Offer Image/Preview */}
                  <div
                    className="relative"
                    style={{ backgroundColor: offer.backgroundColor }}
                  >
                    {offer.image ? (
                      <img
                        src={offer.image}
                        alt={offer.title}
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                      />
                    ) : (
                      <div className="h-32 flex items-center justify-center text-center px-4" style={{ color: offer.textColor }}>
                        <div>
                          <span className="text-3xl">{getFestivalEmoji(offer.festivalType)}</span>
                          <p className="font-bold text-lg mt-1">{offer.title}</p>
                        </div>
                      </div>
                    )}
                    <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg text-gray-900">{offer.title}</h3>
                      <span className="text-2xl">{getFestivalEmoji(offer.festivalType)}</span>
                    </div>

                    {offer.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{offer.description}</p>
                    )}

                    {/* Discount Info */}
                    {offer.discountType !== 'none' && (
                      <div className="flex items-center gap-2 mb-2">
                        <FiTag className="text-primary-600" />
                        <span className="text-primary-600 font-medium">
                          {offer.discountType === 'percentage'
                            ? `${offer.discountValue}% OFF`
                            : `₹${offer.discountValue} OFF`}
                        </span>
                        {offer.couponCode && (
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-sm font-mono">
                            {offer.couponCode}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Dates */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <FiCalendar className="w-4 h-4" />
                      <span>
                        {new Date(offer.startDate).toLocaleDateString()} - {new Date(offer.endDate).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <button
                        onClick={() => handleToggleStatus(offer._id)}
                        className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md transition-colors ${
                          offer.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        title={offer.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {offer.isActive ? <FiToggleRight className="w-4 h-4" /> : <FiToggleLeft className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleOpenModal(offer)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(offer._id)}
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
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8">
              <div className="p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingOffer ? 'Edit Offer' : 'Create Offer'}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Banner Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Banner Image (Optional)
                    </label>
                    {/* Image Size Guide */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-blue-800 font-medium mb-1">Banner Image Size:</p>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li>• <strong>Exact Size:</strong> 1920 x 1000 px (recommended)</li>
                        <li>• <strong>Aspect Ratio:</strong> 1.92:1</li>
                        <li>• <strong>Format:</strong> JPG or PNG, max 5MB</li>
                        <li>• Image displays at full width without cropping</li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      {/* Full Image Preview */}
                      {imagePreview ? (
                        <div className="w-full rounded-lg overflow-hidden border-2 border-gray-300 bg-white">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                          />
                        </div>
                      ) : (
                        <div
                          className="w-full h-32 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300"
                          style={{ backgroundColor: formData.backgroundColor }}
                        >
                          <div className="text-center" style={{ color: formData.textColor }}>
                            <FiImage className="w-10 h-10 mx-auto mb-2" />
                            <span className="text-sm">No image selected</span>
                          </div>
                        </div>
                      )}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          id="offer-image"
                        />
                        <label
                          htmlFor="offer-image"
                          className="btn-outline cursor-pointer inline-flex items-center gap-2"
                        >
                          <FiImage className="w-4 h-4" />
                          {imagePreview ? 'Change Image' : 'Choose Banner Image'}
                        </label>
                      </div>
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
                        placeholder="e.g., Diwali Special Sale"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Festival Type
                      </label>
                      <select
                        value={formData.festivalType}
                        onChange={(e) => setFormData({ ...formData, festivalType: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        {festivalTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.emoji} {type.label}
                          </option>
                        ))}
                      </select>
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
                      placeholder="Enter offer description"
                    />
                  </div>

                  {/* Discount Settings */}
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
                        <option value="none">No Discount</option>
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (₹)</option>
                      </select>
                    </div>
                    {formData.discountType !== 'none' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Discount Value
                          </label>
                          <input
                            type="number"
                            value={formData.discountValue}
                            onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Coupon Code
                          </label>
                          <input
                            type="text"
                            value={formData.couponCode}
                            onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                            placeholder="DIWALI2024"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Link & Button */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Link URL
                      </label>
                      <input
                        type="text"
                        value={formData.link}
                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="/products?category=gifts"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Button Text
                      </label>
                      <input
                        type="text"
                        value={formData.buttonText}
                        onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Shop Now"
                      />
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Background Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.backgroundColor}
                          onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                          className="w-12 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.backgroundColor}
                          onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Text Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.textColor}
                          onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                          className="w-12 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.textColor}
                          onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>

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
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">Higher = shows first</p>
                    </div>
                  </div>

                  {/* Display Locations */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Locations
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {displayLocations.map((loc) => (
                        <button
                          key={loc.value}
                          type="button"
                          onClick={() => handleLocationChange(loc.value)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            formData.displayLocation.includes(loc.value)
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {loc.label}
                        </button>
                      ))}
                    </div>
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
                      {submitting ? 'Saving...' : editingOffer ? 'Update Offer' : 'Create Offer'}
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
              <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Offer</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this offer? This action cannot be undone.
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

export default OfferManagement;
