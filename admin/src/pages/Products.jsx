import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Upload, Package, AlertTriangle } from 'lucide-react';
import { adminAPI } from '../utils/api';

function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedShop]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsRes, shopsRes] = await Promise.all([
        adminAPI.getProducts(selectedShop),
        adminAPI.getShops(),
      ]);
      setProducts(productsRes.data);
      setShops(shopsRes.data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncProducts = async () => {
    if (!selectedShop && shops.length > 1) {
      alert('Please select a shop to sync');
      return;
    }

    const shopId = selectedShop || shops[0]?.id;
    if (!shopId) return;

    try {
      setSyncing(true);
      await adminAPI.syncProducts(shopId);
      await loadData();
      alert('Products synced successfully!');
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Failed to sync products');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">Manage products and their license pools</p>
        </div>

        <div className="flex gap-3">
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

          <button
            onClick={handleSyncProducts}
            disabled={syncing}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync from Shopify'}
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-500 mb-6">
              Sync products from your Shopify store to get started
            </p>
            <button onClick={handleSyncProducts} className="btn-primary">
              Sync Products
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Shop</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Total Licenses</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Available</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const availableCount = product.available_licenses || 0;
                  const totalCount = product.total_licenses || 0;
                  const isLow = availableCount < 10 && totalCount > 0;

                  return (
                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{product.product_name}</p>
                          <p className="text-sm text-gray-500">ID: {product.shopify_product_id}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">{product.shop_domain}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-medium text-gray-900">{totalCount}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isLow && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                          <span className={`font-medium ${isLow ? 'text-yellow-600' : 'text-green-600'}`}>
                            {availableCount}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => navigate(`/products/${product.id}/licenses`)}
                          className="btn-secondary text-sm"
                        >
                          <Upload className="w-4 h-4 inline mr-1" />
                          Manage Licenses
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

export default Products;