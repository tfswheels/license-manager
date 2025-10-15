import { useState, useEffect } from 'react';
import { Package, ShoppingCart, Key, AlertCircle, Mail } from 'lucide-react';
import { adminAPI } from '../utils/api';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedShop]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, shopsRes] = await Promise.all([
        adminAPI.getStats(selectedShop),
        adminAPI.getShops(),
      ]);
      setStats(statsRes.data);
      setShops(shopsRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: 'blue',
    },
    {
      name: 'Total Products',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'green',
    },
    {
      name: 'Total Licenses',
      value: stats?.totalLicenses || 0,
      icon: Key,
      color: 'purple',
    },
    {
      name: 'Available Licenses',
      value: stats?.availableLicenses || 0,
      icon: AlertCircle,
      color: stats?.availableLicenses < 50 ? 'red' : 'green',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your license management system</p>
        </div>
        
        {shops.length > 1 && (
          <select
            value={selectedShop || ''}
            onChange={(e) => setSelectedShop(e.target.value || null)}
            className="input w-64"
          >
            <option value="">All Shops</option>
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.shop_domain}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Installed Shops */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Installed Shops</h2>
        <div className="space-y-3">
          {shops.length === 0 ? (
            <p className="text-gray-500">No shops installed yet</p>
          ) : (
            shops.map((shop) => (
              <div
                key={shop.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{shop.shop_domain}</p>
                  <p className="text-sm text-gray-500">
                    Installed: {new Date(shop.installed_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="badge badge-success">Active</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
              href="/products"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 hover:scale-105 transition-all"
            <a>
              <Package className="w-8 h-8 text-primary-600 mb-2" />
              <h3 className="font-medium text-gray-900">Manage Products</h3>
              <p className="text-sm text-gray-500 mt-1">Sync and link products to licenses</p>
            </a>
            
            
              href="/orders"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 hover:scale-105 transition-all"
            <a>
              <ShoppingCart className="w-8 h-8 text-primary-600 mb-2" />
              <h3 className="font-medium text-gray-900">View Orders</h3>
              <p className="text-sm text-gray-500 mt-1">Check order history and allocations</p>
            </a>
            
            
              href="/templates"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 hover:scale-105 transition-all"
            <a>
              <Mail className="w-8 h-8 text-primary-600 mb-2" />
              <h3 className="font-medium text-gray-900">Manage Templates</h3>
              <p className="text-sm text-gray-500 mt-1">Create and edit email templates</p>
            </a>
          </div>
        </div>
    </div>
  );
}

export default Dashboard;