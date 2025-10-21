// admin/src/components/ManualSendModal.jsx
import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { adminAPI } from '../utils/api';

export default function ManualSendModal({ isOpen, onClose, product, onSuccess }) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    if (quantity < 1) {
      alert('Quantity must be at least 1');
      return;
    }

    try {
      setSending(true);

      const response = await adminAPI.manualSendLicense({
        email,
        productId: product.id,
        quantity,
        firstName: firstName.trim(),
        lastName: lastName.trim()
      });

      alert(`✅ ${response.data.message}\n\nOrder Number: ${response.data.orderNumber}`);
      
      // Reset form
      setEmail('');
      setFirstName('');
      setLastName('');
      setQuantity(1);
      
      onSuccess?.(response.data);
      onClose();

    } catch (error) {
      console.error('Manual send failed:', error);
      alert(error.response?.data?.error || 'Failed to send license');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Send License</h2>
          <button
            onClick={onClose}
            disabled={sending}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900">Product</p>
            <p className="text-sm text-blue-700 mt-1">{product.product_name}</p>
            <p className="text-xs text-blue-600 mt-1">
              {product.available_licenses || 0} licenses available
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              className="input w-full"
              required
              disabled={sending}
            />
          </div>

          {/* Name (Optional) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="input w-full"
                disabled={sending}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="input w-full"
                disabled={sending}
              />
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={product.available_licenses || 1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="input w-full"
              required
              disabled={sending}
            />
          </div>

          {/* Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-600">
              This will create a <strong>FREE order</strong> and send {quantity} license{quantity !== 1 ? 's' : ''} immediately to the customer's email.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Send className={`w-4 h-4 ${sending ? 'animate-pulse' : ''}`} />
              {sending ? 'Sending...' : 'Send License'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}