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

  // Check URL directly first (more reliable on initial render than useLocation)
  const urlParams = new URLSearchParams(window.location.search);
  const routerParams = new URLSearchParams(location.search);

  let shop = urlParams.get('shop') || routerParams.get('shop');
  let host = urlParams.get('host') || routerParams.get('host');
  let installing = urlParams.get('installing') || routerParams.get('installing');
  const installId = urlParams.get('install_id') || routerParams.get('install_id');

  // Persist installing state in sessionStorage
  // This is critical because Shopify may not preserve query params when loading the iframe
  if (installing === 'true' && installId) {
    sessionStorage.setItem('shopify_installing', 'true');
    sessionStorage.setItem('shopify_install_id', installId);
  }

  // Check sessionStorage if not in URL (iframe reload scenario)
  if (!installing && sessionStorage.getItem('shopify_installing') === 'true') {
    installing = 'true';
    console.log('📦 Restored installing state from sessionStorage');
  }

  // CRITICAL: Block all rendering immediately if installing
  // This must happen BEFORE any other logic
  const shouldBlockRendering = installing === 'true';

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

  // CRITICAL: Start with true to block rendering until first database check completes
  // This prevents Dashboard from mounting and showing errors before we verify shop exists
  const [isInitialCheck, setIsInitialCheck] = React.useState(true);

  useEffect(() => {
    const checkAndRedirectIfNeeded = async () => {
      // Only check if we have a shop parameter
      if (!shop) return;

      // Skip if already complete
      if (isInstallingComplete) return;

      // If we're installing, always check (poll until ready)
      // Otherwise, only check once
      if (!installing && hasChecked) return;

      setIsChecking(true);

      try {
        console.log('🔍 Checking if shop is installed:', shop);

        // Check if shop exists in database
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/status?shop=${shop}`);
        const data = await response.json();

        if (!data.installed) {
          // Check if we have install_id (means OAuth already happened, just waiting for DB sync)
          const hasInstallId = sessionStorage.getItem('shopify_install_id');

          if (installing === 'true' && hasInstallId) {
            // OAuth already completed, just poll until shop appears in database
            console.log('⏳ Installation in progress, waiting for database sync...');
            setIsChecking(false);
            // Poll again after 1.5 seconds
            setTimeout(() => {
              checkAndRedirectIfNeeded();
            }, 1500);
            return;
          }

          // No install_id means OAuth hasn't happened yet - redirect to OAuth
          console.log('⚠️ Shop not installed in database, redirecting to OAuth...');

          const authUrl = `${import.meta.env.VITE_API_URL}/auth/install?shop=${shop}`;
          console.log('🔄 Redirecting to:', authUrl);

          // Use window.open with _top to break out of iframe
          window.open(authUrl, '_top');

          return; // Don't continue rendering
        }

        console.log('✅ Shop is installed, proceeding normally');

        // Clear installing state from sessionStorage
        sessionStorage.removeItem('shopify_installing');
        sessionStorage.removeItem('shopify_install_id');

        // Mark installation as complete - this will allow app to render
        setIsInstallingComplete(true);

      } catch (error) {
        console.error('❌ Error checking install status:', error);
        // If installing, retry on error
        if (installing === 'true') {
          setTimeout(() => {
            checkAndRedirectIfNeeded();
          }, 2000);
        }
      } finally {
        setIsChecking(false);
        setHasChecked(true);
        // Mark initial check as complete
        setIsInitialCheck(false);
      }
    };

    checkAndRedirectIfNeeded();
  }, [shop, installing]); // Minimal dependencies to avoid re-trigger loops

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

  // CRITICAL: Block all rendering until we've verified shop status
  // Show loading screen if:
  // 1. Still doing initial database check (prevents Dashboard error on first render)
  // 2. OR we're in installation mode and installation hasn't completed
  const showLoadingScreen = isInitialCheck || (shouldBlockRendering && !isInstallingComplete);

  if (showLoadingScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
          <div className="mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {shouldBlockRendering ? 'Setting Up Your Account' : 'Loading...'}
          </h2>
          <p className="text-gray-600 mb-2">
            {shouldBlockRendering
              ? 'Please wait while we complete your installation...'
              : 'Verifying your account...'}
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