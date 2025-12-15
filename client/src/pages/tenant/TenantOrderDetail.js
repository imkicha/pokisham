import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiPackage, FiMapPin, FiUser, FiPhone, FiMail, FiCreditCard, FiImage, FiDownload } from 'react-icons/fi';

const TenantOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    document.title = 'Order Details - Tenant Dashboard - Pokisham';
    if (user?.tenantId) {
      fetchOrderDetails();
    }
  }, [id, user]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/orders/${id}`);

      if (data.success) {
        // Verify this order belongs to this tenant or is unassigned (broadcasted orders)
        const orderTenantId = data.order.tenantId?._id || data.order.tenantId;

        // Allow viewing if:
        // 1. Order is assigned to this tenant, OR
        // 2. Order is not assigned to anyone yet (routedToTenant is false)
        const isAssignedToThisTenant = orderTenantId && orderTenantId.toString() === user.tenantId?.toString();
        const isUnassigned = !data.order.routedToTenant;

        if (!isAssignedToThisTenant && !isUnassigned) {
          toast.error('You do not have permission to view this order');
          navigate('/tenant/orders');
          return;
        }
        setOrder(data.order);
      }
    } catch (error) {
      toast.error('Failed to load order details');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async () => {
    if (!window.confirm('Are you sure you want to accept this order? This will assign it to you.')) return;

    try {
      setUpdating(true);
      const { data } = await API.post(`/orders/${id}/accept`);

      if (data.success) {
        toast.success('Order accepted successfully!');
        fetchOrderDetails();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept order');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!window.confirm(`Are you sure you want to update status to "${newStatus}"?`)) return;

    try {
      setUpdating(true);
      const { data } = await API.put(`/orders/${id}/tenant-status`, {
        orderStatus: newStatus
      });

      if (data.success) {
        toast.success('Order status updated successfully');
        fetchOrderDetails();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Accepted':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Processing':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Out for Delivery':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'Delivered':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'Pending': 'Accepted',
      'Accepted': 'Processing',
      'Processing': 'Out for Delivery',
      'Out for Delivery': 'Delivered'
    };
    return statusFlow[currentStatus];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Order not found</p>
          <button
            onClick={() => navigate('/tenant/orders')}
            className="mt-4 text-primary-600 hover:text-primary-700"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const nextStatus = getNextStatus(order.orderStatus);
  const canUpdateStatus = nextStatus && order.orderStatus !== 'Delivered' && order.orderStatus !== 'Cancelled';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/tenant/orders')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <FiArrowLeft className="w-5 h-5" />
            Back to Orders
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Order #{order._id.slice(-8).toUpperCase()}
              </h1>
              <p className="text-sm text-gray-600">
                Placed on {new Date(order.createdAt).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="flex gap-2">
              <span className={`px-4 py-2 rounded-lg border-2 font-semibold ${getStatusColor(order.orderStatus)}`}>
                {order.orderStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiPackage className="w-5 h-5" />
                Order Items
              </h2>
              <div className="space-y-4">
                {order.orderItems.map((item, index) => (
                  <div key={index} className="flex gap-4 p-4 border border-gray-200 rounded-lg">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        ₹{item.price.toLocaleString('en-IN')} × {item.quantity} = ₹
                        {(item.price * item.quantity).toLocaleString('en-IN')}
                      </p>

                      {/* Customer's Custom Photo for Frame */}
                      {item.customPhoto?.url && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <FiImage className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">
                              Customer's Photo for Print
                            </span>
                          </div>
                          <div className="flex items-start gap-3">
                            <img
                              src={item.customPhoto.url}
                              alt="Customer's custom photo"
                              className="w-24 h-24 object-cover rounded-lg border-2 border-blue-300 cursor-pointer hover:opacity-90"
                              onClick={() => window.open(item.customPhoto.url, '_blank')}
                            />
                            <div className="flex-1">
                              <p className="text-xs text-gray-600 mb-2">
                                Click image to view full size. Use this photo for printing on the frame.
                              </p>
                              <a
                                href={item.customPhoto.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <FiDownload className="w-3 h-3" />
                                Download Photo
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiMapPin className="w-5 h-5" />
                Shipping Address
              </h2>
              <div className="text-gray-700">
                <p className="font-medium">{order.shippingAddress.fullName}</p>
                <p className="mt-2">{order.shippingAddress.address}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </p>
                <p className="mt-2 flex items-center gap-2">
                  <FiPhone className="w-4 h-4" />
                  {order.shippingAddress.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiUser className="w-5 h-5" />
                Customer
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <FiUser className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{order.user?.name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiMail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{order.user?.email || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">
                    ₹{(order.totalPrice - order.shippingPrice).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-gray-900">
                    ₹{order.shippingPrice.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-xl text-gray-900">
                      ₹{order.totalPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiCreditCard className="w-5 h-5" />
                Payment
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Method</span>
                  <span className="font-medium text-gray-900">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`font-medium ${order.isPaid ? 'text-green-600' : 'text-orange-600'}`}>
                    {order.isPaid ? 'Paid' : 'Pending'}
                  </span>
                </div>
                {order.isPaid && order.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid At</span>
                    <span className="font-medium text-gray-900">
                      {new Date(order.paidAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Accept Order (for broadcasted/unassigned orders) */}
            {!order.routedToTenant && (
              <div className="bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-300 rounded-xl shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">📢 Order Available</h2>
                <p className="text-sm text-gray-600 mb-4">
                  This order has been broadcasted to all tenants. Click below to accept and assign it to yourself.
                </p>
                <button
                  onClick={handleAcceptOrder}
                  disabled={updating}
                  className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Accepting...' : 'Accept This Order'}
                </button>
              </div>
            )}

            {/* Update Status Actions */}
            {order.routedToTenant && canUpdateStatus && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Update Order Status</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Current status: <span className="font-semibold">{order.orderStatus}</span>
                </p>
                <button
                  onClick={() => handleUpdateStatus(nextStatus)}
                  disabled={updating}
                  className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Updating...' : `Mark as ${nextStatus}`}
                </button>
              </div>
            )}

            {order.orderStatus === 'Delivered' && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                <p className="text-green-800 font-medium">✓ This order has been delivered</p>
                {order.deliveredAt && (
                  <p className="text-sm text-green-700 mt-1">
                    Delivered on {new Date(order.deliveredAt).toLocaleDateString('en-IN')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantOrderDetail;
