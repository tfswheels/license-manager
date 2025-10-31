// admin/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, Key, AlertCircle, Mail } from 'lucide-react';
import { adminAPI } from '../utils/api';
import { getCurrentShopId } from '../utils/shopUtils';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [usageStats, setUsageStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current shop ID from URL/session
      const shopId = await getCurrentShopId();

      if (!shopId) {
        // This should not happen if AppBridgeProvider did its job, but handle gracefully
        console.error('❌ Shop ID not found');
        setError('Unable to load shop information. Please try refreshing the page.');
        return;
      }

      console.log('Loading dashboard data for shop:', shopId);

      try {
        const [statsRes, usageRes] = await Promise.all([
          adminAPI.getStats(shopId),
          adminAPI.getUsageStats(shopId)
        ]);

        console.log('Stats response:', statsRes);
        console.log('Usage response:', usageRes);

        if (statsRes?.data) {
          setStats(statsRes.data);
        }

        if (usageRes?.data) {
          setUsageStats(usageRes.data);
        }
      } catch (statsError) {
        console.error('Stats fetch failed:', statsError);
        // Continue even if stats fail - show zeros
        setStats({
          totalOrders: 0,
          totalProducts: 0,
          totalLicenses: 0,
          availableLicenses: 0
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      console.error('Error details:', error.response || error.message);
      setError(`Failed to load dashboard: ${error.message}`);
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your license management system</p>
        </div>

      {/* Stats Grid */}
      <div className="stats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card stat-card">
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

      {/* Plan & Usage */}
      {usageStats && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Current Plan & Usage</h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {usageStats.plan.name} - ${usageStats.plan.price}/month
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Monthly Orders</span>
                <span className="text-sm text-gray-600">
                  {usageStats.orders.current} / {usageStats.orders.limit === -1 ? 'Unlimited' : usageStats.orders.limit}
                </span>
              </div>

              {usageStats.orders.limit !== -1 && (
                <>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        usageStats.orders.percentage >= 90 ? 'bg-red-600' :
                        usageStats.orders.percentage >= 70 ? 'bg-yellow-500' :
                        'bg-green-600'
                      }`}
                      style={{ width: `${Math.min(usageStats.orders.percentage, 100)}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">
                      {usageStats.orders.remaining} orders remaining this month
                    </span>
                    {usageStats.orders.percentage >= 80 && (
                      <span className="text-xs font-medium text-yellow-600">
                        {usageStats.orders.percentage >= 90 ? 'Limit almost reached!' : 'Approaching limit'}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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
