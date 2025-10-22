// admin/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <Router>
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
            {/* Legal Pages */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/gdpr-compliance" element={<GDPRCompliance />} />
          </Routes>
        </Layout>
      </AppBridgeProvider>
    </Router>
  );
}

export default App;