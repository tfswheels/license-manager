import axios from 'axios';

// Use VITE_API_URL environment variable, fallback to localhost for development
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Store App Bridge instance globally
let appBridgeInstance = null;

// Session token cache to avoid fetching on every request
let cachedSessionToken = null;
let tokenFetchedAt = 0;
const TOKEN_CACHE_DURATION = 4 * 60 * 1000; // 4 minutes (tokens last ~5 min)

// Function to set the App Bridge instance
export function setAppBridgeInstance(app) {
  appBridgeInstance = app;
  console.log('App Bridge instance set for API client');
}

// Get session token from App Bridge (v4) with caching
async function getSessionToken(shopify) {
  if (!shopify) {
    return null;
  }

  // Check if we have a valid cached token
  const now = Date.now();
  if (cachedSessionToken && (now - tokenFetchedAt) < TOKEN_CACHE_DURATION) {
    return cachedSessionToken;
  }

  try {
    // In App Bridge v4, the shopify global provides idToken() method
    if (typeof shopify.idToken === 'function') {
      const token = await shopify.idToken();
      if (token) {
        cachedSessionToken = token;
        tokenFetchedAt = now;
      }
      return token;
    }

    console.error('shopify.idToken() method not found');
    return null;
  } catch (error) {
    console.error('Error getting session token:', error);
    return null;
  }
}

// Request interceptor to add session token
api.interceptors.request.use(
  async (config) => {
    // Try to get session token if App Bridge is available
    if (appBridgeInstance) {
      try {
        const sessionToken = await getSessionToken(appBridgeInstance);
        if (sessionToken) {
          config.headers.Authorization = `Bearer ${sessionToken}`;
        }
      } catch (error) {
        console.warn('Could not get session token:', error.message);
        // Continue without token for non-embedded contexts
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
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
  fetchShopifyProducts: (shopId, cursor = null) => {
    const params = cursor ? { cursor } : {};
    return api.get(`/api/admin/shops/${shopId}/shopify-products`, { params });
  },
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
  bulkDeleteLicenses: (licenseIds) => api.post('/api/admin/licenses/bulk-delete', { licenseIds }),
  bulkReleaseLicenses: (licenseIds) => api.post('/api/admin/licenses/bulk-release', { licenseIds }),

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

  // Template Assignment Rules
  getTemplateRules: (shopId) => api.get(`/api/admin/shops/${shopId}/template-rules`),
  createTemplateRule: (shopId, ruleData) =>
    api.post(`/api/admin/shops/${shopId}/template-rules`, ruleData),
  updateTemplateRule: (shopId, ruleId, updates) =>
    api.put(`/api/admin/shops/${shopId}/template-rules/${ruleId}`, updates),
  deleteTemplateRule: (shopId, ruleId) =>
    api.delete(`/api/admin/shops/${shopId}/template-rules/${ruleId}`),
  applyTemplateRules: (shopId) =>
    api.post(`/api/admin/shops/${shopId}/template-rules/apply`),
  getExclusionTag: (shopId) =>
    api.get(`/api/admin/shops/${shopId}/template-rules/exclusion-tag`),
  setExclusionTag: (shopId, tag) =>
    api.put(`/api/admin/shops/${shopId}/template-rules/exclusion-tag`, { tag }),

  // Orders
  getOrders: (shopId = null, limit = 100) =>
    api.get('/api/admin/orders', { params: { shopId, limit } }),
  getOrderDetails: (orderId) => api.get(`/api/admin/orders/${orderId}`),
  manualAllocate: (orderId) => api.post(`/api/admin/orders/${orderId}/allocate`),
  updateOrderEmail: (orderId, newEmail) =>
    api.put(`/api/admin/orders/${orderId}/email`, { email: newEmail }),
  resendOrderEmail: (orderId) =>
    api.post(`/api/admin/orders/${orderId}/resend`),
  manualSendLicense: (data) =>
    api.post('/api/admin/orders/manual-send', data),

  // Stats
  getStats: (shopId = null) => api.get('/api/admin/stats', { params: { shopId } }),
  getUsageStats: (shopId) => api.get(`/api/admin/usage/${shopId}`),

  // Settings
  getShopSettings: (shopId) => api.get(`/api/admin/shops/${shopId}/settings`),
  updateShopSettings: (shopId, settings) =>
    api.put(`/api/admin/shops/${shopId}/settings`, settings),
  resetShopSettings: (shopId) =>
    api.post(`/api/admin/shops/${shopId}/settings/reset`),

  // Support
  sendSupportMessage: (data) => api.post('/api/admin/support/send', data),
};

export default api;
