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

  useEffect(() => {
    if (isOpen && shopId) {
      loadAllProducts();
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

  const loadAllProducts = async () => {
    try {
      setLoading(true);
      
      const firstResponse = await adminAPI.fetchShopifyProducts(shopId);
      const firstBatch = firstResponse.data.products;
      
      setShopifyProducts(firstBatch);
      setFilteredProducts(firstBatch);
      setLoading(false);

      if (firstResponse.data.hasMore) {
        setLoadingMore(true);
        await fetchRemainingProducts(firstBatch);
        setLoadingMore(false);
      }

    } catch (error) {
      console.error('Failed to load Shopify products:', error);
      alert('Failed to load products from Shopify');
      setLoading(false);
    }
  };

  const fetchRemainingProducts = async (initialProducts) => {
    let allProducts = [...initialProducts];
    let hasMore = true;
    let pageCount = 1;

    while (hasMore && allProducts.length < 10000) {
      try {
        pageCount++;
        const response = await adminAPI.fetchShopifyProducts(shopId);
        
        if (response.data.products.length === 0) {
          hasMore = false;
          break;
        }

        allProducts = [...allProducts, ...response.data.products];
        
        setShopifyProducts([...allProducts]);
        setFilteredProducts(prev => {
          if (searchQuery.trim()) {
            return filterProductList(allProducts, searchQuery);
          }
          return [...allProducts];
        });

        hasMore = response.data.hasMore;

      } catch (error) {
        console.error('Error fetching more products:', error);
        hasMore = false;
      }
    }
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

  // FIX: Select only products on CURRENT PAGE that are not already added
  const selectAll = () => {
    const newSelected = new Set(selectedProducts);
    currentProducts.forEach(product => {
      if (!isProductAlreadyAdded(product.id)) {
        newSelected.add(product.id);
      }
    });
    setSelectedProducts(newSelected);
  };

  // FIX: Deselect only products on CURRENT PAGE
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

  // Check if all current page products are selected (excluding already added)
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
              {loadingMore && <span className="ml-2 text-primary-600">(Loading more products...)</span>}
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
              <div className="text-gray-500">Loading products from Shopify...</div>
            </div>
          ) : currentProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Package className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500">
                {searchQuery ? 'No products match your search' : 'No products found'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentProducts.map((product) => {
                const isSelected = selectedProducts.has(product.id);
                const alreadyAdded = isProductAlreadyAdded(product.id);
                
                return (
                  <div
                    key={product.id}
                    onClick={() => toggleProduct(product.id)}
                    className={`
                      flex items-start gap-4 p-4 rounded-lg border-2 transition-all
                      ${alreadyAdded 
                        ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed' 
                        : isSelected 
                          ? 'border-primary-500 bg-primary-50 cursor-pointer' 
                          : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                      }
                    `}
                  >
                    {/* Checkbox or Already Added Icon */}
                    <div className="mt-1">
                      {alreadyAdded ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : isSelected ? (
                        <CheckSquare className="w-5 h-5 text-primary-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    {/* Product Image */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-gray-900">
                          {product.title}
                          {alreadyAdded && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Already Added
                            </span>
                          )}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Shopify ID: {product.id}
                      </p>
                      <p className="text-sm text-gray-500">
                        Variants: {product.variants.length} • SKU: {product.variants[0]?.sku || 'N/A'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} 
                <span className="ml-2 text-gray-400">
                  ({filteredProducts.length} total products)
                </span>
              </div>
              <div className="flex gap-2">
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
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleAddProducts}
            disabled={selectedProducts.size === 0 || adding}
            className="btn-primary"
          >
            {adding ? 'Adding...' : `Add ${selectedProducts.size} Product${selectedProducts.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductSelector;