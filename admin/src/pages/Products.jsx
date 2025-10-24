import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload, Send, Package, AlertTriangle, Trash2, CheckSquare, Square, ChevronLeft, ChevronRight, Mail, Search, X } from 'lucide-react';
import { adminAPI } from '../utils/api';
import { getCurrentShopId } from '../utils/shopUtils';
import ProductSelector from '../components/ProductSelector';
import ManualSendModal from '../components/ManualSendModal';

function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [shopId, setShopId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSelector, setShowSelector] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [bulkTemplateModal, setBulkTemplateModal] = useState(false);
  const [bulkTemplateId, setBulkTemplateId] = useState('');
  const [showManualSend, setShowManualSend] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination & Bulk Selection
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedProducts, setSelectedProducts] = useState(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get current shop ID from URL/session
      const currentShopId = await getCurrentShopId();
      if (!currentShopId) {
        console.error('No shop ID found');
        setLoading(false);
        return;
      }

      setShopId(currentShopId);

      const [productsRes, templatesRes] = await Promise.all([
        adminAPI.getProducts(currentShopId),
        adminAPI.getTemplates(currentShopId),
      ]);

      setProducts(productsRes.data);
      setTemplates(templatesRes.data);

      // Reset selection when data reloads
      setSelectedProducts(new Set());
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSelector = () => {
    if (!shopId) {
      alert('No shop available. Please reload the app.');
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

  // Handle individual product template change
  const handleTemplateChange = async (productId, templateId) => {
    try {
      await adminAPI.assignProductTemplate(productId, templateId || null);
      await loadData(); // Reload to get updated data
    } catch (error) {
      console.error('Failed to assign template:', error);
      alert('Failed to assign template');
    }
  };

  const handleManualSend = (product) => {
    setSelectedProduct(product);
    setShowManualSend(true);
};

  const handleManualSendSuccess = (data) => {
    // Refresh products to update available license count
    loadData();
};

  // Handle bulk template assignment
  const handleBulkTemplateAssign = () => {
    if (selectedProducts.size === 0) {
      alert('Please select at least one product');
      return;
    }
    setBulkTemplateModal(true);
  };

  const confirmBulkTemplateAssign = async () => {
    if (!bulkTemplateId && bulkTemplateId !== '') {
      alert('Please select a template');
      return;
    }

    try {
      const productIds = Array.from(selectedProducts);
      await adminAPI.bulkAssignTemplate(productIds, bulkTemplateId || null);
      
      alert(`Template assigned to ${productIds.length} product${productIds.length !== 1 ? 's' : ''}`);
      setBulkTemplateModal(false);
      setBulkTemplateId('');
      setSelectedProducts(new Set());
      await loadData();
    } catch (error) {
      console.error('Failed to bulk assign template:', error);
      alert('Failed to assign template to products');
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

  // Get template name for display
  const getTemplateName = (product) => {
    if (!product.email_template_id) {
      const defaultTemplate = templates.find(t => t.is_default);
      return defaultTemplate ? `${defaultTemplate.template_name} (Default)` : 'Default';
    }
    
    const template = templates.find(t => t.id === product.email_template_id);
    return template ? template.template_name : 'Unknown';
  };

  // Search filtering
  const filteredProducts = products.filter(product => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      product.product_name?.toLowerCase().includes(query) ||
      product.shopify_product_id?.toString().includes(query) ||
      product.vendor?.toLowerCase().includes(query)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageProducts = filteredProducts.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
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
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">Manage products and their license pools</p>
        </div>

        <div className="button-group flex gap-3">
          <button
            onClick={handleOpenSelector}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Products
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search products by name, ID, or vendor..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1); // Reset to first page on search
          }}
          className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setCurrentPage(1);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedProducts.size > 0 && (
        <div className="bulk-actions-bar bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-900">
              {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleBulkTemplateAssign}
              className="btn-secondary flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Assign Template
            </button>
            <button
              onClick={handleBulkDeleteClick}
              className="btn-danger flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      {products.length === 0 ? (
        <div className="text-center py-12 bg-white border-2 border-dashed border-gray-300 rounded-lg">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
          <p className="text-gray-500 mb-6">Add products from your Shopify store to get started</p>
          <button
            onClick={handleOpenSelector}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Products
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="responsive-table bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-12 py-3 px-4">
                    <button
                      onClick={toggleSelectAll}
                      className="hover:bg-gray-200 rounded p-1"
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
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Price</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Email Template</th>
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
                  const defaultTemplate = templates.find(t => t.is_default);

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
                        <div className="font-medium text-gray-900">{product.product_name}</div>
                        <div className="text-sm text-gray-500">ID: {product.shopify_product_id}</div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {product.shop_domain || 'Unknown'}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-medium text-gray-900">
                          ${product.price ? parseFloat(product.price).toFixed(2) : '0.00'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={product.email_template_id || ''}
                          onChange={(e) => handleTemplateChange(product.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="">
                            {defaultTemplate ? `${defaultTemplate.template_name} (Default)` : 'Default Template'}
                          </option>
                          {templates
                            .filter(t => !t.is_default)
                            .map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.template_name}
                              </option>
                            ))}
                        </select>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-medium text-gray-900">{totalCount}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isLow && totalCount > 0 && (
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          )}
                          <span className={`font-medium ${isLow ? 'text-yellow-600' : 'text-green-600'}`}>
                            {availableCount}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* NEW: Send License Button */}
                        <button
                          onClick={() => handleManualSend(product)}
                          className="btn-secondary text-sm"
                          title="Send license to customer"
                        >
                          <Send className="w-4 h-4 inline mr-1" />
                          Send
                        </button>

                        {/* Existing: Manage Licenses Button */}
                        <button
                          onClick={() => navigate(`/products/${product.id}/licenses`)}
                          className="btn-secondary text-sm"
                        >
                          <Upload className="w-4 h-4 inline mr-1" />
                          Manage Licenses
                        </button>

                        {/* Existing: Delete Button */}
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

          {/* Mobile Card View */}
          <div className="card-view">
            {currentPageProducts.map((product) => {
              const availableCount = product.available_licenses || 0;
              const totalCount = product.total_licenses || 0;
              const isLow = availableCount < 10 && totalCount > 0;
              const isSelected = selectedProducts.has(product.id);
              const defaultTemplate = templates.find(t => t.is_default);

              return (
                <div key={product.id} className={`product-card ${isSelected ? 'bg-primary-50' : ''}`}>
                  <div className="card-header">
                    <div className="flex-1">
                      <div className="card-title">{product.product_name}</div>
                      <div className="card-subtitle">ID: {product.shopify_product_id}</div>
                    </div>
                    <button
                      onClick={() => toggleProduct(product.id)}
                      className="card-checkbox"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-primary-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>

                  <div className="card-body">
                    <div className="card-field">
                      <div className="card-label">Shop</div>
                      <div className="card-value">{product.shop_domain || 'Unknown'}</div>
                    </div>
                    <div className="card-field">
                      <div className="card-label">Price</div>
                      <div className="card-value">${product.price ? parseFloat(product.price).toFixed(2) : '0.00'}</div>
                    </div>
                    <div className="card-field">
                      <div className="card-label">Total Licenses</div>
                      <div className="card-value">{totalCount}</div>
                    </div>
                    <div className="card-field">
                      <div className="card-label">Available</div>
                      <div className="card-value">
                        <div className="flex items-center gap-2">
                          {isLow && totalCount > 0 && (
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          )}
                          <span className={isLow ? 'text-yellow-600' : 'text-green-600'}>
                            {availableCount}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="card-field" style={{ gridColumn: '1 / -1' }}>
                      <div className="card-label">Email Template</div>
                      <select
                        value={product.email_template_id || ''}
                        onChange={(e) => handleTemplateChange(product.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full"
                      >
                        <option value="">
                          {defaultTemplate ? `${defaultTemplate.template_name} (Default)` : 'Default Template'}
                        </option>
                        {templates
                          .filter(t => !t.is_default)
                          .map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.template_name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="card-actions">
                    <button
                      onClick={() => handleManualSend(product)}
                      className="btn-secondary"
                    >
                      <Send className="w-4 h-4 inline mr-1" />
                      Send
                    </button>
                    <button
                      onClick={() => navigate(`/products/${product.id}/licenses`)}
                      className="btn-secondary"
                    >
                      <Upload className="w-4 h-4 inline mr-1" />
                      Manage
                    </button>
                    <button
                      onClick={() => handleDeleteClick(product)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <div className="pagination-controls flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white rounded-b-lg">
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

      {/* Product Selector Modal */}
      <ProductSelector
        isOpen={showSelector}
        onClose={() => setShowSelector(false)}
        onProductsAdded={loadData}
        shopId={shopId}
      />

      {/* Bulk Template Assignment Modal */}
      {bulkTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Assign Template to Products
            </h3>
            
            <p className="text-gray-600 mb-4">
              Select a template to assign to {selectedProducts.size} selected product{selectedProducts.size !== 1 ? 's' : ''}.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Template
              </label>
              <select
                value={bulkTemplateId}
                onChange={(e) => setBulkTemplateId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">
                  {templates.find(t => t.is_default)?.template_name || 'Default'} (Default)
                </option>
                {templates
                  .filter(t => !t.is_default)
                  .map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.template_name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setBulkTemplateModal(false);
                  setBulkTemplateId('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkTemplateAssign}
                className="btn-primary"
              >
                Assign Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Send Modal */}
        {showManualSend && selectedProduct && (
          <ManualSendModal
            isOpen={showManualSend}
            onClose={() => setShowManualSend(false)}
            product={selectedProduct}
            onSuccess={handleManualSendSuccess}
          />
        )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Confirm Deletion
            </h3>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Are you sure you want to delete {deleteConfirm.productIds.length === 1 ? 'this product' : `these ${deleteConfirm.productIds.length} products`}?
              </p>
              
              {deleteConfirm.totalLicenses > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                  <p className="text-sm text-yellow-800">
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