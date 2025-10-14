import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload, Package, AlertTriangle, Trash2, CheckSquare, Square, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminAPI } from '../utils/api';
import ProductSelector from '../components/ProductSelector';


function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSelector, setShowSelector] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  
  // Pagination & Bulk Selection
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedProducts, setSelectedProducts] = useState(new Set());

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
      
      // Auto-select shop if only one exists
      if (!selectedShop && shopsRes.data.length === 1) {
        setSelectedShop(shopsRes.data[0].id);
      }
      
      // Reset selection when data reloads
      setSelectedProducts(new Set());
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };



  const handleOpenSelector = () => {
    if (!selectedShop && shops.length > 1) {
      alert('Please select a shop first');
      return;
    }
    const shopId = selectedShop || shops[0]?.id;
    if (!shopId) {
      alert('No shop available');
      return;
    }
    setShowSelector(true);
  };

  const toggleProduct = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === currentPageProducts.length) {
      // Deselect all on current page
      const newSelected = new Set(selectedProducts);
      currentPageProducts.forEach(p => newSelected.delete(p.id));
      setSelectedProducts(newSelected);
    } else {
      // Select all on current page
      const newSelected = new Set(selectedProducts);
      currentPageProducts.forEach(p => newSelected.add(p.id));
      setSelectedProducts(newSelected);
    }
  };

  const handleDeleteClick = (product) => {
    setDeleteConfirm({
      productIds: [product.id],
      productNames: [product.product_name],
      totalLicenses: product.total_licenses || 0
    });
  };

  const handleBulkDeleteClick = () => {
    if (selectedProducts.size === 0) {
      alert('Please select at least one product to delete');
      return;
    }

    const selectedProductsArray = products.filter(p => selectedProducts.has(p.id));
    const totalLicenses = selectedProductsArray.reduce((sum, p) => sum + (p.total_licenses || 0), 0);

    setDeleteConfirm({
      productIds: Array.from(selectedProducts),
      productNames: selectedProductsArray.map(p => p.product_name),
      totalLicenses
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    try {
      // Delete each product
      for (const productId of deleteConfirm.productIds) {
        await adminAPI.deleteProduct(productId);
      }

      const count = deleteConfirm.productIds.length;
      alert(`${count} product${count !== 1 ? 's' : ''} deleted from the app`);
      
      setDeleteConfirm(null);
      setSelectedProducts(new Set());
      await loadData();
    } catch (error) {
      console.error('Failed to delete products:', error);
      alert('Failed to delete products');
    }
  };

  // Pagination
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageProducts = products.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  const allCurrentPageSelected = currentPageProducts.length > 0 && 
    currentPageProducts.every(p => selectedProducts.has(p.id));

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
            onClick={handleOpenSelector}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Products
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedProducts.size > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-900">
              {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedProducts(new Set())}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Deselect All
            </button>
            <button
              onClick={handleBulkDeleteClick}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete {selectedProducts.size} Product{selectedProducts.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="card">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-500 mb-6">
              Add products from your Shopify store to get started
            </p>
            <button onClick={handleOpenSelector} className="btn-primary">
              <Plus className="w-4 h-4 inline mr-2" />
              Add Products
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 w-12">
                      <button
                        onClick={toggleSelectAll}
                        className="hover:bg-gray-100 rounded p-1"
                      >
                        {allCurrentPageSelected ? (
                          <CheckSquare className="w-5 h-5 text-primary-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Product</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Shop</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Total Licenses</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Available</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPageProducts.map((product) => {
                    const availableCount = product.available_licenses || 0;
                    const totalCount = product.total_licenses || 0;
                    const isLow = availableCount < 10 && totalCount > 0;
                    const isSelected = selectedProducts.has(product.id);

                    return (
                      <tr 
                        key={product.id} 
                        className={`border-b border-gray-100 hover:bg-gray-50 ${isSelected ? 'bg-primary-50' : ''}`}
                      >
                        <td className="py-4 px-4">
                          <button
                            onClick={() => toggleProduct(product.id)}
                            className="hover:bg-gray-100 rounded p-1"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-primary-600" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </td>
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
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/products/${product.id}/licenses`)}
                              className="btn-secondary text-sm"
                            >
                              <Upload className="w-4 h-4 inline mr-1" />
                              Manage Licenses
                            </button>
                            <button
                              onClick={() => handleDeleteClick(product)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete product from app"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Showing {startIndex + 1}-{Math.min(endIndex, products.length)} of {products.length}
                </span>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Show:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={250}>250</option>
                  </select>
                  <span className="text-sm text-gray-600">per page</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Product Selector Modal */}
      <ProductSelector
        isOpen={showSelector}
        onClose={() => setShowSelector(false)}
        onProductsAdded={loadData}
        shopId={selectedShop || shops[0]?.id}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Delete {deleteConfirm.productIds.length} Product{deleteConfirm.productIds.length !== 1 ? 's' : ''} from App?
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Are you sure you want to remove{' '}
                  {deleteConfirm.productIds.length === 1 ? (
                    <strong>"{deleteConfirm.productNames[0]}"</strong>
                  ) : (
                    <strong>{deleteConfirm.productIds.length} products</strong>
                  )}{' '}
                  from the license manager?
                </p>
                {deleteConfirm.totalLicenses > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
                    <p className="text-sm text-red-800">
                      <strong>Warning:</strong> This will also delete{' '}
                      <strong>{deleteConfirm.totalLicenses} license{deleteConfirm.totalLicenses !== 1 ? 's' : ''}</strong>{' '}
                      associated with {deleteConfirm.productIds.length === 1 ? 'this product' : 'these products'}.
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Note: This only removes products from the License Manager app. 
                  Products will remain in your Shopify store.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="btn-danger"
              >
                Delete {deleteConfirm.productIds.length} Product{deleteConfirm.productIds.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;