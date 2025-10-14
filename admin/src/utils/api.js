import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Admin API
export const adminAPI = {
  // Shops
  getShops: () => api.get('/api/admin/shops'),
  
  // Product Selection
  fetchShopifyProducts: (shopId) => api.get(`/api/admin/shops/${shopId}/shopify-products`),
  addSelectedProducts: (shopId, productIds) => 
    api.post(`/api/admin/shops/${shopId}/add-products`, { productIds }),
  
  // Products
  getProducts: (shopId = null) => api.get('/api/admin/products', { params: { shopId } }),
  deleteProduct: (productId) => api.delete(`/api/admin/products/${productId}`),
  uploadLicenses: (productId, licenses) => 
    api.post(`/api/admin/products/${productId}/licenses/upload`, { licenses }),
  getLicenses: (productId, allocated = null) => 
    api.get(`/api/admin/products/${productId}/licenses`, { params: { allocated } }),
  
  // Licenses
  parseCSV: (csvContent) => api.post('/api/admin/licenses/parse-csv', { csvContent }),
  deleteLicense: (licenseId) => api.delete(`/api/admin/licenses/${licenseId}`),
  releaseLicense: (licenseId) => api.post(`/api/admin/licenses/${licenseId}/release`),

  // Templates
getTemplates: (shopId) => api.get('/api/admin/templates', { params: { shopId } }),
getTemplate: (templateId) => api.get(`/api/admin/templates/${templateId}`),
createTemplate: (data) => api.post('/api/admin/templates', data),
updateTemplate: (templateId, data) => api.put(`/api/admin/templates/${templateId}`, data),
deleteTemplate: (templateId, reassignTemplateId = null) => 
  api.delete(`/api/admin/templates/${templateId}`, { data: { reassignTemplateId } }),
setDefaultTemplate: (templateId) => api.post(`/api/admin/templates/${templateId}/set-default`),
validateTemplate: (emailHtmlTemplate) => 
  api.post('/api/admin/templates/validate', { emailHtmlTemplate }),
getTemplateProducts: (templateId) => api.get(`/api/admin/templates/${templateId}/products`),

// Product Template Assignment
assignProductTemplate: (productId, templateId) => 
  api.put(`/api/admin/products/${productId}/template`, { templateId }),
bulkAssignTemplate: (productIds, templateId) => 
  api.post('/api/admin/products/bulk-assign-template', { productIds, templateId }),
  
  // Orders
  getOrders: (shopId = null, limit = 100) => 
    api.get('/api/admin/orders', { params: { shopId, limit } }),
  getOrderDetails: (orderId) => api.get(`/api/admin/orders/${orderId}`),
  manualAllocate: (orderId) => api.post(`/api/admin/orders/${orderId}/allocate`),
  
  // Stats
  getStats: (shopId = null) => api.get('/api/admin/stats', { params: { shopId } }),
};

export default api;