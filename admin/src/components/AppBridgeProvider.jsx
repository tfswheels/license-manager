// admin/src/components/AppBridgeProvider.jsx
import React, { useEffect } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';
import { useLocation } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import { setAppBridgeInstance } from '../utils/api';

/**
 * Shopify App Bridge Provider (v4)
 * In v4, App Bridge is initialized via the CDN script and meta tag in index.html
 * This component just handles shop detection and sets up the API client
 * No Provider wrapper needed - useAppBridge hook works with CDN-initialized instance
 */
export default function ShopifyAppBridgeProvider({ children }) {
  const location = useLocation();

  // Get App Bridge instance from CDN-initialized App Bridge
  const app = useAppBridge();

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

  // Set App Bridge instance for API client when available
  useEffect(() => {
    if (app) {
      setAppBridgeInstance(app);
      console.log('✅ App Bridge instance initialized for API client');
    }
  }, [app]);

  // If we don't have shop param, show marketing landing page
  if (!shop) {
    return <LandingPage />;
  }

  // Just render children - no Provider wrapper needed in v4
  return <>{children}</>;
}
