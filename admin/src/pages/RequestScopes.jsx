import { useState } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';

export default function RequestScopes() {
  const app = useAppBridge();
  const [requesting, setRequesting] = useState(false);

  const requestScopes = async () => {
    try {
      setRequesting(true);

      // Request the missing read_orders scope using App Bridge
      const redirect = await app.redirect.create();

      // Build the scope request URL
      const shop = new URLSearchParams(window.location.search).get('shop');
      const apiKey = import.meta.env.VITE_SHOPIFY_API_KEY;
      const redirectUri = `${import.meta.env.VITE_API_URL}/auth/callback`;

      const scopeRequestUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=read_products,read_orders,read_customers,write_orders&redirect_uri=${redirectUri}&state=${Date.now()}`;

      redirect.dispatch(redirect.Action.REMOTE, scopeRequestUrl);

    } catch (error) {
      console.error('Failed to request scopes:', error);
      alert('Failed to request additional permissions. Please try again.');
      setRequesting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Additional Permissions Required
        </h2>
        <p className="text-gray-700 mb-4">
          To enable automatic order fulfillment in Shopify, this app needs additional permissions:
        </p>
        <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
          <li><strong>read_orders</strong> - Required to read order fulfillment details</li>
        </ul>
        <p className="text-sm text-gray-600 mb-6">
          Clicking the button below will redirect you to approve these additional permissions.
          Your existing data and settings will not be affected.
        </p>
        <button
          onClick={requestScopes}
          disabled={requesting}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {requesting ? 'Requesting...' : 'Grant Additional Permissions'}
        </button>
      </div>
    </div>
  );
}
