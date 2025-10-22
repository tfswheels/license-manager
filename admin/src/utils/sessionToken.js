// admin/src/utils/sessionToken.js
import { getSessionToken } from '@shopify/app-bridge/utilities';

/**
 * Get session token from Shopify App Bridge
 * This token is used to authenticate API requests for embedded apps
 */
export async function getShopifySessionToken(app) {
  if (!app) {
    console.warn('App Bridge instance not available');
    return null;
  }

  try {
    const token = await getSessionToken(app);
    return token;
  } catch (error) {
    console.error('Error getting session token:', error);
    return null;
  }
}

/**
 * Create authenticated axios config with session token
 */
export async function getAuthenticatedConfig(app) {
  const token = await getShopifySessionToken(app);

  if (!token) {
    return {};
  }

  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
}
