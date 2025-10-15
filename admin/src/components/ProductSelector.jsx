import { useState, useEffect } from 'react';
import { X, Search, Package, CheckSquare, Square, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { adminAPI } from '../utils/api';

const ITEMS_PER_PAGE = 25;

function ProductSelector({ isOpen, onClose, onProductsAdded, shopId }) {
  const [loading, setLoading] = useState(false);
  const [shopifyProducts, setShopifyProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [existingProductIds, setExistingProductIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [adding, setAdding] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalProductsLoaded, setTotalProductsLoaded] = useState(0);

  useEffect(() => {
    if (isOpen && shopId) {
      loadProducts();
      loadExistingProducts();
    }
  }, [isOpen, shopId]);

  useEffect(() => {
    filterProducts();
    setCurrentPage(1);
  }, [searchQuery, shopifyProducts]);

  const loadExistingProducts = async () => {
    try {
      const response = await adminAPI.getProducts(shopId);
      const existingIds = new Set(response.data.map(p => p.shopify_product_id));
      setExistingProductIds(existingIds);
    } catch (error) {
      console.error('Failed to load existing products:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setShopifyProducts([]);
      setFilteredProducts([]);
      setTotalProductsLoaded(0);
      
      // Load first page immediately
      const firstResponse = await adminAPI.fetchShopifyProducts(shopId);
      const firstBatch = firstResponse.data.products;
      
      setShopifyProducts(firstBatch);
      setFilteredProducts(firstBatch);
      setTotalProductsLoaded(firstBatch.length);
      setLoading(false);

      console.log(`[ProductSelector] Loaded ${firstBatch.length} products initially`);

      // Load remaining pages in background
      if (firstResponse.data.hasMore) {
        setLoadingMore(true);
        await loadRemainingPages(firstResponse.data.nextCursor, firstBatch);
        setLoadingMore(false);
      }

    } catch (error) {
      console.error('Failed to load Shopify products:', error);
      alert('Failed to load products from Shopify');
      setLoading(false);
    }
  };

  const loadRemainingPages = async (initialCursor, initialProducts) => {
    let allProducts = [...initialProducts];
    let cursor = initialCursor;
    let pageCount = 1;

    while (cursor && allProducts.length < 20000) {
      try {
        pageCount++;
        const response = await adminAPI.fetchShopifyProducts(shopId, cursor);
        
        if (response.data.products.length === 0) {
          break;
        }

        const newProducts = response.data.products;
        allProducts = [...allProducts, ...newProducts];
        
        // Update state progressively
        setShopifyProducts([...allProducts]);
        setTotalProductsLoaded(allProducts.length);
        
        // Update filtered products if no search query
        if (!searchQuery.trim()) {
          setFilteredProducts([...allProducts]);
        } else {
          setFilteredProducts(filterProductList(allProducts, searchQuery));
        }

        console.log(`[ProductSelector] Page ${pageCount}: +${newProducts.length} products (total: ${allProducts.length})`);

        cursor = response.data.hasMore ? response.data.nextCursor : null;

      } catch (error) {
        console.error('Error fetching more products:', error);
        break;
      }
    }

    console.log(`[ProductSelector] Finished loading ${allProducts.length} total products`);
  };

  const filterProductList = (products, query) => {
    if (!query.trim()) return products;

    const lowerQuery = query.toLowerCase();
    return products.filter(product => {
      if (product.title.toLowerCase().includes(lowerQuery)) return true;
      if (product.id.toString().includes(lowerQuery)) return true;
      
      return product.variants.some(variant => {
        if (variant.sku && variant.sku.toLowerCase().includes(lowerQuery)) return true;
        if (variant.id.toString().includes(lowerQuery)) return true;
        return false;
      });
    });
  };

  const filterProducts = () => {
    setFilteredProducts(filterProductList(shopifyProducts, searchQuery));
  };

  const isProductAlreadyAdded = (productId) => {
    return existingProductIds.has(productId);
  };

  const toggleProduct = (productId) => {
    if (isProductAlreadyAdded(productId)) return;
    
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const selectAll = () => {
    const newSelected = new Set(selectedProducts);
    currentProducts.forEach(product => {
      if (!isProductAlreadyAdded(product.id)) {
        newSelected.add(product.id);
      }
    });
    setSelectedProducts(newSelected);
  };

  const deselectAll = () => {
    const newSelected = new Set(selectedProducts);
    currentProducts.forEach(product => {
      newSelected.delete(product.id);
    });
    setSelectedProducts(newSelected);
  };

  const handleAddProducts = async () => {
    if (selectedProducts.size === 0) {
      alert('Please select at least one product');
      return;
    }

    try {
      setAdding(true);
      const selectedProductsList = Array.from(selectedProducts);
      await adminAPI.addSelectedProducts(shopId, selectedProductsList);
      alert(`Successfully added ${selectedProducts.size} products!`);
      setSelectedProducts(new Set());
      onProductsAdded();
      onClose();
    } catch (error) {
      console.error('Failed to add products:', error);
      alert('Failed to add products');
    } finally {
      setAdding(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const availableCurrentProducts = currentProducts.filter(p => !isProductAlreadyAdded(p.id));
  const allCurrentPageSelected = availableCurrentProducts.length > 0 && 
    availableCurrentProducts.every(p => selectedProducts.has(p.id));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add Products</h2>
            <p className="text-sm text-gray-500 mt-1">
              Select products to add to your license management system
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by product name, SKU, Shopify ID, or Variant ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          
          {/* Selection Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              {selectedProducts.size} selected
              {availableCurrentProducts.length < currentProducts.length && (
                <span className="ml-2 text-gray-400">
                  ({currentProducts.length - availableCurrentProducts.length} already added)
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={allCurrentPageSelected ? deselectAll : selectAll}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {allCurrentPageSelected ? 'Deselect Page' : 'Select Page'}
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setSelectedProducts(new Set())}
                className="text-sm text-gray-600 hover:text-gray-700 font-medium"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <div className="text-gray-500">Loading products from Shopify...</div>
              </div>
            </div>
          ) : currentProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery ? 'No products match your search' : 'No products found'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentProducts.map(product => {
                const isSelected = selectedProducts.has(product.id);
                const isAdded = isProductAlreadyAdded(product.id);
                
                return (
                  <div
                    key={product.id}
                    onClick={() => !isAdded && toggleProduct(product.id)}
                    className={`
                      flex items-center gap-4 p-4 border rounded-lg transition-colors
                      ${isAdded 
                        ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed' 
                        : isSelected 
                          ? 'bg-primary-50 border-primary-300 cursor-pointer hover:bg-primary-100' 
                          : 'border-gray-200 cursor-pointer hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex-shrink-0">
                      {isAdded ? (
                        <CheckCircle className="w-5 h-5 text-gray-400" />
                      ) : isSelected ? (
                        <CheckSquare className="w-5 h-5 text-primary-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    
                    {product.image && (
                      <img 
                        src={product.image} 
                        alt={product.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 truncate">
                          {product.title}
                        </h3>
                        {isAdded && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            Already Added
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">ID: {product.id}</p>
                      {product.variants.length > 0 && product.variants[0].sku && (
                        <p className="text-sm text-gray-400">SKU: {product.variants[0].sku}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredProducts.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.toLocaleString()} products
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleAddProducts}
            disabled={selectedProducts.size === 0 || adding}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adding ? 'Adding...' : `Add ${selectedProducts.size} Product${selectedProducts.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductSelector;