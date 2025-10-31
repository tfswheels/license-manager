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
  const app = useAppBridge();
  
  const params = new URLSearchParams(location.search);
  let shop = params.get('shop');
  let host = params.get('host');

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

  // Get host from sessionStorage or localStorage if not in URL
  if (!host) {
    host = sessionStorage.getItem('shopify_host');
  }
  if (!host) {
    host = localStorage.getItem('shopify_host');
  }

  // NEW: Check if shop is installed in database
  const [isChecking, setIsChecking] = React.useState(false);
  const [hasChecked, setHasChecked] = React.useState(false);

  useEffect(() => {
    const checkAndRedirectIfNeeded = async () => {
      // Only check once per page load
      if (hasChecked || isChecking) return;
      
      // Only check if we have a shop parameter
      if (!shop) return;
      
      setIsChecking(true);
      
      try {
        console.log('🔍 Checking if shop is installed:', shop);
        
        // Check if shop exists in database
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/status?shop=${shop}`);
        const data = await response.json();
        
        if (!data.installed) {
          console.log('⚠️ Shop not installed in database, redirecting to OAuth...');
          
          // Redirect to OAuth install endpoint
          window.location.href = `${import.meta.env.VITE_API_URL}/auth/install?shop=${shop}`;
          return; // Don't continue rendering
        }
        
        console.log('✅ Shop is installed, proceeding normally');
      } catch (error) {
        console.error('❌ Error checking install status:', error);
        // Don't block the app if the check fails, just log it
      } finally {
        setIsChecking(false);
        setHasChecked(true);
      }
    };
    
    checkAndRedirectIfNeeded();
  }, [shop, hasChecked, isChecking]);

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

  // If we don't have shop param, show marketing landing page
  if (!shop) {
    return <LandingPage />;
  }

  // Show loading state while checking installation status
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking installation...</p>
        </div>
      </div>
    );
  }

  // Just render children - no Provider wrapper needed in v4
  return <>{children}</>;
}