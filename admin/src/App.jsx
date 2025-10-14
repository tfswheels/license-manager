// admin/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductLicenses from './pages/ProductLicenses';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import Templates from './pages/Templates';
import TemplateEditor from './pages/TemplateEditor';

function App() {
  return (
    <Router>
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
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;