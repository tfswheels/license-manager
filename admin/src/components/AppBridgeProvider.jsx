// admin/src/components/AppBridgeProvider.jsx
import React, { useEffect } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const installing = urlParams.get('installing') || routerParams.get('installing');

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
      if (!shop) {
        console.log('⚠️ No shop parameter found');
        return;
      }

      // Skip if already complete
      if (isInstallingComplete) return;

      // If we're installing, always check (poll until ready)
      // Otherwise, only check once
      if (!installing && hasChecked) return;

      setIsChecking(true);

      try {
        console.log('🔍 Checking if shop is installed:', shop);
        console.log('🔍 URL params:', { shop, host, installing });
        console.log('🔍 Full URL:', window.location.href);

        // Check if shop exists in database and has correct scopes
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/status?shop=${shop}`);
        const data = await response.json();

        console.log('🔍 Status response:', data);

        // Need to redirect to OAuth if:
        // 1. Shop not installed at all, OR
        // 2. Shop is installed but scopes don't match (needs re-authentication), OR
        // 3. Shop is installed but access token is invalid/revoked
        const needsOAuth = !data.installed || !data.scopesMatch || !data.tokenIsValid;

        if (needsOAuth) {
          if (installing === 'true') {
            // OAuth already happened (we have installing param), just waiting for DB sync
            // Keep loading screen showing by NOT setting isInitialCheck to false
            console.log('⏳ Installation in progress, waiting for database sync...');
            setIsChecking(false);
            setHasChecked(true);
            // Poll again after 1.5 seconds
            setTimeout(() => {
              checkAndRedirectIfNeeded();
            }, 1500);
            return;
          }

          // Shop needs OAuth - either not installed, scopes outdated, or token invalid
          if (!data.installed) {
            console.log('⚠️ Shop not installed in database, redirecting to OAuth...');
          } else if (!data.scopesMatch) {
            console.log('⚠️ Shop scopes are outdated, forcing re-authentication...');
            console.log('   Current scopes:', data.currentScopes);
            console.log('   Required scopes:', data.requiredScopes);
          } else if (!data.tokenIsValid) {
            console.log('⚠️ Access token is invalid/revoked, forcing re-authentication...');
            console.log('   This happens when app is uninstalled and reinstalled');
          }

          const authUrl = `${import.meta.env.VITE_API_URL}/auth/install?shop=${shop}`;
          console.log('🔄 Redirecting to:', authUrl);

          // Use window.open with _top to break out of iframe
          window.open(authUrl, '_top');

          return; // Don't continue rendering
        }

        console.log('✅ Shop is installed with correct scopes, proceeding normally');

        // Mark installation as complete and allow app to render
        setIsInstallingComplete(true);
        setIsInitialCheck(false);

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
        // Only mark initial check complete if we're not in installing mode
        // During installation, keep blocking until shop is confirmed in DB
        if (installing !== 'true') {
          setIsInitialCheck(false);
        }
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