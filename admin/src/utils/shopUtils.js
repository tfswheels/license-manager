import { adminAPI } from './api';

/**
 * Get current shop ID from URL params or sessionStorage
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<number|null>} Shop ID or null if not found
 */
export async function getCurrentShopId(maxRetries = 3) {
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // First, try to get shop domain from URL params
      const params = new URLSearchParams(window.location.search);
      let shopDomain = params.get('shop');

      // If not in URL, try sessionStorage (set by AppBridgeProvider)
      if (!shopDomain) {
        shopDomain = sessionStorage.getItem('shopify_shop');
      }

      // If still not found, try localStorage as last resort
      if (!shopDomain) {
        shopDomain = localStorage.getItem('shopify_shop');
      }

      if (!shopDomain) {
        console.warn('No shop domain found in URL, sessionStorage, or localStorage');
        return null;
      }

      // Ensure shop domain is stored for future use
      if (shopDomain) {
        sessionStorage.setItem('shopify_shop', shopDomain);
        localStorage.setItem('shopify_shop', shopDomain);
      }

      // Add a small delay on retries to allow App Bridge to initialize
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, attempt * 500));
        console.log(`Retry attempt ${attempt + 1} for shop ${shopDomain}`);
      }

      // Get all shops from API
      const response = await adminAPI.getShops();
      const shops = response.data;

      if (!Array.isArray(shops) || shops.length === 0) {
        console.warn('No shops found in database');
        return null;
      }

      // Find shop by domain
      const currentShop = shops.find(shop => shop.shop_domain === shopDomain);

      if (currentShop) {
        // Cache the shop ID in both storages for reliability
        localStorage.setItem('currentShopId', currentShop.id.toString());
        sessionStorage.setItem('currentShopId', currentShop.id.toString());
        console.log(`✅ Current shop: ${shopDomain} (ID: ${currentShop.id})`);
        return currentShop.id;
      }

      console.warn(`Shop ${shopDomain} not found in database`);
      return null;
    } catch (error) {
      lastError = error;
      console.error(`Error getting current shop ID (attempt ${attempt + 1}/${maxRetries}):`, error);

      // If this is not the last attempt, continue to retry
      if (attempt < maxRetries - 1) {
        continue;
      }
    }
  }

  // If all retries failed, log the last error
  console.error('Failed to get current shop ID after all retries:', lastError);
  return null;
}

/**
 * Get cached shop ID from localStorage (fast, no API call)
 * Use this for immediate UI rendering, but call getCurrentShopId()
 * in useEffect to verify and update if needed
 * @returns {number|null}
 */
export function getCachedShopId() {
  const cached = localStorage.getItem('currentShopId');
  return cached ? parseInt(cached) : null;
}

/**
 * Clear cached shop ID (useful on logout or shop change)
 */
export function clearCachedShopId() {
  localStorage.removeItem('currentShopId');
}
