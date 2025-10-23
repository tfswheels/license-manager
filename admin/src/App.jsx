// admin/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import AppBridgeProvider from './components/AppBridgeProvider';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductLicenses from './pages/ProductLicenses';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import Templates from './pages/Templates';
import TemplateEditor from './pages/TemplateEditor';
import TemplateRules from './pages/TemplateRules';
import SystemSettings from './pages/SystemSettings';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import GDPRCompliance from './pages/GDPRCompliance';
import './styles/embedded.css';
import './styles/responsive.css';

function App() {
  // Detect if we're in embedded mode and apply compact styles
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shop = params.get('shop') || sessionStorage.getItem('shopify_shop');
    const isEmbedded = shop || window.self !== window.top; // Has shop param or in iframe

    if (isEmbedded) {
      document.body.classList.add('embedded-app');
    } else {
      document.body.classList.remove('embedded-app');
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Legal Pages - No authentication required */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/gdpr-compliance" element={<GDPRCompliance />} />

        {/* Protected Admin Routes - Require Shopify authentication */}
        <Route path="/*" element={
          <AppBridgeProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:productId/licenses" element={<ProductLicenses />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:orderId" element={<OrderDetails />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/templates/new" element={<TemplateEditor />} />
                <Route path="/templates/:id/edit" element={<TemplateEditor />} />
                <Route path="/template-rules" element={<TemplateRules />} />
                <Route path="/settings" element={<SystemSettings />} />
              </Routes>
            </Layout>
          </AppBridgeProvider>
        } />
      </Routes>
    </Router>
  );
}

export default App;