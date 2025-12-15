import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPackage, FiDownload, FiX, FiAlertCircle } from 'react-icons/fi';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Breadcrumb from '../../components/common/Breadcrumb';
import toast from 'react-hot-toast';

const OrdersPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    document.title = 'My Orders - Pokisham';
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/orders/myorders');
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
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

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    try {
      const { data } = await API.put(`/orders/${cancelOrderId}/cancel`, {
        reason: cancelReason
      });

      if (data.success) {
        toast.success('Order cancelled successfully');
        setShowCancelModal(false);
        setCancelReason('');
        setCancelOrderId(null);
        fetchOrders(); // Refresh orders
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const canCancelOrder = (status) => {
    return ['Processing', 'Packed'].includes(status);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'Shipped':
      case 'Out for Delivery':
        return 'bg-blue-100 text-blue-800';
      case 'Processing':
      case 'Packed':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container-custom py-12">
        <div className="text-center py-16">
          <FiPackage className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">No orders yet</h2>
          <p className="text-gray-600 mb-8">Start shopping to place your first order!</p>
          <Link to="/products" className="btn-primary inline-block">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const breadcrumbs = [{ label: 'My Orders' }];

  return (
    <>
      <Breadcrumb items={breadcrumbs} />
      <div className="container-custom py-12">
        <h1 className="text-4xl font-display font-bold text-gray-900 mb-8">My Orders</h1>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <FiAlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Cancel Order</h2>
            </div>

            <p className="text-gray-600 mb-4">
              Please provide a reason for cancelling this order. This helps us improve our service.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Reason*
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                rows="4"
                placeholder="E.g., Changed my mind, Found a better price, Ordered by mistake..."
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setCancelOrderId(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order._id}
            className="block bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                <p className="text-sm text-gray-600">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.orderStatus)}`}>
                {order.orderStatus}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 mb-4">
              {order.orderItems.slice(0, 3).map((item, index) => (
                <img
                  key={index}
                  src={item.image || '/placeholder.png'}
                  alt={item.name}
                  className="w-16 h-16 rounded-md object-cover border border-gray-200"
                />
              ))}
              {order.orderItems.length > 3 && (
                <div className="w-16 h-16 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-600">+{order.orderItems.length - 3}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-600">
                  {order.orderItems.length} item{order.orderItems.length > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-gray-600">Payment: {order.paymentMethod}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-xl font-bold text-primary-600">₹{order.totalPrice}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
              <Link
                to={`/orders/${order._id}`}
                className="btn-secondary flex items-center gap-2 flex-1 justify-center"
              >
                <FiPackage /> View Details
              </Link>
              {canCancelOrder(order.orderStatus) && (
                <button
                  onClick={() => {
                    setCancelOrderId(order._id);
                    setShowCancelModal(true);
                  }}
                  className="btn-outline border-red-500 text-red-600 hover:bg-red-50 flex items-center gap-2 flex-1 justify-center"
                >
                  <FiX /> Cancel Order
                </button>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleDownloadInvoice(order._id, order.orderNumber);
                }}
                className="btn-primary flex items-center gap-2 flex-1 justify-center"
              >
                <FiDownload /> Download Invoice
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
};

export default OrdersPage;
