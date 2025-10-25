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
    // Try various methods to get session token based on App Bridge version

    // Method 1: idToken() method (App Bridge v4)
    if (typeof app.idToken === 'function') {
      const token = await app.idToken();
      return token;
    }

    // Method 2: getSessionToken method
    if (typeof app.getSessionToken === 'function') {
      const token = await app.getSessionToken();
      return token;
    }

    // Method 3: sessionToken property
    if (app.sessionToken) {
      return app.sessionToken;
    }

    console.warn('No session token method found on App Bridge instance');
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
