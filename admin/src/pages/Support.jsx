import { useState, useEffect } from 'react';
import { Mail, Send, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { adminAPI } from '../utils/api';
import { getCurrentShopId } from '../utils/shopUtils';

function Support() {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [shopInfo, setShopInfo] = useState(null);

  useEffect(() => {
    loadShopInfo();
  }, []);

  const loadShopInfo = async () => {
    try {
      const shopId = await getCurrentShopId();
      if (shopId) {
        // Get shop info from API if needed
        setShopInfo({ shopId });
      }
    } catch (error) {
      console.error('Failed to load shop info:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.subject) {
      setError('Please select a reason for contacting support');
      return;
    }

    if (!formData.message.trim()) {
      setError('Please enter a message');
      return;
    }

    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const shopId = await getCurrentShopId();

      await adminAPI.sendSupportMessage({
        ...formData,
        shopId
      });

      setSuccess(true);
      setFormData({ subject: '', message: '', email: '' });

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Failed to send support message:', error);
      setError(error.response?.data?.error || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const subjectOptions = [
    { value: 'setup', label: 'Help with setup' },
    { value: 'bug', label: 'Report Issue/Bug' },
    { value: 'feature', label: 'Request new feature' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <HelpCircle className="w-8 h-8 text-blue-600" />
          Support
        </h1>
        <p className="text-gray-500 mt-1">Get help or report an issue with DigiKey HQ</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900 mb-1">Message Sent Successfully!</h3>
            <p className="text-sm text-green-700">
              Thank you for contacting us. We'll get back to you within 24 hours at the email address you provided.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Support Form */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">We'll reply to this email address</p>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What can we help you with? <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              required
            >
              <option value="">Select a reason...</option>
              {subjectOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Please describe your issue or question in detail..."
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Include as much detail as possible to help us assist you better
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Message
                </>
              )}
            </button>
            {!success && (
              <p className="text-sm text-gray-500">
                We typically respond within 24 hours
              </p>
            )}
          </div>
        </form>
      </div>

      {/* Additional Resources */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Need Immediate Assistance?</h3>
            <p className="text-sm text-blue-700">
              You can also email us directly at{' '}
              <a href="mailto:mail@digikeyhq.com" className="underline hover:text-blue-800">
                mail@digikeyhq.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Support;
