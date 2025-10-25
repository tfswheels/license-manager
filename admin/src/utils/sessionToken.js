// admin/src/utils/sessionToken.js

/**
 * Get session token from Shopify App Bridge (v4)
 * This token is used to authenticate API requests for embedded apps
 */
export async function getShopifySessionToken(app) {
  if (!app) {
    console.warn('App Bridge instance not available');
    return null;
  }

  try {
    // In App Bridge v4, use idToken() method
    if (typeof app.idToken === 'function') {
      const token = await app.idToken();
      return token;
    }

    // Fallback: try the global shopify object
    if (window.shopify?.idToken) {
      const token = await window.shopify.idToken();
      return token;
    }

    console.warn('App Bridge idToken method not available');
    return null;
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
