import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { FiEye, FiDownload, FiMail, FiMessageCircle, FiSend } from 'react-icons/fi';
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
        // Update the selected order with new status
        setSelectedOrder(data.order);
        // Refresh the orders list
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

      // Create blob link to download
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

  // Send notification (Email/WhatsApp)
  const handleSendNotification = async (orderId, type) => {
    setSendingNotification(true);
    try {
      const { data } = await API.post(`/orders/${orderId}/notify`, {
        type,
        trackingNumber: trackingNumber || undefined,
      });

      if (data.success) {
        // Handle Email result
        if (data.results.email) {
          if (data.results.email.success) {
            toast.success('Email sent successfully!');
          } else {
            toast.error(`Email failed: ${data.results.email.error}`);
          }
        }

        // Handle WhatsApp result - open WhatsApp Web
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
      <div className="container-custom py-8">
      <h1 className="text-4xl font-display font-bold text-gray-900 mb-8">Orders Management</h1>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                <tr key={order._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">#{order.orderNumber || order._id.slice(-8)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.user?.name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{order.user?.email || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">₹{order.totalPrice}</div>
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

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Order #{selectedOrder.orderNumber || selectedOrder._id.slice(-8)}
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Customer Information</h3>
                  <p className="text-gray-700">{selectedOrder.shippingAddress?.name || selectedOrder.user?.name}</p>
                  <p className="text-gray-600">{selectedOrder.user?.email}</p>
                  <p className="text-gray-600">{selectedOrder.shippingAddress?.phone}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Shipping Address</h3>
                  <p className="text-gray-700">{selectedOrder.shippingAddress?.addressLine1}</p>
                  {selectedOrder.shippingAddress?.addressLine2 && (
                    <p className="text-gray-700">{selectedOrder.shippingAddress.addressLine2}</p>
                  )}
                  <p className="text-gray-700">
                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state}
                  </p>
                  <p className="text-gray-700">{selectedOrder.shippingAddress?.pincode}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Order Items</h3>
                  {selectedOrder.orderItems?.map((item, index) => (
                    <div key={index} className="flex justify-between py-2 border-b">
                      <div>
                        <p className="text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        {item.variant && (
                          <p className="text-sm text-gray-600">Size: {item.variant.size}</p>
                        )}
                        {item.giftWrap && (
                          <p className="text-sm text-primary-600">Gift Wrap</p>
                        )}
                      </div>
                      <p className="text-gray-900">₹{item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Update Status</h3>
                  <select
                    value={selectedOrder.orderStatus}
                    onChange={(e) => handleStatusUpdate(selectedOrder._id, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                )}

                {/* Send Notification Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
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
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiMail /> Email
                    </button>
                    <button
                      onClick={() => handleSendNotification(selectedOrder._id, 'whatsapp')}
                      disabled={sendingNotification}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FaWhatsapp /> WhatsApp
                    </button>
                    <button
                      onClick={() => handleSendNotification(selectedOrder._id, 'both')}
                      disabled={sendingNotification}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiMessageCircle /> Both
                    </button>
                  </div>
                </div>

                {/* Download Invoice & Share */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleDownloadInvoice(selectedOrder._id, selectedOrder.orderNumber)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium transition-colors"
                  >
                    <FiDownload /> Download
                  </button>
                  <button
                    onClick={() => handleShareInvoice(selectedOrder._id)}
                    disabled={sharingInvoice}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    <FaWhatsapp /> {sharingInvoice ? 'Uploading...' : 'Share PDF'}
                  </button>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Items Price:</span>
                    <span>₹{selectedOrder.itemsPrice}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Shipping:</span>
                    <span>₹{selectedOrder.shippingPrice}</span>
                  </div>
                  {selectedOrder.giftWrapPrice > 0 && (
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Gift Wrap:</span>
                      <span>₹{selectedOrder.giftWrapPrice}</span>
                    </div>
                  )}
                  {selectedOrder.taxPrice > 0 && (
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Tax:</span>
                      <span>₹{selectedOrder.taxPrice}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                    <span>Total Amount:</span>
                    <span>₹{selectedOrder.totalPrice}</span>
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
