// admin/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';  // Add this import
import { Package, ShoppingCart, Key, AlertCircle, Mail } from 'lucide-react';
import { adminAPI } from '../utils/api';

function Dashboard() {
  const [shops, setShops] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedShop, setSelectedShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedShop]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const shopsRes = await adminAPI.getShops();
      
      if (shopsRes?.data?.shops) {
        setShops(shopsRes.data.shops);

        if (shopsRes.data.shops.length > 0) {
          const targetShopId = selectedShop || shopsRes.data.shops[0].id;
          const statsRes = await adminAPI.getShopStats(targetShopId);
          
          if (statsRes?.data) {
            setStats(statsRes.data);
          }
        }
      } else {
        setShops([]);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard. Please refresh the page.');
      setShops([]);
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={loadData} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!shops || shops.length === 0) {
    return (
      <div className="text-center py-12">
        <Key className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-medium text-gray-900 mb-2">No shops installed</h2>
        <p className="text-gray-500">Install the app on a Shopify store to get started</p>
      </div>
    );
  }

  const isLowStock = (stats?.availableLicenses || 0) < (stats?.totalLicenses || 0) * 0.2;

  const statCards = [
    {
      name: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      name: 'Total Products',
      value: stats?.totalProducts || 0,
      icon: Package,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      name: 'Total Licenses',
      value: stats?.totalLicenses || 0,
      icon: Key,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      name: 'Available Licenses',
      value: stats?.availableLicenses || 0,
      icon: AlertCircle,
      bgColor: isLowStock ? 'bg-red-100' : 'bg-green-100',
      iconColor: isLowStock ? 'text-red-600' : 'text-green-600',
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
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
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
          {shops.map((shop) => (
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
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/products"
            className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 hover:scale-105 transition-all duration-200"
          >
            <Package className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-medium text-gray-900">Manage Products</h3>
            <p className="text-sm text-gray-500 mt-1">Sync and link products to licenses</p>
          </Link>
          
          <Link
            to="/orders"
            className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 hover:scale-105 transition-all duration-200"
          >
            <ShoppingCart className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-medium text-gray-900">View Orders</h3>
            <p className="text-sm text-gray-500 mt-1">Check order history and allocations</p>
          </Link>
          
          <Link
            to="/templates"
            className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 hover:scale-105 transition-all duration-200"
          >
            <Mail className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-medium text-gray-900">Manage Templates</h3>
            <p className="text-sm text-gray-500 mt-1">Create and edit email templates</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;