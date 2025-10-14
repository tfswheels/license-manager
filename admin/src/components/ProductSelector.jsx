import { useState, useEffect } from 'react';
import { X, Search, Package, CheckSquare, Square, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminAPI } from '../utils/api';

const ITEMS_PER_PAGE = 25;

function ProductSelector({ isOpen, onClose, onProductsAdded, shopId }) {
  const [loading, setLoading] = useState(false);
  const [shopifyProducts, setShopifyProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [adding, setAdding] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (isOpen && shopId) {
      loadAllProducts();
    }
  }, [isOpen, shopId]);

  useEffect(() => {
    filterProducts();
    setCurrentPage(1); // Reset to first page on search
  }, [searchQuery, shopifyProducts]);

  const loadAllProducts = async () => {
    try {
      setLoading(true);
      
      // Fetch first batch immediately
      const firstResponse = await adminAPI.fetchShopifyProducts(shopId);
      const firstBatch = firstResponse.data.products;
      
      setShopifyProducts(firstBatch);
      setFilteredProducts(firstBatch);
      setLoading(false);

      // Continue fetching remaining products in background
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

    // Continue fetching until we have all products
    while (hasMore && allProducts.length < 10000) {
      try {
        pageCount++;
        
        // Fetch next batch using GraphQL cursor
        // Note: We'll need to update the API to accept cursor parameter
        const response = await adminAPI.fetchShopifyProductsPage(shopId, pageCount);
        
        if (response.data.products.length === 0) {
          hasMore = false;
          break;
        }

        // Append new products
        allProducts = [...allProducts, ...response.data.products];
        
        // Update state progressively so user sees products appear
        setShopifyProducts([...allProducts]);
        setFilteredProducts(prev => {
          // If searching, refilter with new products
          if (searchQuery.trim()) {
            return filterProductList(allProducts, searchQuery);
          }
          return [...allProducts];
        });

        console.log(`[Product Fetch] Loaded ${allProducts.length} products (page ${pageCount})`);

        hasMore = response.data.hasMore;

      } catch (error) {
        console.error('Error fetching more products:', error);
        hasMore = false;
      }
    }

    console.log(`[Product Fetch] Complete! Total: ${allProducts.length} products`);
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

  const toggleProduct = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const selectAll = () => {
    const allIds = filteredProducts.map(p => p.id);
    setSelectedProducts(new Set(allIds));
  };

  const deselectAll = () => {
    setSelectedProducts(new Set());
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
            </div>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Select All
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={deselectAll}
                className="text-sm text-gray-600 hover:text-gray-700 font-medium"
              >
                Deselect All
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
                return (
                  <div
                    key={product.id}
                    onClick={() => toggleProduct(product.id)}
                    className={`
                      flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${isSelected 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    {/* Checkbox */}
                    <div className="mt-1">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-primary-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    {/* Product Image */}
                    <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {product.title}
                      </h3>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>Shopify ID: {product.id}</p>
                        {product.variants.length > 0 && (
                          <p>
                            Variants: {product.variants.length}
                            {product.variants[0].sku && ` • SKU: ${product.variants[0].sku}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length}
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