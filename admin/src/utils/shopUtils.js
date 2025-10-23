import { adminAPI } from './api';

/**
 * Get current shop ID from URL params or sessionStorage
 * @returns {Promise<number|null>} Shop ID or null if not found
 */
export async function getCurrentShopId() {
  try {
    // First, try to get shop domain from URL params
    const params = new URLSearchParams(window.location.search);
    let shopDomain = params.get('shop');

    // If not in URL, try sessionStorage (set by AppBridgeProvider)
    if (!shopDomain) {
      shopDomain = sessionStorage.getItem('shopify_shop');
    }

    if (!shopDomain) {
      console.warn('No shop domain found in URL or sessionStorage');
      return null;
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
      // Cache the shop ID in localStorage for quick access
      localStorage.setItem('currentShopId', currentShop.id.toString());
      console.log(`✅ Current shop: ${shopDomain} (ID: ${currentShop.id})`);
      return currentShop.id;
    }

    console.warn(`Shop ${shopDomain} not found in database`);
    return null;
  } catch (error) {
    console.error('Error getting current shop ID:', error);
    return null;
  }
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
