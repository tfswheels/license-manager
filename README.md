# License Manager for Shopify

A SendOwl-like digital license distribution system for Shopify stores. Automatically sends license keys to customers after purchase.

## 🎯 Project Overview

**Goal:** Automate digital license delivery for Shopify products  
**Status:** Day 2 Complete ✅  
**Tech Stack:** Node.js, MySQL, React, Shopify API, SendGrid

---

## ✅ Completed Features

### Day 1 - Backend Infrastructure ✅
- ✅ MySQL database schema (7 tables)
- ✅ OAuth installation flow for Shopify Partner App
- ✅ Webhook handler for order creation
- ✅ Core license allocation engine
- ✅ Email service integration (SendGrid)
- ✅ Low inventory alerts
- ✅ Admin API endpoints (full CRUD)
- ✅ Successfully installed on test store

### Day 2 - React Admin Dashboard ✅
- ✅ Complete admin UI with Tailwind CSS 4
- ✅ Smart product selector with search (by name, SKU, ID, variant)
- ✅ GraphQL-based product fetching (efficient, fetches ALL products)
- ✅ CSV license upload with preview
- ✅ Product management with pagination (25/50/100/250 per page)
- ✅ Bulk product selection and deletion
- ✅ Order history and detailed order views
- ✅ Manual license allocation for failed orders
- ✅ Real-time dashboard statistics
- ✅ Responsive design for all screen sizes

---

## 🏗️ Architecture

```
Customer Order (Shopify)
    ↓
Webhook Handler
    ↓
License Allocator
    ├→ Update Database
    ├→ Send Email (SendGrid)
    └→ Check Inventory
```

### Database Schema
- **shops** - Stores installed Shopify shops with access tokens
- **products** - Shopify products linked to license pools
- **licenses** - License keys (allocated/available)
- **orders** - Order information from Shopify
- **order_items** - Line items with license allocation tracking
- **email_logs** - Email delivery audit trail
- **inventory_alerts** - Low stock notifications

---

## 📦 Tech Stack

### Backend
- **Node.js** with ES6 modules
- **Express** - API server
- **MySQL 2** - Database driver with connection pooling
- **Shopify GraphQL API** - Efficient product/order fetching
- **@sendgrid/mail** - Email delivery
- **PapaCSV** - CSV parsing for license uploads
- **dotenv** - Environment configuration

### Frontend
- **React 19** - UI framework
- **Vite 7** - Build tool
- **Tailwind CSS 4** - Styling
- **React Router 7** - Navigation
- **Lucide React** - Icons
- **Axios** - API client

### Database
- **Google Cloud SQL** - Managed MySQL instance

---

## 🚀 Getting Started

### Prerequisites
- Node.js v20+
- MySQL database (Google Cloud SQL)
- Shopify Partner account
- SendGrid account (for emails)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/tfswheels/license-manager.git
cd license-manager
```

2. **Install backend dependencies**
```bash
cd server
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. **Setup database**
```bash
node setup-database.js
```

5. **Start the backend server**
```bash
npm run dev
```

Server runs on `http://localhost:3001`

6. **Install frontend dependencies**
```bash
cd ../admin
npm install
```

7. **Start the admin dashboard**
```bash
npm run dev
```

Admin dashboard runs on `http://localhost:5173`

---

## 🎨 Admin Dashboard Features

### Dashboard Page
- Real-time statistics (orders, products, licenses, availability)
- Shop selector for multi-store support
- Installed shops list with status
- Quick action cards

### Products Page
- Smart product selector modal
  - GraphQL-based product fetching (all products from Shopify)
  - Search by: name, SKU, Shopify ID, variant ID
  - Multi-select with checkboxes
  - Pagination (25 products per page)
  - Product images displayed
- Product list with pagination (25/50/100/250 per page)
- Bulk selection and deletion
- License inventory tracking
- Low inventory warnings
- Delete products from app (with confirmation)

### License Management
- CSV upload with preview
- Upload multiple licenses at once
- View all licenses (paginated)
- Filter by status (available/allocated)
- Delete unallocated licenses
- Release allocated licenses

### Orders Page
- Order history with pagination
- License allocation status
- Warning indicators for incomplete allocations
- Filter by shop
- Detailed order view

### Order Details
- Complete order information
- Customer details
- Line items with license allocation status
- Display allocated license keys
- Email delivery status
- Manual allocation button for failed orders

---

## 📡 API Endpoints

### Authentication
- `GET /auth/install?shop=<shop>` - Start OAuth installation
- `GET /auth/callback` - OAuth callback handler
- `GET /auth/status?shop=<shop>` - Check installation status

### Webhooks
- `POST /webhooks/orders/create` - Order creation webhook

### Admin API - Shops
- `GET /api/admin/shops` - List installed shops
- `GET /api/admin/shops/:shopId/shopify-products` - Fetch ALL products from Shopify (GraphQL)
- `POST /api/admin/shops/:shopId/add-products` - Add selected products to database

### Admin API - Products
- `GET /api/admin/products` - List products with license counts
- `DELETE /api/admin/products/:productId` - Delete product from app

### Admin API - Licenses
- `POST /api/admin/licenses/parse-csv` - Parse CSV file
- `POST /api/admin/products/:productId/licenses/upload` - Upload licenses
- `GET /api/admin/products/:productId/licenses` - View licenses
- `DELETE /api/admin/licenses/:licenseId` - Delete license
- `POST /api/admin/licenses/:licenseId/release` - Release allocated license

### Admin API - Orders
- `GET /api/admin/orders` - List orders
- `GET /api/admin/orders/:orderId` - Order details
- `POST /api/admin/orders/:orderId/allocate` - Manually allocate licenses

### Admin API - Stats
- `GET /api/admin/stats` - Dashboard statistics

---

## 🔄 Workflow

### Normal Flow
1. Customer places order on Shopify
2. Shopify sends webhook to `/webhooks/orders/create`
3. System allocates licenses from available pool
4. Email sent to customer with license keys
5. Licenses marked as allocated in database
6. Inventory levels checked for low stock alerts

### Manual Allocation Flow
1. Admin views orders with failed allocations
2. Admin uploads more licenses via CSV
3. Admin triggers manual allocation
4. System allocates and sends emails

---

## 🛠️ Development

### Project Structure
```
license-manager/
├── server/
│   ├── src/
│   │   ├── config/          # Database & Shopify config
│   │   ├── routes/          # API routes
│   │   │   ├── auth.js      # OAuth flow
│   │   │   ├── webhooks.js  # Order webhooks
│   │   │   └── admin.js     # Admin API (GraphQL products)
│   │   ├── services/        # Business logic
│   │   │   ├── orderService.js      # License allocation
│   │   │   ├── emailService.js      # SendGrid emails
│   │   │   └── inventoryService.js  # Stock alerts
│   │   └── index.js         # Main server
│   ├── migrations/          # SQL schema
│   ├── .env                 # Environment variables
│   └── package.json
└── admin/                   # React Admin Dashboard
    ├── src/
    │   ├── components/
    │   │   ├── Layout.jsx           # Sidebar navigation
    │   │   └── ProductSelector.jsx  # Smart product selector modal
    │   ├── pages/
    │   │   ├── Dashboard.jsx        # Stats overview
    │   │   ├── Products.jsx         # Product management + bulk actions
    │   │   ├── ProductLicenses.jsx  # CSV upload & license management
    │   │   ├── Orders.jsx           # Order history
    │   │   └── OrderDetails.jsx     # Detailed order view
    │   ├── utils/
    │   │   └── api.js               # API client
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

### Database Tools
- **MySQL Workbench** - GUI for database management
- **check-shops.js** - View installed shops
- **setup-database.js** - Initialize database

### Running Tests
```bash
# Check server health
curl http://localhost:3001/health

# Check installed shops
node check-shops.js
```

---

## 🎯 Roadmap

### Day 3 (Next) - Email Templates
- [ ] Email template editor page (HTML + live preview)
- [ ] Per-product custom email templates
- [ ] Template variables: `{{first_name}}`, `{{last_name}}`, `{{order_number}}`, `{{license_keys}}`
- [ ] Backend support for storing templates
- [ ] Update email service to use custom templates
- [ ] Send separate emails per product in order

### Future Enhancements
- [ ] License expiration dates
- [ ] Usage tracking
- [ ] Analytics dashboard
- [ ] Bulk operations (export, import)
- [ ] Multi-language support
- [ ] Advanced email templates with drag-and-drop
- [ ] Customer portal for license management

---

## 📝 Notes

- Database uses UTC timestamps
- Licenses are not unique in DB (can have duplicates for inventory)
- Each email must have unique licenses
- Allocated licenses cannot be sent to another customer unless released
- Low inventory alerts sent max once per 24 hours per product
- GraphQL fetches up to 20,000 products per shop
- Product selector displays 25 products per page
- Product list pagination: 25/50/100/250 per page options

---

## 🔒 Security

- OAuth access tokens stored in database
- Webhook signature verification with HMAC
- CORS configured for admin panel only
- All secrets in environment variables
- No sensitive data in logs

---

## 🐛 Known Issues

None currently - Day 2 complete, all systems operational!

---

## 📄 License

Private project - All rights reserved

---

## 👥 Team

- **Developer**: Jeremiah (tfswheels)
- **Started**: October 13, 2025
- **Current Status**: Day 2 Complete ✅

---

## 🔗 Links

- **GitHub Repository**: https://github.com/tfswheels/license-manager
- **Admin Dashboard**: http://localhost:5173 (dev)
- **Backend API**: http://localhost:3001 (dev)

---

## 🎉 Day 2 Achievements

✅ Complete React admin dashboard  
✅ Smart product selector with GraphQL  
✅ Pagination everywhere (products, licenses, orders)  
✅ Bulk selection and deletion  
✅ CSV license upload  
✅ Real-time stats  
✅ Responsive design  
✅ Professional UI/UX  
