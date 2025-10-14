# License Manager for Shopify

A SendOwl-like digital license distribution system for Shopify stores. Automatically sends license keys to customers after purchase.

## 🎯 Project Overview

**Goal:** Automate digital license delivery for Shopify products  
**Status:** Email Template System Complete ✅  
**Tech Stack:** Node.js, MySQL, React, Shopify API, SendGrid  
**Started:** October 13, 2025

---

## ✅ Completed Features

### Backend Infrastructure ✅
- ✅ MySQL database schema (8 tables)
- ✅ OAuth installation flow for Shopify Partner App
- ✅ Webhook handler for order creation
- ✅ Core license allocation engine
- ✅ Email service integration (SendGrid)
- ✅ Low inventory alerts
- ✅ Admin API endpoints (full CRUD)
- ✅ Successfully installed on test store

### React Admin Dashboard ✅
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

### Email Template System ✅
- ✅ Template management interface (list, create, edit, delete)
- ✅ Split-screen template editor with live preview
- ✅ HTML and plain text versions
- ✅ Auto-generate plain text from HTML
- ✅ Template variable system ({{first_name}}, {{last_name}}, {{order_number}}, {{license_keys}}, {{product_name}})
- ✅ Default template created on shop install
- ✅ Set any template as default
- ✅ Template validation (prevents script tags, warns about missing variables)
- ✅ Backend fully supports custom templates
- ✅ Email service uses templates with variable replacement
- ✅ Cursor-position variable insertion

---

## 🏗️ Architecture

```
Customer Order (Shopify)
    ↓
Webhook Handler
    ↓
License Allocator
    ├→ Update Database
    ├→ Send Email (Custom Template)
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
- **email_templates** - Custom email templates per shop

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

5. **Run email template migration**
```bash
node run-migration.js
```

6. **Start the backend server**
```bash
npm run dev
```

Server runs on `http://localhost:3001`

7. **Install frontend dependencies**
```bash
cd ../admin
npm install
```

8. **Start the admin dashboard**
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

### Email Templates Page
- Template list with search and filtering
- Create/Edit/Delete templates
- Set default template
- View products assigned to each template
- Template status indicators

### Template Editor
- Split-screen layout (editor + live preview)
- HTML and Plain Text tabs
- Auto-generate plain text from HTML
- Live preview with sample data
- Click-to-insert variable palette
- Template validation with warnings
- Cursor-position insertion (no scroll jumping)
- Both HTML and text versions required for email compatibility

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
- `PUT /api/admin/products/:productId/template` - Assign template to product
- `POST /api/admin/products/bulk-assign-template` - Bulk assign template

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

### Admin API - Templates
- `GET /api/admin/templates` - List all templates
- `GET /api/admin/templates/:id` - Get template
- `POST /api/admin/templates` - Create template
- `PUT /api/admin/templates/:id` - Update template
- `DELETE /api/admin/templates/:id` - Delete template
- `POST /api/admin/templates/:id/set-default` - Set as default
- `POST /api/admin/templates/validate` - Validate template HTML
- `GET /api/admin/templates/:id/products` - Get products using template

### Admin API - Stats
- `GET /api/admin/stats` - Dashboard statistics

---

## 🔄 Workflow

### Normal Flow
1. Customer places order on Shopify
2. Shopify sends webhook to `/webhooks/orders/create`
3. System allocates licenses from available pool
4. Email sent to customer with custom template (or default)
5. Licenses marked as allocated in database
6. Inventory levels checked for low stock alerts

### Manual Allocation Flow
1. Admin views orders with failed allocations
2. Admin uploads more licenses via CSV
3. Admin triggers manual allocation
4. System allocates and sends emails using templates

---

## 🛠️ Development

### Project Structure
```
license-manager/
├── server/
│   ├── src/
│   │   ├── config/          # Database & Shopify config
│   │   ├── routes/          # API routes
│   │   │   ├── auth.js      # OAuth flow + default template creation
│   │   │   ├── webhooks.js  # Order webhooks
│   │   │   └── admin.js     # Admin API (products, orders, templates)
│   │   ├── services/        # Business logic
│   │   │   ├── orderService.js      # License allocation
│   │   │   ├── emailService.js      # SendGrid emails with templates
│   │   │   ├── templateService.js   # Template rendering & management
│   │   │   └── inventoryService.js  # Stock alerts
│   │   └── index.js         # Main server
│   ├── migrations/          # SQL schema
│   │   ├── 001_initial_schema.sql
│   │   └── 002_email_templates.sql
│   ├── .env                 # Environment variables
│   ├── setup-database.js    # Initial DB setup
│   ├── run-migration.js     # Migration runner
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
    │   │   ├── OrderDetails.jsx     # Detailed order view
    │   │   ├── Templates.jsx        # Template list (table view)
    │   │   └── TemplateEditor.jsx   # Template editor with live preview
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
- **run-migration.js** - Run migrations

### Running Tests
```bash
# Check server health
curl http://localhost:3001/health

# Check installed shops
node check-shops.js
```

---

## 🎯 Next Steps

### Immediate (Next Session)
- [ ] Add template assignment UI to Products page
  - [ ] Template column in product list
  - [ ] Dropdown to change template per product
  - [ ] Bulk action: "Assign to Template"
- [ ] End-to-end testing with real Shopify orders

### Future Enhancements
- [ ] License expiration dates
- [ ] Usage tracking
- [ ] Analytics dashboard
- [ ] Bulk operations (export, import)
- [ ] Multi-language support
- [ ] Customer portal for license management
- [ ] Template preview email (send test)
- [ ] Template duplication
- [ ] Rich text editor option

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
- **Email templates**: Both HTML and plain text versions sent (client chooses which to display)
- Plain text auto-generates from HTML but can be manually overridden
- Default template created automatically on shop install

---

## 🔒 Security

- OAuth access tokens stored in database
- Webhook signature verification with HMAC
- CORS configured for admin panel only
- All secrets in environment variables
- No sensitive data in logs
- Template validation prevents script injection

---

## 🐛 Known Issues

None currently - Email template system operational! ✅

---

## 📄 License

Private project - All rights reserved

---

## 👥 Team

- **Developer**: Jeremiah (tfswheels)
- **Started**: October 13, 2025
- **Current Status**: Email Template System Complete ✅

---

## 🔗 Links

- **GitHub Repository**: https://github.com/tfswheels/license-manager
- **Admin Dashboard**: http://localhost:5173 (dev)
- **Backend API**: http://localhost:3001 (dev)

---

## 🎉 Latest Updates (October 14, 2025)

✅ **Email Template System**
- Complete template management UI
- Template editor with split-screen preview
- Auto-generate plain text from HTML
- Variable replacement system
- Default template on install
- Template validation
- All backend support complete

**What's Working:**
- Create, edit, delete templates
- Set default template
- Live preview while editing
- Variable insertion at cursor position
- Auto-generated plain text version
- Template validation with warnings
- Email service uses templates
- Default template created on shop install

**What's Next:**
- Product → Template assignment UI
- End-to-end testing with orders