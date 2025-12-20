import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPackage, FiTruck, FiCheck, FiX, FiDownload } from 'react-icons/fi';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Breadcrumb from '../../components/common/Breadcrumb';
import toast from 'react-hot-toast';
import deliveryImage from '../../assets/images/pokisham_delivery-removebg-preview.png';

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrder();
  }, [id, isAuthenticated, navigate]);

  useEffect(() => {
    if (order) {
      document.title = `Order #${order.orderNumber} - Pokisham`;
    } else {
      document.title = 'Order Details - Pokisham';
    }
  }, [order]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/orders/${id}`);
      if (data.success) {
        setOrder(data.order);
      }
    } catch (error) {
      toast.error('Failed to fetch order details');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const response = await API.get(`/orders/${id}/invoice`, {
        responseType: 'blob',
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${order.orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Invoice downloaded successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to download invoice');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Delivered':
        return <FiCheck className="w-6 h-6 text-green-600" />;
      case 'Cancelled':
        return <FiX className="w-6 h-6 text-red-600" />;
      case 'Shipped':
      case 'Out for Delivery':
        return <FiTruck className="w-6 h-6 text-blue-600" />;
      default:
        return <FiPackage className="w-6 h-6 text-yellow-600" />;
    }
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

  if (!order) {
    return null;
  }

  const breadcrumbs = [
    { label: 'My Orders', path: '/orders' },
    { label: `Order #${order.orderNumber}` }
  ];

  return (
    <>
      <Breadcrumb items={breadcrumbs} />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-custom">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Order Details</h1>
              <p className="text-gray-600">Order #{order.orderNumber}</p>
            </div>
          <button
            onClick={handleDownloadInvoice}
            className="btn-primary flex items-center gap-2"
          >
            <FiDownload /> Download Invoice
          </button>
        </div>

        {/* Delivery Illustration Banner */}
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <img
              src={deliveryImage}
              alt="Your order is on its way"
              className="w-32 h-32 sm:w-40 sm:h-40 object-contain"
            />
            <div className="text-center sm:text-left text-white">
              <h2 className="text-xl sm:text-2xl font-display font-bold mb-2">
                {order.orderStatus === 'Delivered' ? 'Order Delivered!' :
                 order.orderStatus === 'Shipped' || order.orderStatus === 'Out for Delivery' ? 'Your order is on its way!' :
                 order.orderStatus === 'Cancelled' ? 'Order Cancelled' :
                 'We are preparing your order'}
              </h2>
              <p className="text-sm sm:text-base opacity-90">
                {order.orderStatus === 'Delivered' ? 'Thank you for shopping with Pokisham!' :
                 order.orderStatus === 'Shipped' || order.orderStatus === 'Out for Delivery' ? 'Your gift will reach you soon' :
                 order.orderStatus === 'Cancelled' ? 'We hope to serve you again soon' :
                 'Your gift is being carefully packed with love'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-display font-bold text-gray-900">Order Status</h2>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.orderStatus)}`}>
                  {order.orderStatus}
                </span>
              </div>

              <div className="flex items-center gap-4">
                {getStatusIcon(order.orderStatus)}
                <div>
                  <p className="font-semibold text-gray-900">{order.orderStatus}</p>
                  <p className="text-sm text-gray-600">
                    {order.statusHistory[order.statusHistory.length - 1]?.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(order.statusHistory[order.statusHistory.length - 1]?.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Status Timeline */}
              {order.statusHistory.length > 1 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold text-gray-900 mb-4">Order Timeline</h3>
                  <div className="space-y-3">
                    {order.statusHistory.slice().reverse().map((history, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex-shrink-0 w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium text-gray-900">{history.status}</p>
                          <p className="text-sm text-gray-600">{history.message}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(history.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-display font-bold text-gray-900 mb-4">Order Items</h2>

              <div className="space-y-4">
                {order.orderItems.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-4 border-b last:border-b-0">
                    <img
                      src={item.image || '/placeholder.png'}
                      alt={item.name}
                      className="w-20 h-20 rounded-md object-cover border border-gray-200"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      {item.variant?.size && (
                        <p className="text-sm text-gray-600">Size: {item.variant.size}</p>
                      )}
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      {item.giftWrap && (
                        <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          Gift Wrapped
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₹{item.price * item.quantity}</p>
                      <p className="text-sm text-gray-600">₹{item.price} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-display font-bold text-gray-900 mb-4">Shipping Address</h2>
              <div className="text-gray-700">
                <p className="font-semibold">{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                </p>
                <p className="mt-2">Phone: {order.shippingAddress.phone}</p>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-display font-bold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4 pb-4 border-b">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>₹{order.itemsPrice}</span>
                </div>

                {order.giftWrapPrice > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Gift Wrap</span>
                    <span>₹{order.giftWrapPrice}</span>
                  </div>
                )}

                {order.taxPrice > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Tax</span>
                    <span>₹{order.taxPrice}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-700">
                  <span>Shipping</span>
                  <span className={order.shippingPrice === 0 ? 'text-green-600 font-semibold' : ''}>
                    {order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`}
                  </span>
                </div>

                {order.discountPrice > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{order.discountPrice}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-lg font-bold text-gray-900 mb-4">
                <span>Total</span>
                <span>₹{order.totalPrice}</span>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Payment Method</span>
                  <span className="font-semibold">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Payment Status</span>
                  <span className={`font-semibold ${
                    order.paymentInfo.status === 'completed' ? 'text-green-600' :
                    order.paymentInfo.status === 'failed' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {order.paymentInfo.status.charAt(0).toUpperCase() + order.paymentInfo.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => navigate('/orders')}
                  className="btn-outline w-full"
                >
                  View All Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default OrderDetailPage;
