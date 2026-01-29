import { useState, useEffect, useCallback } from 'react';
import { FiX, FiCalendar, FiMapPin, FiUser, FiPhone, FiFileText, FiCheck } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import toast from 'react-hot-toast';

// Confetti poppers component
const ConfettiPoppers = () => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const colors = ['#f43f5e', '#ec4899', '#a855f7', '#6366f1', '#3b82f6', '#14b8a6', '#22c55e', '#eab308', '#f97316', '#ef4444'];
    const shapes = ['circle', 'square', 'triangle'];
    const newParticles = [];

    for (let i = 0; i < 80; i++) {
      newParticles.push({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1.5 + Math.random() * 2,
        size: 6 + Math.random() * 8,
        drift: -50 + Math.random() * 100,
        rotation: Math.random() * 360,
        rotationSpeed: -180 + Math.random() * 360,
      });
    }
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[1]">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            top: '-10px',
            animationDelay: `${p.delay}s`,
            '--duration': `${p.duration}s`,
            '--drift': `${p.drift}px`,
            '--rotation': `${p.rotationSpeed}deg`,
          }}
        >
          {p.shape === 'circle' ? (
            <div
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: '50%',
              }}
            />
          ) : p.shape === 'square' ? (
            <div
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                transform: `rotate(${p.rotation}deg)`,
              }}
            />
          ) : (
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: `${p.size / 2}px solid transparent`,
                borderRight: `${p.size / 2}px solid transparent`,
                borderBottom: `${p.size}px solid ${p.color}`,
                transform: `rotate(${p.rotation}deg)`,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

const BookingModal = ({ product, isOpen, onClose }) => {
  const { user } = useAuth();
  const config = product?.bookingConfig || {};

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    eventDate: '',
    quantity: config.minQuantity || 1,
    city: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  // Prefill from user
  useEffect(() => {
    if (user && isOpen) {
      setFormData((prev) => ({
        ...prev,
        customerName: user.name || '',
        customerPhone: user.phone || '',
      }));
    }
  }, [user, isOpen]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setSuccess(false);
      setOrderNumber('');
      setFormData({
        customerName: user?.name || '',
        customerPhone: user?.phone || '',
        eventDate: '',
        quantity: config.minQuantity || 1,
        city: '',
        notes: '',
      });
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const minDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + (config.leadTimeDays || 2));
    return d.toISOString().split('T')[0];
  };

  const unitPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
  const totalPrice = unitPrice * formData.quantity;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const adjustQuantity = (delta) => {
    const minQty = config.minQuantity || 1;
    const maxQty = config.maxQuantity || 100;
    setFormData((prev) => ({
      ...prev,
      quantity: Math.max(minQty, Math.min(maxQty, prev.quantity + delta)),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post('/orders/booking', {
        productId: product._id,
        ...formData,
      });
      if (data.success) {
        setSuccess(true);
        setOrderNumber(data.order.orderNumber);
        toast.success('Booking placed successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Full-screen confetti behind modal */}
      {success && <ConfettiPoppers />}

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto z-10">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-gray-900">Book Now</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          /* Success State */
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in">
              <FiCheck className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
            <p className="text-gray-600 mb-1">Your booking order number is</p>
            <p className="text-2xl font-bold text-primary-600 mb-4">{orderNumber}</p>
            <p className="text-sm text-gray-500 mb-6">We will contact you shortly to confirm details.</p>
            <button onClick={onClose} className="btn-primary w-full py-3">
              Close
            </button>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Product Info */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <img
                src={product.images?.[0]?.url || '/placeholder.png'}
                alt={product.name}
                className="w-14 h-14 object-cover rounded-lg"
              />
              <div>
                <p className="font-semibold text-gray-900 text-sm">{product.name}</p>
                <p className="text-primary-600 font-bold">₹{unitPrice} per unit</p>
              </div>
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FiUser className="inline w-4 h-4 mr-1" /> Your Name *
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FiPhone className="inline w-4 h-4 mr-1" /> Phone Number *
              </label>
              <input
                type="tel"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleChange}
                required
                pattern="[0-9]{10}"
                title="Please enter a valid 10-digit phone number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Event Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FiCalendar className="inline w-4 h-4 mr-1" /> Event Date *
              </label>
              <input
                type="date"
                name="eventDate"
                value={formData.eventDate}
                onChange={handleChange}
                required
                min={minDate()}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => adjustQuantity(-1)}
                  className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 text-lg"
                >
                  -
                </button>
                <span className="text-lg font-semibold w-12 text-center">{formData.quantity}</span>
                <button
                  type="button"
                  onClick={() => adjustQuantity(1)}
                  className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 text-lg"
                >
                  +
                </button>
                <span className="text-xs text-gray-500">
                  (Min: {config.minQuantity || 1}, Max: {config.maxQuantity || 100})
                </span>
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FiMapPin className="inline w-4 h-4 mr-1" /> City
              </label>
              {config.availableCities && config.availableCities.length > 0 ? (
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select city</option>
                  {config.availableCities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Enter your city"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FiFileText className="inline w-4 h-4 mr-1" /> Special Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                placeholder="Any special requirements..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Total */}
            <div className="bg-primary-50 rounded-lg p-4 flex items-center justify-between">
              <span className="font-medium text-gray-700">Total Amount</span>
              <span className="text-2xl font-bold text-primary-600">₹{totalPrice}</span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Placing Booking...
                </>
              ) : (
                <>
                  <FiCheck className="w-5 h-5" /> Confirm Booking
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
