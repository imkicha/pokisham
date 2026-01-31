import { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { FiEye, FiDownload, FiMail, FiMessageCircle, FiSend, FiPackage, FiUser, FiCalendar, FiX, FiCreditCard, FiPercent, FiShoppingBag, FiImage } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import DashboardBreadcrumb from '../../components/common/DashboardBreadcrumb';

const OrdersManagement = () => {
  const handleDownloadPhoto = async (url, fileName) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'custom-photo.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      window.open(url, '_blank');
      toast.error('Download failed, opened in new tab instead');
    }
  };

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [sharingInvoice, setSharingInvoice] = useState(false);
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');
  const [vendorName, setVendorName] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [forwardingToVendor, setForwardingToVendor] = useState(false);

  useEffect(() => {
    document.title = 'Orders Management - Pokisham Admin';
    fetchOrders();
  }, [orderTypeFilter]);

  const fetchOrders = async () => {
    try {
      const params = {};
      if (orderTypeFilter !== 'all') params.orderType = orderTypeFilter;
      const { data } = await API.get('/orders', { params });
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Fetch orders error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleForwardToVendor = async (orderId) => {
    if (!vendorName || !vendorPhone) {
      toast.error('Please enter vendor name and phone');
      return;
    }
    setForwardingToVendor(true);
    try {
      const { data } = await API.post(`/orders/${orderId}/forward-vendor`, {
        vendorName,
        vendorPhone,
      });
      if (data.success) {
        window.open(data.whatsappUrl, '_blank');
        toast.success('WhatsApp opened - send the message to vendor!');
        setSelectedOrder(data.order);
        setVendorName('');
        setVendorPhone('');
        fetchOrders();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to forward to vendor');
    } finally {
      setForwardingToVendor(false);
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      const { data } = await API.put(`/orders/${orderId}/status`, { status });
      if (data.success) {
        toast.success('Order status updated successfully');
        setSelectedOrder(data.order);
        fetchOrders();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update order status');
    }
  };

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
      toast.error(error.response?.data?.message || 'Failed to download invoice');
    }
  };

  const handleSendNotification = async (orderId, type) => {
    setSendingNotification(true);
    try {
      const { data } = await API.post(`/orders/${orderId}/notify`, {
        type,
        trackingNumber: trackingNumber || undefined,
      });

      if (data.success) {
        if (data.results.email) {
          if (data.results.email.success) {
            toast.success('Email sent successfully!');
          } else {
            toast.error(`Email failed: ${data.results.email.error}`);
          }
        }

        if (data.results.whatsapp) {
          if (data.results.whatsapp.success) {
            window.open(data.results.whatsapp.url, '_blank');
            toast.success('WhatsApp opened - send the message!');
          } else {
            toast.error(`WhatsApp failed: ${data.results.whatsapp.error}`);
          }
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send notification');
    } finally {
      setSendingNotification(false);
    }
  };

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

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      processing: 'bg-blue-100 text-blue-800',
      packed: 'bg-indigo-100 text-indigo-800',
      shipped: 'bg-purple-100 text-purple-800',
      'out for delivery': 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      'sent to vendor': 'bg-indigo-100 text-indigo-800',
      confirmed: 'bg-teal-100 text-teal-800',
      completed: 'bg-green-100 text-green-800',
    };
    return colors[statusLower] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
        items={[{ label: 'Orders' }]}
      />
      <div className="container-custom py-4 md:py-8 px-3 md:px-4">
        <h1 className="text-2xl md:text-4xl font-display font-bold text-gray-900 mb-4 md:mb-8">
          Orders Management
        </h1>

        {/* Order Type Filter Tabs */}
        <div className="flex gap-2 mb-4 md:mb-6">
          {[
            { key: 'all', label: 'All Orders' },
            { key: 'standard', label: 'Standard' },
            { key: 'booking', label: 'Bookings' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setLoading(true); setOrderTypeFilter(tab.key); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                orderTypeFilter === tab.key
                  ? tab.key === 'booking'
                    ? 'bg-orange-600 text-white'
                    : 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          #{order.orderNumber || order._id.slice(-8)}
                          {order.orderType === 'booking' && (
                            <span className="px-1.5 py-0.5 text-xs font-semibold rounded bg-orange-100 text-orange-700">Booking</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.user?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{order.user?.email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">₹{order.totalPrice}</div>
                        {order.discountPrice > 0 && (
                          <div className="text-xs text-green-600">-₹{order.discountPrice} off</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            order.paymentInfo?.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {order.paymentInfo?.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            order.orderStatus
                          )}`}
                        >
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-primary-600 hover:text-primary-900 mr-4"
                        >
                          <FiEye className="inline" /> View
                        </button>
                        <button
                          onClick={() => handleDownloadInvoice(order._id, order.orderNumber)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <FiDownload className="inline" /> Invoice
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
              <FiPackage className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No orders found</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Card Header */}
                <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiPackage className="text-primary-600" />
                    <span className="font-semibold text-gray-900">
                      #{order.orderNumber || order._id.slice(-8)}
                    </span>
                    {order.orderType === 'booking' && (
                      <span className="px-1.5 py-0.5 text-xs font-semibold rounded bg-orange-100 text-orange-700">Booking</span>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      order.orderStatus
                    )}`}
                  >
                    {order.orderStatus}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  {/* Customer */}
                  <div className="flex items-start gap-3">
                    <FiUser className="text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.user?.name || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{order.user?.email || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Date & Total */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FiCalendar className="text-gray-400" />
                      {formatDate(order.createdAt)}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">₹{order.totalPrice}</div>
                      {order.discountPrice > 0 && (
                        <div className="text-xs text-green-600">-₹{order.discountPrice} discount</div>
                      )}
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Payment ({order.paymentMethod || 'N/A'}):</span>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        order.paymentInfo?.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {order.paymentInfo?.status || 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-4 py-3 bg-gray-50 border-t flex gap-2">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                  >
                    <FiEye className="w-4 h-4" /> View
                  </button>
                  <button
                    onClick={() => handleDownloadInvoice(order._id, order.orderNumber)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    <FiDownload className="w-4 h-4" /> Invoice
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[95vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b px-4 py-3 md:px-6 md:py-4 flex justify-between items-center z-10">
                <h2 className="text-lg md:text-2xl font-bold text-gray-900">
                  Order #{selectedOrder.orderNumber || selectedOrder._id.slice(-8)}
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 md:p-6 space-y-5">
                {/* Order Overview Badges */}
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.orderStatus)}`}>
                    {selectedOrder.orderStatus}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                    selectedOrder.paymentInfo?.status === 'completed' ? 'bg-green-100 text-green-700' :
                    selectedOrder.paymentInfo?.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    <FiCreditCard className="w-3 h-3" />
                    {selectedOrder.paymentMethod} — {selectedOrder.paymentInfo?.status || 'pending'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    <FiCalendar className="w-3 h-3" />
                    {formatDate(selectedOrder.createdAt)}
                  </span>
                  {selectedOrder.discountPrice > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <FiPercent className="w-3 h-3" />
                      Saved ₹{selectedOrder.discountPrice}
                    </span>
                  )}
                </div>

                {/* Customer Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-base md:text-lg font-semibold mb-2 flex items-center gap-2">
                    <FiUser className="text-primary-600" />
                    Customer Information
                  </h3>
                  <p className="text-gray-700 font-medium">
                    {selectedOrder.shippingAddress?.name || selectedOrder.user?.name}
                  </p>
                  <p className="text-gray-600 text-sm">{selectedOrder.user?.email}</p>
                  <p className="text-gray-600 text-sm">{selectedOrder.shippingAddress?.phone}</p>
                </div>

                {/* Booking Details - shown for booking orders */}
                {selectedOrder.orderType === 'booking' && selectedOrder.bookingDetails && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h3 className="text-base md:text-lg font-semibold mb-2 text-orange-800">Booking Details</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Customer:</span>
                        <p className="font-medium">{selectedOrder.bookingDetails.customerName}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Phone:</span>
                        <p className="font-medium">{selectedOrder.bookingDetails.customerPhone}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Event Date:</span>
                        <p className="font-medium">{formatDate(selectedOrder.bookingDetails.eventDate)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Quantity:</span>
                        <p className="font-medium">{selectedOrder.bookingDetails.quantity}</p>
                      </div>
                      {selectedOrder.bookingDetails.city && (
                        <div>
                          <span className="text-gray-600">City:</span>
                          <p className="font-medium">{selectedOrder.bookingDetails.city}</p>
                        </div>
                      )}
                      {selectedOrder.bookingDetails.notes && (
                        <div className="col-span-2">
                          <span className="text-gray-600">Notes:</span>
                          <p className="font-medium">{selectedOrder.bookingDetails.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Vendor Info - shown if vendor assigned */}
                {selectedOrder.orderType === 'booking' && selectedOrder.vendorInfo?.vendorName && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <h3 className="text-base md:text-lg font-semibold mb-2 text-indigo-800">Vendor Info</h3>
                    <div className="text-sm">
                      <p><span className="text-gray-600">Vendor:</span> <span className="font-medium">{selectedOrder.vendorInfo.vendorName}</span></p>
                      <p><span className="text-gray-600">Phone:</span> <span className="font-medium">{selectedOrder.vendorInfo.vendorPhone}</span></p>
                      {selectedOrder.vendorInfo.forwardedAt && (
                        <p><span className="text-gray-600">Forwarded:</span> <span className="font-medium">{formatDate(selectedOrder.vendorInfo.forwardedAt)}</span></p>
                      )}
                    </div>
                  </div>
                )}

                {/* Forward to Vendor - shown for booking orders */}
                {selectedOrder.orderType === 'booking' && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-base md:text-lg font-semibold mb-3 flex items-center gap-2">
                      <FaWhatsapp className="text-green-600" />
                      Forward to Vendor
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input
                        type="text"
                        value={vendorName}
                        onChange={(e) => setVendorName(e.target.value)}
                        placeholder="Vendor Name"
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
                      />
                      <input
                        type="tel"
                        value={vendorPhone}
                        onChange={(e) => setVendorPhone(e.target.value)}
                        placeholder="Vendor Phone"
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <button
                      onClick={() => handleForwardToVendor(selectedOrder._id)}
                      disabled={forwardingToVendor}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      <FaWhatsapp className="w-4 h-4" />
                      {forwardingToVendor ? 'Forwarding...' : 'Send via WhatsApp'}
                    </button>
                  </div>
                )}

                {/* Shipping Address - hidden for booking orders */}
                {selectedOrder.orderType !== 'booking' && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-base md:text-lg font-semibold mb-2">Shipping Address</h3>
                    <p className="text-gray-700 text-sm">{selectedOrder.shippingAddress?.addressLine1}</p>
                    {selectedOrder.shippingAddress?.addressLine2 && (
                      <p className="text-gray-700 text-sm">{selectedOrder.shippingAddress.addressLine2}</p>
                    )}
                    <p className="text-gray-700 text-sm">
                      {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state}
                    </p>
                    <p className="text-gray-700 text-sm">{selectedOrder.shippingAddress?.pincode}</p>
                  </div>
                )}

                {/* Order Items */}
                <div>
                  <h3 className="text-base md:text-lg font-semibold mb-3 flex items-center gap-2">
                    <FiShoppingBag className="text-primary-600" />
                    Order Items ({selectedOrder.orderItems?.reduce((sum, i) => sum + i.quantity, 0)} items)
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    {selectedOrder.orderItems?.map((item, index) => (
                      <div key={index} className="border-b last:border-0 hover:bg-gray-50">
                        <div className="flex items-center gap-3 p-3">
                          {/* Product Image */}
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-12 md:w-14 md:h-14 rounded-lg object-cover border flex-shrink-0"
                            />
                          )}
                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 font-medium text-sm md:text-base truncate">{item.name}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {item.variant?.size && (
                                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-medium">
                                  {item.variant.size}
                                </span>
                              )}
                              {item.giftWrap && (
                                <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded font-medium">
                                  Gift Wrap
                                </span>
                              )}
                              {item.customPhoto?.url && (
                                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded font-medium">
                                  Custom Photo
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Price Breakdown */}
                          <div className="text-right flex-shrink-0">
                            <p className="text-gray-900 font-semibold text-sm md:text-base">₹{item.price * item.quantity}</p>
                            <p className="text-xs text-gray-500">
                              {item.quantity > 1 ? `${item.quantity} × ₹${item.price}` : `₹${item.price}`}
                            </p>
                          </div>
                        </div>
                        {/* Custom Photo Preview & Download */}
                        {item.customPhoto?.url && (
                          <div className="px-3 pb-3 flex items-center gap-3 ml-[60px] md:ml-[68px]">
                            <img
                              src={item.customPhoto.url}
                              alt="Customer uploaded photo"
                              className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg border-2 border-orange-200 cursor-pointer"
                              onClick={() => window.open(item.customPhoto.url, '_blank')}
                            />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 mb-1">Customer's uploaded photo</p>
                              <button
                                onClick={() => handleDownloadPhoto(item.customPhoto.url, `custom-photo-${item.product?.name || 'order'}.jpg`)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 transition-colors"
                              >
                                <FiDownload className="w-3 h-3" />
                                Download Photo
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Combo Offers Applied */}
                {selectedOrder.comboOfferIds?.length > 0 && selectedOrder.comboDiscount > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-sm md:text-base font-semibold text-green-800 flex items-center gap-2 mb-1">
                      <FiPackage className="w-4 h-4" />
                      Combo Offer Applied
                    </h3>
                    <p className="text-sm text-green-700">
                      Combo discount: <span className="font-bold">-₹{selectedOrder.comboDiscount}</span>
                    </p>
                  </div>
                )}

                {/* Coupon Applied */}
                {selectedOrder.couponCode && selectedOrder.couponDiscount > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm md:text-base font-semibold text-blue-800 flex items-center gap-2 mb-1">
                      <FiPercent className="w-4 h-4" />
                      Coupon Applied
                    </h3>
                    <p className="text-sm text-blue-700">
                      Code: <span className="font-mono font-bold">{selectedOrder.couponCode}</span>
                      {' '}— Saved <span className="font-bold">₹{selectedOrder.couponDiscount}</span>
                    </p>
                  </div>
                )}

                {/* Update Status */}
                <div>
                  <h3 className="text-base md:text-lg font-semibold mb-2">Update Status</h3>
                  <select
                    value={selectedOrder.orderStatus}
                    onChange={(e) => handleStatusUpdate(selectedOrder._id, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm md:text-base"
                  >
                    {selectedOrder.orderType === 'booking' ? (
                      <>
                        <option value="Pending">Pending</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Sent to Vendor">Sent to Vendor</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </>
                    ) : (
                      <>
                        <option value="Pending">Pending</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Processing">Processing</option>
                        <option value="Packed">Packed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Tracking Number */}
                {selectedOrder.orderStatus === 'Shipped' && (
                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-2">Tracking Number (Optional)</h3>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm md:text-base"
                    />
                  </div>
                )}

                {/* Send Notification Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-base md:text-lg font-semibold mb-3 flex items-center gap-2">
                    <FiSend className="text-primary-600" />
                    Send Status Notification
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 mb-3">
                    Notify customer about order status:{' '}
                    <span className="font-semibold text-primary-600">{selectedOrder.orderStatus}</span>
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleSendNotification(selectedOrder._id, 'email')}
                      disabled={sendingNotification}
                      className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs md:text-sm"
                    >
                      <FiMail className="w-4 h-4" />
                      <span>Email</span>
                    </button>
                    <button
                      onClick={() => handleSendNotification(selectedOrder._id, 'whatsapp')}
                      disabled={sendingNotification}
                      className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 md:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs md:text-sm"
                    >
                      <FaWhatsapp className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={() => handleSendNotification(selectedOrder._id, 'both')}
                      disabled={sendingNotification}
                      className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 md:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs md:text-sm"
                    >
                      <FiMessageCircle className="w-4 h-4" />
                      <span>Both</span>
                    </button>
                  </div>
                </div>

                {/* Download Invoice & Share */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleDownloadInvoice(selectedOrder._id, selectedOrder.orderNumber)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors text-sm md:text-base"
                  >
                    <FiDownload className="w-4 h-4 md:w-5 md:h-5" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => handleShareInvoice(selectedOrder._id)}
                    disabled={sharingInvoice}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors text-sm md:text-base"
                  >
                    <FaWhatsapp className="w-4 h-4 md:w-5 md:h-5" />
                    <span>{sharingInvoice ? 'Uploading...' : 'Share PDF'}</span>
                  </button>
                </div>

                {/* Price Summary */}
                <div className="pt-4 border-t bg-gray-50 -mx-4 md:-mx-6 px-4 md:px-6 py-4 -mb-4 md:-mb-6 rounded-b-lg">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Price Breakdown</h3>
                  <div className="space-y-2 text-sm md:text-base">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items Total</span>
                      <span>₹{selectedOrder.itemsPrice}</span>
                    </div>
                    {selectedOrder.packingPrice > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Packing Charges</span>
                        <span>₹{selectedOrder.packingPrice}</span>
                      </div>
                    )}
                    {selectedOrder.giftWrapPrice > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gift Wrap</span>
                        <span>₹{selectedOrder.giftWrapPrice}</span>
                      </div>
                    )}
                    {selectedOrder.shippingPrice > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery Charge</span>
                        <span>₹{selectedOrder.shippingPrice}</span>
                      </div>
                    )}
                    {selectedOrder.shippingPrice === 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery</span>
                        <span className="text-orange-600 font-medium">To Pay</span>
                      </div>
                    )}
                    {selectedOrder.taxPrice > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax</span>
                        <span>₹{selectedOrder.taxPrice}</span>
                      </div>
                    )}
                    {selectedOrder.discountPrice > 0 && (
                      <>
                        <div className="flex justify-between text-green-600 font-medium">
                          <span>Discount</span>
                          <span>-₹{selectedOrder.discountPrice}</span>
                        </div>
                        {/* Show combo/coupon breakdown only when both exist */}
                        {selectedOrder.comboDiscount > 0 && selectedOrder.couponDiscount > 0 && (
                          <div className="ml-4 space-y-1">
                            <div className="flex justify-between text-xs text-green-500">
                              <span>Combo Offer</span>
                              <span>-₹{selectedOrder.comboDiscount}</span>
                            </div>
                            <div className="flex justify-between text-xs text-green-500">
                              <span>Coupon {selectedOrder.couponCode && `(${selectedOrder.couponCode})`}</span>
                              <span>-₹{selectedOrder.couponDiscount}</span>
                            </div>
                          </div>
                        )}
                        {/* Show coupon code if only coupon discount */}
                        {selectedOrder.couponCode && !selectedOrder.comboDiscount && (
                          <div className="flex justify-between text-xs text-green-500 ml-4">
                            <span>Coupon: {selectedOrder.couponCode}</span>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-3 mt-3">
                      <span>Total Amount</span>
                      <span className="text-primary-600">₹{selectedOrder.totalPrice}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default OrdersManagement;
