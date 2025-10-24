// admin/src/components/AppBridgeProvider.jsx
import React, { useMemo, useEffect } from 'react';
import { Provider as AppBridgeProvider, useAppBridge } from '@shopify/app-bridge-react';
import { useLocation } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import { setAppBridgeInstance } from '../utils/api';

/**
 * Shopify App Bridge Provider
 * Wraps the app to enable embedded functionality within Shopify admin
 */
export default function ShopifyAppBridgeProvider({ children }) {
  const location = useLocation();

  // Get API key from environment
  const apiKey = import.meta.env.VITE_SHOPIFY_API_KEY || '';

  // Get shop from URL query params or sessionStorage
  const shopOrigin = useMemo(() => {
    const params = new URLSearchParams(location.search);
    let shop = params.get('shop');

    // If not in URL, try sessionStorage
    if (!shop) {
      shop = sessionStorage.getItem('shopify_shop');
    }

    // Ensure shop domain has .myshopify.com suffix
    if (shop && !shop.includes('.myshopify.com')) {
      shop = `${shop}.myshopify.com`;
    }

    return shop || '';
  }, [location.search]);

  // Get host from URL query params or sessionStorage (required for embedded apps)
  const host = useMemo(() => {
    const params = new URLSearchParams(location.search);
    let hostParam = params.get('host');

    // If not in URL, try sessionStorage
    if (!hostParam) {
      hostParam = sessionStorage.getItem('shopify_host');
    }

    return hostParam || '';
  }, [location.search]);

  // Store shop and host in sessionStorage when they're available
  useEffect(() => {
    if (shopOrigin) {
      sessionStorage.setItem('shopify_shop', shopOrigin);
    }
    if (host) {
      sessionStorage.setItem('shopify_host', host);
    }
  }, [shopOrigin, host]);

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

  // If we don't have shop param, show marketing landing page
  if (!shopOrigin) {
    return <LandingPage />;
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
      <AppBridgeInitializer>
        {children}
      </AppBridgeInitializer>
    </AppBridgeProvider>
  );
}

/**
 * Internal component to initialize App Bridge instance
 * Must be inside AppBridgeProvider to access the app instance
 */
function AppBridgeInitializer({ children }) {
  const app = useAppBridge();

  useEffect(() => {
    if (app) {
      // Register App Bridge instance with API client for session tokens
      setAppBridgeInstance(app);
    }
  }, [app]);

  return children;
}
