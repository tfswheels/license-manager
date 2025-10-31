// admin/src/components/AppBridgeProvider.jsx
import React, { useEffect } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';
import { useLocation, useNavigate } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import { setAppBridgeInstance } from '../utils/api';

export default function ShopifyAppBridgeProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const app = useAppBridge();
  
  const params = new URLSearchParams(location.search);
  let shop = params.get('shop');
  let host = params.get('host');
  const installing = params.get('installing');

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

  // Check if shop is installed in database
  const [isChecking, setIsChecking] = React.useState(false);
  const [hasChecked, setHasChecked] = React.useState(false);
  const [isInstallingComplete, setIsInstallingComplete] = React.useState(false);

  useEffect(() => {
    const checkAndRedirectIfNeeded = async () => {
      // Only check once per page load (unless we're waiting for installation to complete)
      if ((hasChecked || isChecking) && installing !== 'true') return;

      // Only check if we have a shop parameter
      if (!shop) return;

      setIsChecking(true);

      try {
        console.log('🔍 Checking if shop is installed:', shop);

        // Check if shop exists in database
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/status?shop=${shop}`);
        const data = await response.json();

        if (!data.installed) {
          // If we're coming back from OAuth (installing=true) but shop not found yet,
          // keep polling instead of redirecting again
          if (installing === 'true') {
            console.log('⏳ Installation in progress, polling...');
            setIsChecking(false);
            // Poll again after 1 second
            setTimeout(() => {
              setHasChecked(false);
            }, 1000);
            return;
          }

          console.log('⚠️ Shop not installed in database, redirecting to OAuth...');

          const authUrl = `${import.meta.env.VITE_API_URL}/auth/install?shop=${shop}`;
          console.log('🔄 Redirecting to:', authUrl);

          // Use window.open with _top to break out of iframe
          window.open(authUrl, '_top');

          return; // Don't continue rendering
        }

        console.log('✅ Shop is installed, proceeding normally');

        // If we just finished installing, clean up the URL and allow app to load
        if (installing === 'true') {
          console.log('🔄 Installation complete, removing installing parameter from URL');

          // Build new URL without 'installing' param
          const newParams = new URLSearchParams(location.search);
          newParams.delete('installing');

          // Navigate to clean URL
          const newSearch = newParams.toString();
          const newPath = location.pathname + (newSearch ? `?${newSearch}` : '');

          // Replace URL without reloading page
          window.history.replaceState({}, '', newPath);

          // Mark installation as complete
          setIsInstallingComplete(true);
        }

      } catch (error) {
        console.error('❌ Error checking install status:', error);
        // Don't block the app if the check fails, just log it
      } finally {
        setIsChecking(false);
        setHasChecked(true);
      }
    };

    checkAndRedirectIfNeeded();
  }, [shop, hasChecked, isChecking, installing, location.pathname, location.search]);

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

  // Show installation/checking state while we're verifying or setting up
  if (isChecking || (installing === 'true' && !isInstallingComplete)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
          <div className="mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {installing === 'true' ? 'Setting Up Your Account' : 'Initializing'}
          </h2>
          <p className="text-gray-600 mb-2">
            {installing === 'true'
              ? 'Please wait while we configure your app...'
              : 'Checking installation status...'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Just render children - no Provider wrapper needed in v4
  return <>{children}</>;
}