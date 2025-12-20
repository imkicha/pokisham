import { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { FiEye, FiDownload, FiMail, FiMessageCircle, FiSend, FiPackage, FiUser, FiCalendar, FiX } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import DashboardBreadcrumb from '../../components/common/DashboardBreadcrumb';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [sharingInvoice, setSharingInvoice] = useState(false);

  useEffect(() => {
    document.title = 'Orders Management - Pokisham Admin';
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await API.get('/orders');
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
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
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
                        <div className="text-sm font-medium text-gray-900">
                          #{order.orderNumber || order._id.slice(-8)}
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
                    <div className="text-lg font-bold text-gray-900">₹{order.totalPrice}</div>
                  </div>

                  {/* Payment Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Payment:</span>
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

                {/* Shipping Address */}
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

                {/* Order Items */}
                <div>
                  <h3 className="text-base md:text-lg font-semibold mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.orderItems?.map((item, index) => (
                      <div key={index} className="flex justify-between items-start py-3 border-b last:border-0">
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium text-sm md:text-base">{item.name}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              Qty: {item.quantity}
                            </span>
                            {item.variant && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                Size: {item.variant.size}
                              </span>
                            )}
                            {item.giftWrap && (
                              <span className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                                Gift Wrap
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-900 font-semibold ml-4">₹{item.price * item.quantity}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Update Status */}
                <div>
                  <h3 className="text-base md:text-lg font-semibold mb-2">Update Status</h3>
                  <select
                    value={selectedOrder.orderStatus}
                    onChange={(e) => handleStatusUpdate(selectedOrder._id, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm md:text-base"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
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

                {/* Order Summary */}
                <div className="pt-4 border-t bg-gray-50 -mx-4 md:-mx-6 px-4 md:px-6 py-4 -mb-4 md:-mb-6 rounded-b-lg">
                  <div className="space-y-2 text-sm md:text-base">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items Price:</span>
                      <span>₹{selectedOrder.itemsPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping:</span>
                      <span>₹{selectedOrder.shippingPrice}</span>
                    </div>
                    {selectedOrder.giftWrapPrice > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gift Wrap:</span>
                        <span>₹{selectedOrder.giftWrapPrice}</span>
                      </div>
                    )}
                    {selectedOrder.taxPrice > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax:</span>
                        <span>₹{selectedOrder.taxPrice}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                      <span>Total Amount:</span>
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
