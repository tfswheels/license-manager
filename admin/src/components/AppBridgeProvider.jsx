// admin/src/components/AppBridgeProvider.jsx
import React, { useEffect, useState } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';
import { useLocation } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import { setAppBridgeInstance } from '../utils/api';
import axios from 'axios';

/**
 * Shopify App Bridge Provider (v4)
 * In v4, App Bridge is initialized via the CDN script and meta tag in index.html
 * This component just handles shop detection and sets up the API client
 * No Provider wrapper needed - useAppBridge hook works with CDN-initialized instance
 */
export default function ShopifyAppBridgeProvider({ children }) {
  const location = useLocation();
  const [isCheckingInstallation, setIsCheckingInstallation] = useState(true);

  // Get App Bridge instance from CDN-initialized App Bridge
  const app = useAppBridge();

  // Get shop from URL query params, sessionStorage, or localStorage
  const params = new URLSearchParams(location.search);
  let shop = params.get('shop');

  // IMPORTANT: If shop is in URL, clear any cached values that don't match
  // This prevents stale shop data from interfering with new installations
  if (shop) {
    const cachedShop = localStorage.getItem('shopify_shop');
    if (cachedShop && cachedShop !== shop) {
      console.warn(`⚠️ Shop mismatch detected! URL: ${shop}, Cached: ${cachedShop}`);
      console.log('🧹 Clearing stale shop data from storage');
      localStorage.removeItem('shopify_shop');
      sessionStorage.removeItem('shopify_shop');
      localStorage.removeItem('currentShopId');
      sessionStorage.removeItem('currentShopId');
    }
  }

  // If not in URL, try sessionStorage first
  if (!shop) {
    shop = sessionStorage.getItem('shopify_shop');
  }

  // If still not found, try localStorage as fallback
  if (!shop) {
    shop = localStorage.getItem('shopify_shop');
  }

  // Ensure shop domain has .myshopify.com suffix
  if (shop && !shop.includes('.myshopify.com')) {
    shop = `${shop}.myshopify.com`;
  }

  // Get host from URL query params, sessionStorage, or localStorage (required for embedded apps)
  let host = params.get('host');
  if (!host) {
    host = sessionStorage.getItem('shopify_host');
  }
  if (!host) {
    host = localStorage.getItem('shopify_host');
  }

  // Store shop and host in both sessionStorage and localStorage for persistence
  useEffect(() => {
    if (shop) {
      sessionStorage.setItem('shopify_shop', shop);
      localStorage.setItem('shopify_shop', shop);
      console.log(`✅ Shop domain stored: ${shop}`);
    }
    if (host) {
      sessionStorage.setItem('shopify_host', host);
      localStorage.setItem('shopify_host', host);
    }
  }, [shop, host]);

  // Set App Bridge instance for API client when available
  useEffect(() => {
    if (app) {
      setAppBridgeInstance(app);
      console.log('✅ App Bridge instance initialized for API client');
    }
  }, [app]);

  // Check if shop is installed, if not redirect to OAuth
  useEffect(() => {
    async function checkInstallation() {
      if (!shop) {
        setIsCheckingInstallation(false);
        return;
      }

      try {
        console.log(`🔍 Checking if shop ${shop} is installed...`);

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await axios.get(`${apiUrl}/auth/status?shop=${shop}`);

        console.log('📊 Installation status:', response.data);

        if (!response.data.installed) {
          console.log(`⚠️ Shop ${shop} not installed, redirecting to OAuth...`);

          // Redirect to OAuth install endpoint
          const installUrl = `${apiUrl}/auth/install?shop=${shop}`;
          console.log(`🔀 Redirecting to: ${installUrl}`);

          window.location.href = installUrl;
          return; // Don't set isCheckingInstallation to false, stay in loading state
        }

        console.log(`✅ Shop ${shop} is installed`);
        setIsCheckingInstallation(false);
      } catch (error) {
        console.error('❌ Error checking installation status:', error);

        // If we can't determine status, assume not installed and redirect to OAuth
        console.log('⚠️ Could not verify installation, redirecting to OAuth...');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const installUrl = `${apiUrl}/auth/install?shop=${shop}`;
        window.location.href = installUrl;
      }
    }

    checkInstallation();
  }, [shop]);

  // If we don't have shop param, show marketing landing page
  if (!shop) {
    return <LandingPage />;
  }

  // Show loading state while checking installation
  if (isCheckingInstallation) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing app...</p>
        </div>
      </div>
    );
  }

  // Just render children - no Provider wrapper needed in v4
  return <>{children}</>;
}
