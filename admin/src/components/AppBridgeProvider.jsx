// admin/src/components/AppBridgeProvider.jsx
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import { setAppBridgeInstance } from '../utils/api';

/**
 * Shopify App Bridge Provider (v4)
 * App Bridge is initialized via the CDN script and meta tag in index.html
 * This component just handles shop detection and sets up the API client
 */
export default function ShopifyAppBridgeProvider({ children }) {
  const location = useLocation();

  // Get shop from URL query params or sessionStorage
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

  // Get host from URL query params or sessionStorage (required for embedded apps)
  let host = params.get('host');
  if (!host) {
    host = sessionStorage.getItem('shopify_host');
  }

  // Store shop and host in sessionStorage when they're available
  useEffect(() => {
    if (shop) {
      sessionStorage.setItem('shopify_shop', shop);
    }
    if (host) {
      sessionStorage.setItem('shopify_host', host);
    }
  }, [shop, host]);

  // Initialize App Bridge instance for API client
  useEffect(() => {
    // App Bridge is initialized by the CDN script
    // Access it via the global shopify object
    if (window.shopify?.app) {
      setAppBridgeInstance(window.shopify.app);
    } else {
      // Wait for App Bridge to initialize
      const checkAppBridge = setInterval(() => {
        if (window.shopify?.app) {
          setAppBridgeInstance(window.shopify.app);
          clearInterval(checkAppBridge);
        }
      }, 100);

      // Clean up after 5 seconds
      setTimeout(() => clearInterval(checkAppBridge), 5000);
    }
  }, []);

  // If we don't have shop param, show marketing landing page
  if (!shop) {
    return <LandingPage />;
  }

  return <>{children}</>;
}
