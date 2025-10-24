import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Eye, AlertCircle, X } from 'lucide-react';
import { adminAPI } from '../utils/api';
import { getCurrentShopId } from '../utils/shopUtils';

function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get current shop ID from URL/session
      const shopId = await getCurrentShopId();
      if (!shopId) {
        console.error('No shop ID found');
        setLoading(false);
        return;
      }

      const ordersRes = await adminAPI.getOrders(shopId);
      setOrders(ordersRes.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search filtering
  const filteredOrders = orders.filter(order => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      order.order_number?.toString().includes(query) ||
      order.shopify_order_id?.toString().includes(query) ||
      order.customer_first_name?.toLowerCase().includes(query) ||
      order.customer_last_name?.toLowerCase().includes(query) ||
      order.customer_email?.toLowerCase().includes(query) ||
      `${order.customer_first_name} ${order.customer_last_name}`.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 mt-1">View order history and license allocations</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search orders by number, customer name, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Orders Table */}
      <div className="card">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500">Orders will appear here once customers make purchases</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">Try adjusting your search query</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Order</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Items</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Licenses</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const hasIssues = order.total_licenses_allocated < order.item_count;
                  
                  return (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium text-gray-900">#{order.order_number}</p>
                            <p className="text-xs text-gray-500">ID: {order.shopify_order_id}</p>
                          </div>
                          {order.order_type === 'manual' && (
                            <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Manual
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-sm text-gray-900">
                            {order.customer_first_name} {order.customer_last_name}
                          </p>
                          <p className="text-xs text-gray-500">{order.customer_email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="badge badge-info">{order.item_count || 0}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {hasIssues && (
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                          )}
                          <span className={`badge ${hasIssues ? 'badge-warning' : 'badge-success'}`}>
                            {order.total_licenses_allocated || 0}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => navigate(`/orders/${order.id}`)}
                          className="btn-secondary text-sm"
                        >
                          <Eye className="w-4 h-4 inline mr-1" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Orders;