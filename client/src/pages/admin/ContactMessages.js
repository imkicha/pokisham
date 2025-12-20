import { useState, useEffect } from 'react';
import { FiMail, FiPhone, FiClock, FiEye, FiTrash2, FiCheck, FiMessageCircle, FiX, FiChevronLeft, FiChevronRight, FiSend } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import DashboardBreadcrumb from '../../components/common/DashboardBreadcrumb';

const ContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppMessage, setWhatsAppMessage] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  useEffect(() => {
    document.title = 'Contact Messages - Admin Dashboard - Pokisham';
    fetchMessages();
  }, [statusFilter, pagination.page]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/contact?status=${statusFilter}&page=${pagination.page}&limit=${pagination.limit}`);
      if (data.success) {
        setMessages(data.contacts);
        setPagination(data.pagination);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      toast.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMessage = async (message) => {
    setSelectedMessage(message);

    // Mark as read if unread
    if (message.status === 'unread') {
      try {
        await API.get(`/contact/${message._id}`);
        // Update local state
        setMessages(prev =>
          prev.map(m => m._id === message._id ? { ...m, status: 'read' } : m)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  const handleUpdateStatus = async (messageId, newStatus) => {
    try {
      const { data } = await API.put(`/contact/${messageId}`, { status: newStatus });
      if (data.success) {
        toast.success(`Message marked as ${newStatus}`);
        setMessages(prev =>
          prev.map(m => m._id === messageId ? data.contact : m)
        );
        if (selectedMessage?._id === messageId) {
          setSelectedMessage(data.contact);
        }
        // Refresh unread count
        const countRes = await API.get('/contact/unread-count');
        setUnreadCount(countRes.data.count);
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      const { data } = await API.delete(`/contact/${messageId}`);
      if (data.success) {
        toast.success('Message deleted');
        setMessages(prev => prev.filter(m => m._id !== messageId));
        if (selectedMessage?._id === messageId) {
          setSelectedMessage(null);
        }
        fetchMessages();
      }
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const openReplyModal = () => {
    const greeting = `Dear ${selectedMessage.name},\n\nThank you for contacting Pokisham.\n\n`;
    const signature = `\n\nBest regards,\nPokisham Team`;
    setReplyMessage(greeting + signature);
    setShowReplyModal(true);
  };

  const openWhatsAppModal = () => {
    const greeting = `Hi ${selectedMessage.name},\n\nThank you for contacting Pokisham regarding "${getSubjectLabel(selectedMessage.subject)}".\n\n`;
    const signature = `\n\nBest regards,\nPokisham Team`;
    setWhatsAppMessage(greeting + signature);
    setShowWhatsAppModal(true);
  };

  const handleSendWhatsApp = async () => {
    if (!whatsAppMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    // Format phone number (remove non-digits)
    const phoneNumber = selectedMessage.phone.replace(/[^0-9]/g, '');

    // Open WhatsApp with the composed message
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(whatsAppMessage)}`;
    window.open(whatsappUrl, '_blank');

    // Update status to replied
    try {
      await handleUpdateStatus(selectedMessage._id, 'replied');
      setShowWhatsAppModal(false);
      setWhatsAppMessage('');
      toast.success('WhatsApp opened! Message status updated.');
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    try {
      setSendingReply(true);
      const { data } = await API.post(`/contact/${selectedMessage._id}/reply`, {
        replyMessage: replyMessage,
      });

      if (data.success) {
        toast.success('Reply sent successfully!');
        setShowReplyModal(false);
        setReplyMessage('');
        setMessages(prev =>
          prev.map(m => m._id === selectedMessage._id ? data.contact : m)
        );
        setSelectedMessage(data.contact);
        // Refresh unread count
        const countRes = await API.get('/contact/unread-count');
        setUnreadCount(countRes.data.count);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      unread: 'bg-red-100 text-red-700',
      read: 'bg-blue-100 text-blue-700',
      replied: 'bg-green-100 text-green-700',
      archived: 'bg-gray-100 text-gray-700',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getSubjectLabel = (subject) => {
    const labels = {
      general: 'General Inquiry',
      order: 'Order Related',
      product: 'Product Question',
      custom: 'Custom Order',
      feedback: 'Feedback',
      other: 'Other',
    };
    return labels[subject] || subject || 'No Subject';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <DashboardBreadcrumb
        dashboardType="admin"
        items={[{ label: 'Contact Messages' }]}
      />
      <div className="container-custom py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 flex items-center gap-3">
              <FiMessageCircle className="w-8 h-8 text-primary-600" />
              Contact Messages
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-sm px-2.5 py-1 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p className="text-gray-600 mt-1">View and respond to customer messages</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'unread', 'read', 'replied', 'archived'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === 'unread' && unreadCount > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <FiMail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Messages</h3>
            <p className="text-gray-600">
              {statusFilter === 'all'
                ? 'No contact messages yet'
                : `No ${statusFilter} messages`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Messages List */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="divide-y divide-gray-100">
                {messages.map((message) => (
                  <div
                    key={message._id}
                    onClick={() => handleViewMessage(message)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedMessage?._id === message._id
                        ? 'bg-primary-50 border-l-4 border-primary-600'
                        : message.status === 'unread'
                        ? 'bg-yellow-50 hover:bg-yellow-100'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-medium truncate ${
                            message.status === 'unread' ? 'text-gray-900 font-semibold' : 'text-gray-700'
                          }`}>
                            {message.name}
                          </h3>
                          {getStatusBadge(message.status)}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{message.email}</p>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{message.message}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <FiClock className="w-3 h-3" />
                            {formatDate(message.createdAt)}
                          </span>
                          {message.subject && (
                            <span className="bg-gray-100 px-2 py-0.5 rounded">
                              {getSubjectLabel(message.subject)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.pages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.pages}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Message Detail */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {selectedMessage ? (
                <div className="h-full flex flex-col">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-700 font-semibold">
                          {selectedMessage.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedMessage.name}</h3>
                        <p className="text-sm text-gray-600">{selectedMessage.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-4">
                      {/* Contact Info */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        {selectedMessage.phone && (
                          <a
                            href={`tel:${selectedMessage.phone}`}
                            className="flex items-center gap-1.5 text-gray-600 hover:text-primary-600"
                          >
                            <FiPhone className="w-4 h-4" />
                            {selectedMessage.phone}
                          </a>
                        )}
                        <span className="flex items-center gap-1.5 text-gray-500">
                          <FiClock className="w-4 h-4" />
                          {formatDate(selectedMessage.createdAt)}
                        </span>
                      </div>

                      {/* Subject */}
                      {selectedMessage.subject && (
                        <div className="bg-gray-50 px-3 py-2 rounded-lg">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Subject:</span> {getSubjectLabel(selectedMessage.subject)}
                          </p>
                        </div>
                      )}

                      {/* Message */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-800 whitespace-pre-wrap">{selectedMessage.message}</p>
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Status:</span>
                        {getStatusBadge(selectedMessage.status)}
                      </div>

                      {/* Replied Info */}
                      {selectedMessage.status === 'replied' && selectedMessage.repliedAt && (
                        <div className="bg-green-50 p-3 rounded-lg text-sm text-green-800">
                          Replied on {formatDate(selectedMessage.repliedAt)}
                          {selectedMessage.repliedBy && ` by ${selectedMessage.repliedBy.name}`}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 border-t border-gray-100">
                    {/* Reply Buttons */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <button
                        onClick={openReplyModal}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <FiMail className="w-4 h-4" />
                        Reply via Email
                      </button>
                      {selectedMessage.phone && (
                        <button
                          onClick={openWhatsAppModal}
                          className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <FaWhatsapp className="w-4 h-4" />
                          Reply via WhatsApp
                        </button>
                      )}
                    </div>
                    {/* Other Actions */}
                    <div className="flex flex-wrap gap-2">
                      {selectedMessage.status !== 'archived' && (
                        <button
                          onClick={() => handleUpdateStatus(selectedMessage._id, 'archived')}
                          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                        >
                          <FiCheck className="w-4 h-4" />
                          Archive
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteMessage(selectedMessage._id)}
                        className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <FiTrash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                  <FiEye className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Message</h3>
                  <p className="text-gray-600">Click on a message to view its details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {showReplyModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FiSend className="w-5 h-5 text-primary-600" />
                    Reply to {selectedMessage.name}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Sending to: {selectedMessage.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowReplyModal(false);
                    setReplyMessage('');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Original Message */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border-l-4 border-gray-300">
                <p className="text-xs text-gray-500 mb-1 font-medium">Original message:</p>
                <p className="text-sm text-gray-700 line-clamp-3">{selectedMessage.message}</p>
              </div>

              {/* Reply Text Area */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Reply
                </label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                  placeholder="Type your reply here..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowReplyModal(false);
                    setReplyMessage('');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={sendingReply}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendReply}
                  disabled={sendingReply || !replyMessage.trim()}
                  className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sendingReply ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <FiSend className="w-4 h-4" />
                      Send Reply
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Reply Modal */}
      {showWhatsAppModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FaWhatsapp className="w-5 h-5 text-green-500" />
                    WhatsApp Reply to {selectedMessage.name}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Sending to: {selectedMessage.phone}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowWhatsAppModal(false);
                    setWhatsAppMessage('');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Original Message */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border-l-4 border-green-500">
                <p className="text-xs text-gray-500 mb-1 font-medium">Original message:</p>
                <p className="text-sm text-gray-700 line-clamp-3">{selectedMessage.message}</p>
              </div>

              {/* WhatsApp Message Text Area */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your WhatsApp Message
                </label>
                <textarea
                  value={whatsAppMessage}
                  onChange={(e) => setWhatsAppMessage(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                  placeholder="Type your WhatsApp message here..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  This will open WhatsApp with your message pre-filled. You can edit before sending.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowWhatsAppModal(false);
                    setWhatsAppMessage('');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendWhatsApp}
                  disabled={!whatsAppMessage.trim()}
                  className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <FaWhatsapp className="w-4 h-4" />
                  Open WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContactMessages;
