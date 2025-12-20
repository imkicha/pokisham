import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { FiEye, FiSend, FiFilter, FiSearch, FiX, FiDownload, FiMail, FiMessageCircle } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import DashboardBreadcrumb from '../../components/common/DashboardBreadcrumb';

const SuperAdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTenant, setFilterTenant] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [assignModal, setAssignModal] = useState({ show: false, orderId: null });
  const [selectedTenant, setSelectedTenant] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [sendingNotification, setSendingNotification] = useState(false);
  const [sharingInvoice, setSharingInvoice] = useState(false);

  useEffect(() => {
    document.title = 'Manage Orders - Super Admin - Pokisham';
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all orders
      const { data: ordersData } = await API.get('/orders');
      if (ordersData.success) {
        setOrders(ordersData.orders);
      }

      // Fetch all tenants
      const { data: tenantsData } = await API.get('/tenants');
      if (tenantsData.success) {
        setTenants(tenantsData.tenants);
      }
    } catch (error) {
      toast.error('Failed to load orders');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowAssignModal = (orderId) => {
    setAssignModal({ show: true, orderId });
    setSelectedTenant('');
  };

  const handleCloseAssignModal = () => {
    setAssignModal({ show: false, orderId: null });
    setSelectedTenant('');
  };

  const handleAssignToTenant = async () => {
    if (!selectedTenant) {
      toast.error('Please select a tenant');
      return;
    }

    if (selectedTenant === 'all') {
      // Assign to all approved tenants
      const approvedTenants = tenants.filter(t => t.status === 'approved');

      if (approvedTenants.length === 0) {
        toast.error('No approved tenants available');
        return;
      }

      if (!window.confirm(`This will notify all ${approvedTenants.length} approved tenants. Continue?`)) {
        return;
      }

      try {
        const promises = approvedTenants.map(tenant =>
          API.post(`/orders/${assignModal.orderId}/assign-tenant`, {
            tenantId: tenant._id,
            notifyOnly: true  // Special flag for broadcasting
          })
        );

        await Promise.all(promises);
        toast.success(`Order broadcasted to ${approvedTenants.length} tenants`);
        handleCloseAssignModal();
        fetchData();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to broadcast order');
      }
    } else {
      // Assign to single tenant
      try {
        const { data } = await API.post(`/orders/${assignModal.orderId}/assign-tenant`, {
          tenantId: selectedTenant
        });

        if (data.success) {
          toast.success(data.message || 'Order assigned successfully to tenant');
          handleCloseAssignModal();
          fetchData();
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to assign order');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Accepted':
        return 'bg-blue-100 text-blue-800';
      case 'Processing':
        return 'bg-indigo-100 text-indigo-800';
      case 'Packed':
        return 'bg-cyan-100 text-cyan-800';
      case 'Shipped':
        return 'bg-purple-100 text-purple-800';
      case 'Out for Delivery':
        return 'bg-violet-100 text-violet-800';
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTenantName = (tenantId) => {
    const tenant = tenants.find(t => t._id === tenantId);
    return tenant ? tenant.businessName : 'Platform';
  };

  // View order details
  const handleViewOrder = async (orderId) => {
    try {
      const { data } = await API.get(`/orders/${orderId}`);
      if (data.success) {
        setSelectedOrder(data.order);
        setTrackingNumber('');
      }
    } catch (error) {
      toast.error('Failed to load order details');
    }
  };

  // Update order status
  const handleStatusUpdate = async (orderId, status) => {
    try {
      const { data } = await API.put(`/orders/${orderId}/status`, { status });
      if (data.success) {
        toast.success('Order status updated successfully');
        setSelectedOrder(data.order);
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update order status');
    }
  };

  // Send notification
  const handleSendNotification = async (orderId, type) => {
    setSendingNotification(true);
    try {
      const { data } = await API.post(`/orders/${orderId}/notify`, {
        type,
        trackingNumber: trackingNumber || undefined,
      });

      if (data.success) {
        if (data.results.email?.success) {
          toast.success('Email sent successfully!');
        } else if (data.results.email?.error) {
          toast.error(`Email failed: ${data.results.email.error}`);
        }

        if (data.results.whatsapp?.success) {
          window.open(data.results.whatsapp.url, '_blank');
          toast.success('WhatsApp opened - send the message!');
        } else if (data.results.whatsapp?.error) {
          toast.error(`WhatsApp failed: ${data.results.whatsapp.error}`);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send notification');
    } finally {
      setSendingNotification(false);
    }
  };

  // Download invoice
  const handleDownloadInvoice = async (orderId, orderNumber) => {
    try {
      const response = await API.get(`/orders/${orderId}/invoice`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  // Share invoice via WhatsApp (uploads PDF to Cloudinary)
  const handleShareInvoice = async (orderId) => {
    setSharingInvoice(true);
    try {
      const { data } = await API.post(`/orders/${orderId}/share-invoice`);
      if (data.success) {
        window.open(data.whatsappUrl, '_blank');
        toast.success('WhatsApp opened with invoice link!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to share invoice');
    } finally {
      setSharingInvoice(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.orderStatus === filterStatus;
    const matchesTenant = filterTenant === 'all' ||
                         (filterTenant === 'multi' && order.isMultiTenant) ||
                         (filterTenant === 'platform' && !order.tenantId) ||
                         (order.tenantId && order.tenantId.toString() === filterTenant);

    const matchesSearch = order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesTenant && matchesSearch;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.orderStatus === 'Pending').length,
    multiTenant: orders.filter(o => o.isMultiTenant).length,
    routed: orders.filter(o => o.routedToTenant).length,
    totalRevenue: orders.reduce((sum, o) => sum + o.totalPrice, 0),
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
        dashboardType="superadmin"
        items={[{ label: 'Orders' }]}
      />
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            All Orders
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            View and manage all orders across the platform
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-600">Total Orders</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-xs text-gray-600">Pending</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-2xl font-bold text-purple-600">{stats.multiTenant}</p>
            <p className="text-xs text-gray-600">Multi-Tenant</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-2xl font-bold text-green-600">{stats.routed}</p>
            <p className="text-xs text-gray-600">Routed</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-lg font-bold text-blue-600">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-600">Total Revenue</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by order ID or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <FiFilter className="w-5 h-5 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
                <option value="Processing">Processing</option>
                <option value="Packed">Packed</option>
                <option value="Shipped">Shipped</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Tenant Filter */}
            <select
              value={filterTenant}
              onChange={(e) => setFilterTenant(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Tenants</option>
              <option value="platform">Platform Only</option>
              <option value="multi">Multi-Tenant</option>
              {tenants.map(tenant => (
                <option key={tenant._id} value={tenant._id}>
                  {tenant.businessName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Tenant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        #{order._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 hidden md:table-cell">
                        {order.user?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        ₹{order.totalPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 hidden sm:table-cell">
                        {order.isMultiTenant ? (
                          <span className="text-purple-600 font-medium">Multi-Tenant</span>
                        ) : (
                          getTenantName(order.tenantId)
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewOrder(order._id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <FiEye className="w-5 h-5" />
                          </button>
                          {!order.routedToTenant && (
                            <button
                              onClick={() => handleShowAssignModal(order._id)}
                              className="text-green-600 hover:text-green-800"
                              title="Assign to Tenant"
                            >
                              <FiSend className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Assign to Tenant Modal */}
        {assignModal.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Assign Order to Tenant
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Select a tenant to assign this order to. The tenant will be notified and can process the order.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Tenant
                </label>
                <select
                  value={selectedTenant}
                  onChange={(e) => setSelectedTenant(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">-- Choose a Tenant --</option>
                  <option value="all" className="font-semibold text-primary-600">
                    📢 Assign to All Tenants
                  </option>
                  {tenants
                    .filter(tenant => tenant.status === 'approved')
                    .map(tenant => (
                      <option key={tenant._id} value={tenant._id}>
                        {tenant.businessName} - {tenant.ownerName}
                      </option>
                    ))}
                </select>
                {selectedTenant === 'all' && (
                  <p className="text-xs text-orange-600 mt-2">
                    ⚠️ This will notify all approved tenants. First tenant to accept will process the order.
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCloseAssignModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignToTenant}
                  disabled={!selectedTenant}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Assign Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Order #{selectedOrder.orderNumber || selectedOrder._id.slice(-8)}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Customer Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Customer Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 font-medium">{selectedOrder.shippingAddress?.fullName || selectedOrder.user?.name}</p>
                      <p className="text-gray-600">{selectedOrder.user?.email}</p>
                      <p className="text-gray-600">{selectedOrder.shippingAddress?.phone}</p>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Shipping Address</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700">{selectedOrder.shippingAddress?.address}</p>
                      <p className="text-gray-700">
                        {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Order Items</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      {selectedOrder.orderItems?.map((item, index) => (
                        <div key={index} className="flex justify-between items-center pb-3 border-b last:border-b-0">
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                            {item.variant?.size && (
                              <p className="text-sm text-gray-600">Size: {item.variant.size}</p>
                            )}
                          </div>
                          <p className="font-medium text-gray-900">₹{item.price * item.quantity}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Update Status */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Update Status</h3>
                    <select
                      value={selectedOrder.orderStatus}
                      onChange={(e) => handleStatusUpdate(selectedOrder._id, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Tracking Number (for Shipped status) */}
                  {selectedOrder.orderStatus === 'Shipped' && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Tracking Number (Optional)</h3>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Enter tracking number"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  {/* Send Notification */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <FiSend className="text-primary-600" />
                      Send Status Notification
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Notify customer about order status: <span className="font-semibold text-primary-600">{selectedOrder.orderStatus}</span>
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleSendNotification(selectedOrder._id, 'email')}
                        disabled={sendingNotification}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <FiMail /> Email
                      </button>
                      <button
                        onClick={() => handleSendNotification(selectedOrder._id, 'whatsapp')}
                        disabled={sendingNotification}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <FaWhatsapp /> WhatsApp
                      </button>
                      <button
                        onClick={() => handleSendNotification(selectedOrder._id, 'both')}
                        disabled={sendingNotification}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <FiMessageCircle /> Both
                      </button>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Subtotal</span>
                      <span>₹{selectedOrder.itemsPrice}</span>
                    </div>
                    {selectedOrder.shippingPrice > 0 && (
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Shipping</span>
                        <span>₹{selectedOrder.shippingPrice}</span>
                      </div>
                    )}
                    {selectedOrder.giftWrapPrice > 0 && (
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Gift Wrap</span>
                        <span>₹{selectedOrder.giftWrapPrice}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                      <span>Total</span>
                      <span className="text-primary-600">₹{selectedOrder.totalPrice}</span>
                    </div>
                  </div>

                  {/* Download Invoice & Share */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleDownloadInvoice(selectedOrder._id, selectedOrder.orderNumber)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
                    >
                      <FiDownload /> Download
                    </button>
                    <button
                      onClick={() => handleShareInvoice(selectedOrder._id)}
                      disabled={sharingInvoice}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      <FaWhatsapp /> {sharingInvoice ? 'Uploading...' : 'Share PDF'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default SuperAdminOrders;
