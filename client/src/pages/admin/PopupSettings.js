import React, { useState, useEffect } from 'react';
import { FiUpload, FiTrash2, FiToggleLeft, FiToggleRight, FiImage, FiLink, FiType } from 'react-icons/fi';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import DashboardBreadcrumb from '../../components/common/DashboardBreadcrumb';

const PopupSettings = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newPoster, setNewPoster] = useState({ title: '', link: '/offers', file: null });
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await API.get('/popup/config');
      if (data.success) setConfig(data.config);
    } catch (error) {
      toast.error('Failed to load popup settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    try {
      const { data } = await API.put('/popup/toggle');
      if (data.success) {
        setConfig((prev) => ({ ...prev, isActive: data.isActive }));
        toast.success(data.isActive ? 'Popup enabled' : 'Popup disabled');
      }
    } catch (error) {
      toast.error('Failed to toggle popup');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPoster((prev) => ({ ...prev, file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!newPoster.file) {
      toast.error('Please select an image');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', newPoster.file);
      formData.append('title', newPoster.title);
      formData.append('link', newPoster.link);

      const { data } = await API.post('/popup/poster', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success) {
        setConfig(data.config);
        setNewPoster({ title: '', link: '/offers', file: null });
        setPreview(null);
        toast.success('Poster uploaded');
      }
    } catch (error) {
      toast.error('Failed to upload poster');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (posterId) => {
    if (!window.confirm('Delete this poster?')) return;
    try {
      const { data } = await API.delete(`/popup/poster/${posterId}`);
      if (data.success) {
        setConfig(data.config);
        toast.success('Poster deleted');
      }
    } catch (error) {
      toast.error('Failed to delete poster');
    }
  };

  if (loading) {
    return (
      <>
        <DashboardBreadcrumb dashboardType="admin" items={[{ label: 'Popup Settings' }]} />
        <div className="container-custom py-12 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardBreadcrumb dashboardType="admin" items={[{ label: 'Popup Settings' }]} />
      <div className="container-custom py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">Popup Poster</h1>
            <p className="text-gray-600 mt-1">Upload poster images that show as a popup on the homepage</p>
          </div>
          <button
            onClick={handleToggle}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
              config?.isActive
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {config?.isActive ? (
              <><FiToggleRight className="w-5 h-5" /> Active</>
            ) : (
              <><FiToggleLeft className="w-5 h-5" /> Inactive</>
            )}
          </button>
        </div>

        {/* Upload New Poster */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Upload New Poster</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Poster Image *</label>
              <div className="flex items-start gap-4">
                <label className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  {preview ? (
                    <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                  ) : (
                    <div>
                      <FiUpload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Click to upload poster image</p>
                      <p className="text-xs text-gray-400 mt-1">Recommended: 600x800px or similar portrait size</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Title & Link */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FiType className="inline w-4 h-4 mr-1" /> Title (optional)
                </label>
                <input
                  type="text"
                  value={newPoster.title}
                  onChange={(e) => setNewPoster((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Diwali Sale"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FiLink className="inline w-4 h-4 mr-1" /> Link on click
                </label>
                <input
                  type="text"
                  value={newPoster.link}
                  onChange={(e) => setNewPoster((prev) => ({ ...prev, link: e.target.value }))}
                  placeholder="/offers or /products"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading || !newPoster.file}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload Poster'}
            </button>
          </form>
        </div>

        {/* Current Posters */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Current Posters ({config?.posters?.length || 0})
          </h2>

          {config?.posters?.length === 0 ? (
            <div className="text-center py-10">
              <FiImage className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No posters uploaded yet</p>
              <p className="text-sm text-gray-400">Upload a poster image above to show in the homepage popup</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {config.posters
                .sort((a, b) => a.order - b.order)
                .map((poster) => (
                  <div key={poster._id} className="border border-gray-200 rounded-lg overflow-hidden group">
                    <div className="relative">
                      <img src={poster.image} alt={poster.title || 'Poster'} className="w-full h-48 object-cover" />
                      <button
                        onClick={() => handleDelete(poster._id)}
                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-800 truncate">{poster.title || 'No title'}</p>
                      <p className="text-xs text-gray-500 truncate">{poster.link}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PopupSettings;
