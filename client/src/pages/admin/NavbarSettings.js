import React, { useState, useEffect } from 'react';
import { FiSave, FiMenu, FiArrowUp, FiArrowDown, FiX, FiPlus } from 'react-icons/fi';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import DashboardBreadcrumb from '../../components/common/DashboardBreadcrumb';

const NavbarSettings = () => {
  const [allCategories, setAllCategories] = useState([]);
  const [navbarCategories, setNavbarCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = 'Navbar Settings - Admin - Pokisham';
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch all categories
      const { data: categoriesData } = await API.get('/categories');
      if (categoriesData.success) {
        setAllCategories(categoriesData.categories);

        // Get navbar categories
        try {
          const { data: navbarData } = await API.get('/categories/navbar');
          if (navbarData.success) {
            setNavbarCategories(navbarData.categories);
          }
        } catch (navError) {
          // Navbar endpoint might not exist yet, that's ok
          console.log('Navbar categories not set yet');
          setNavbarCategories([]);
        }
      }
    } catch (error) {
      toast.error('Failed to load categories');
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToNavbar = (category) => {
    if (navbarCategories.find(c => c._id === category._id)) {
      toast.error('Category already in navbar');
      return;
    }
    setNavbarCategories([...navbarCategories, category]);
  };

  const handleRemoveFromNavbar = (categoryId) => {
    setNavbarCategories(navbarCategories.filter(c => c._id !== categoryId));
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newList = [...navbarCategories];
    [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    setNavbarCategories(newList);
  };

  const handleMoveDown = (index) => {
    if (index === navbarCategories.length - 1) return;
    const newList = [...navbarCategories];
    [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    setNavbarCategories(newList);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const categoryIds = navbarCategories.map(c => c._id);
      const { data } = await API.put('/categories/navbar', { categoryIds });
      if (data.success) {
        toast.success('Navbar categories updated successfully!');
        setNavbarCategories(data.categories);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save navbar settings');
    } finally {
      setSaving(false);
    }
  };

  // Categories not in navbar
  const availableCategories = allCategories.filter(
    cat => !navbarCategories.find(nc => nc._id === cat._id)
  );

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
        items={[{ label: 'Navbar Settings' }]}
      />
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <FiMenu className="text-primary-600" />
              Navbar Settings
            </h1>
            <p className="text-gray-600">
              Manage which categories appear in the navigation bar and their order
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Navbar Categories */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiMenu className="text-primary-600" />
                Navbar Categories ({navbarCategories.length})
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Drag to reorder. These categories will appear in the navbar.
              </p>

              {navbarCategories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FiMenu className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No categories in navbar</p>
                  <p className="text-sm">Add categories from the list on the right</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {navbarCategories.map((category, index) => (
                    <div
                      key={category._id}
                      className="flex items-center gap-3 p-3 bg-primary-50 border border-primary-200 rounded-lg"
                    >
                      <span className="text-primary-600 font-medium w-6 text-center">
                        {index + 1}
                      </span>
                      <span className="flex-1 font-medium text-gray-900">
                        {category.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-white rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move up"
                        >
                          <FiArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === navbarCategories.length - 1}
                          className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-white rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move down"
                        >
                          <FiArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveFromNavbar(category._id)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Remove from navbar"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>

            {/* Available Categories */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Available Categories ({availableCategories.length})
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Click to add a category to the navbar
              </p>

              {availableCategories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>All categories are in the navbar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableCategories.map((category) => (
                    <button
                      key={category._id}
                      onClick={() => handleAddToNavbar(category)}
                      className="w-full flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-primary-50 hover:border-primary-300 transition-colors text-left"
                    >
                      <FiPlus className="w-5 h-5 text-gray-400" />
                      <span className="flex-1 font-medium text-gray-700">
                        {category.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="mt-8 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Navbar Preview
            </h2>
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center gap-6 flex-wrap">
                <span className="font-medium text-gray-700">Home</span>
                {navbarCategories.map((category) => (
                  <span key={category._id} className="font-medium text-gray-700 hover:text-primary-600 cursor-pointer">
                    {category.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NavbarSettings;
