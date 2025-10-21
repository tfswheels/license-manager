import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, AlertCircle, CheckCircle, RefreshCw, X, Send } from 'lucide-react';
import { adminAPI } from '../utils/api';

function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);
  
  // Email editing state
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editedEmail, setEditedEmail] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    loadData();
  }, [orderId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getOrderDetails(orderId);
      setOrder(response.data.order);
      setItems(response.data.items);
      setEditedEmail(response.data.order.customer_email);
    } catch (error) {
      console.error('Failed to load order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualAllocate = async () => {
    if (!confirm('Attempt to allocate licenses for this order?')) return;

    try {
      setAllocating(true);
      await adminAPI.manualAllocate(orderId);
      alert('Licenses allocated successfully!');
      await loadData();
    } catch (error) {
      console.error('Allocation failed:', error);
      alert(error.response?.data?.error || 'Failed to allocate licenses');
    } finally {
      setAllocating(false);
    }
  };

  const handleEditEmail = () => {
    setIsEditingEmail(true);
    setEditedEmail(order.customer_email);
  };

  const handleCancelEdit = () => {
    setIsEditingEmail(false);
    setEditedEmail(order.customer_email);
  };

  const handleResendEmail = async () => {
    const emailChanged = editedEmail !== order.customer_email;
    
    if (emailChanged && !editedEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    const action = emailChanged ? 'update email and resend' : 'resend';
    if (!confirm(`Are you sure you want to ${action} the license email?`)) return;

    try {
      setResending(true);

      // Update email if changed
      if (emailChanged) {
        await adminAPI.updateOrderEmail(orderId, editedEmail);
      }

      // Resend email
      await adminAPI.resendOrderEmail(orderId);

      alert('Email sent successfully!');
      setIsEditingEmail(false);
      await loadData();
    } catch (error) {
      console.error('Resend failed:', error);
      alert(error.response?.data?.error || 'Failed to send email');
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading order details...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Order not found</p>
      </div>
    );
  }

  const hasIssues = items.some(item => item.licenses_allocated < item.quantity);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/orders')} className="btn-secondary">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Order #{order.order_number}</h1>
          <p className="text-gray-500 mt-1">{order.shop_domain}</p>
        </div>
        {hasIssues && (
          <button
            onClick={handleManualAllocate}
            disabled={allocating}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${allocating ? 'animate-spin' : ''}`} />
            {allocating ? 'Allocating...' : 'Retry Allocation'}
          </button>
        )}
      </div>

      {/* Status Alert */}
      {hasIssues && (
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-900">Incomplete Allocation</h3>
              <p className="text-sm text-yellow-800 mt-1">
                Some items in this order don't have enough licenses allocated. 
                Upload more licenses and click "Retry Allocation".
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Order Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Customer Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium text-gray-900">
                {order.customer_first_name} {order.customer_last_name}
              </p>
            </div>
            
            {/* Email with Edit Functionality */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Email</p>
              
              {!isEditingEmail ? (
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{order.customer_email}</p>
                  <button
                    onClick={handleEditEmail}
                    className="text-sm text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    (update)
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="email"
                    value={editedEmail}
                    onChange={(e) => setEditedEmail(e.target.value)}
                    className="input w-full"
                    placeholder="customer@example.com"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleResendEmail}
                      disabled={resending}
                      className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                      <Send className={`w-4 h-4 ${resending ? 'animate-pulse' : ''}`} />
                      {resending ? 'Sending...' : 'Resend Email'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={resending}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-600">Order Date</p>
              <p className="font-medium text-gray-900">
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Order Status</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Shopify Order ID</p>
              <p className="font-mono text-sm text-gray-900">{order.shopify_order_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Financial Status</p>
              <span className="badge badge-success">{order.order_status || 'paid'}</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="text-sm text-gray-900">
                {new Date(order.updated_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
        <div className="space-y-6">
          {items.map((item) => {
            const needsLicenses = item.licenses_allocated < item.quantity;
            const hasEmail = item.email_sent;

            return (
              <div key={item.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{item.product_name}</h3>
                    <p className="text-sm text-gray-500">Product ID: {item.shopify_product_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Quantity</p>
                    <p className="text-2xl font-bold text-gray-900">{item.quantity}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Licenses Allocated</p>
                    <div className="flex items-center gap-2">
                      {needsLicenses ? (
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      <span className={`font-medium ${needsLicenses ? 'text-yellow-600' : 'text-green-600'}`}>
                        {item.licenses_allocated} / {item.quantity}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email Status</p>
                    <div className="flex items-center gap-2">
                      {hasEmail ? (
                        <>
                          <Mail className="w-4 h-4 text-green-500" />
                          <span className="text-green-600 font-medium">Sent</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-500">Not Sent</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email Sent At</p>
                    <p className="text-sm text-gray-900">
                      {item.email_sent_at
                        ? new Date(item.email_sent_at).toLocaleString()
                        : '-'}
                    </p>
                  </div>
                </div>

                {/* Allocated Licenses */}
                {item.allocated_licenses && item.allocated_licenses.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Allocated License Keys:</p>
                    <div className="bg-gray-50 rounded p-4 max-h-40 overflow-y-auto">
                      {item.allocated_licenses.map((key, idx) => (
                        <div key={idx} className="font-mono text-sm text-gray-700 mb-1">
                          {key}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {needsLicenses && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong>Action Required:</strong> Only {item.licenses_allocated} of {item.quantity} licenses 
                      allocated. Upload more licenses for this product and retry allocation.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;