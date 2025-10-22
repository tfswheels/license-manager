// admin/src/components/AppBridgeProvider.jsx
import React, { useMemo } from 'react';
import { Provider as AppBridgeProvider } from '@shopify/app-bridge-react';
import { useLocation } from 'react-router-dom';

/**
 * Shopify App Bridge Provider
 * Wraps the app to enable embedded functionality within Shopify admin
 */
export default function ShopifyAppBridgeProvider({ children }) {
  const location = useLocation();

  // Get API key from environment
  const apiKey = import.meta.env.VITE_SHOPIFY_API_KEY || '';

  // Get shop from URL query params
  const shopOrigin = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const shop = params.get('shop');

    // Ensure shop domain has .myshopify.com suffix
    if (shop && !shop.includes('.myshopify.com')) {
      return `${shop}.myshopify.com`;
    }

    return shop || '';
  }, [location.search]);

  // Get host from URL query params (required for embedded apps)
  const host = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('host') || '';
  }, [location.search]);

  // App Bridge configuration
  const config = useMemo(() => {
    if (!shopOrigin) {
      return null;
    }

    return {
      apiKey,
      host,
      forceRedirect: true
    };
  }, [apiKey, shopOrigin, host]);

  // If we don't have shop param, show installation message
  if (!shopOrigin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">License Manager</h1>
          <p className="text-gray-600 mb-4">
            Please install this app from the Shopify App Store or access it through your Shopify admin.
          </p>
          <a
            href="https://apps.shopify.com"
            className="text-blue-600 hover:underline"
          >
            Visit Shopify App Store
          </a>
        </div>
      </div>
    );
  }

  // If we don't have a valid config, return error
  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h1>
          <p className="text-gray-600">
            Unable to initialize App Bridge. Please check your configuration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppBridgeProvider config={config}>
      {children}
    </AppBridgeProvider>
  );
}
