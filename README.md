# License Manager for Shopify

A complete digital license distribution system for Shopify stores. Automatically sends license keys to customers after purchase with custom email templates.

**Built by a real SendOwl customer who needed a better solution.** 🚀

## 🎯 Project Overview

**Status:** Production Ready ✅  
**Tech Stack:** Node.js, MySQL, React, Shopify API, SendGrid  
**Started:** October 13, 2025  
**Completed:** October 14, 2025

---

## ✨ Features

### Automatic License Delivery ✅
- Webhook-driven automation
- Real-time order processing
- Instant email delivery
- License allocation tracking
- Inventory monitoring with alerts

### Custom Email Templates ✅
- Unlimited custom templates
- Split-screen editor with live preview
- HTML and plain text versions
- Auto-generate plain text from HTML
- Product-specific template assignment
- Template variable system
- Set default template per shop
- Template validation

### Smart Product Management ✅
- GraphQL-based product fetching (retrieves ALL products)
- Advanced search (name, SKU, Shopify ID, variant ID)
- Bulk product selection and operations
- Product-to-template assignment
- Bulk template assignment
- License inventory tracking per product
- Pagination (25/50/100/250 per page)

### Flexible License Upload ✅
- CSV file support
- Excel file support (.xlsx, .xls)
- Drag-and-drop upload
- Preview before upload
- Bulk license management
- Release allocated licenses
- Delete unallocated licenses

### Complete Admin Dashboard ✅
- Real-time statistics
- Order history and details
- Manual license allocation
- Template management
- Product management
- Multi-shop support
- Responsive design

---

## 🏗️ Architecture

```
Customer Order (Shopify)
    ↓
Webhook Handler (Auto-registered)
    ↓
License Allocator
    ├→ Check Product → Template Assignment
    ├→ Allocate Licenses from Pool
    ├→ Send Custom Email (SendGrid)
    ├→ Update Database
    └→ Check Inventory Alerts
```

### Database Schema (8 Tables)
- **shops** - Installed Shopify stores with OAuth tokens
- **products** - Products linked to license pools and templates
- **licenses** - License keys with allocation status
- **orders** - Order records from Shopify webhooks
- **order_items** - Line items with allocation tracking
- **email_logs** - Email delivery audit trail
- **inventory_alerts** - Low stock notifications
- **email_templates** - Custom email templates per shop

---

## 🚀 Getting Started

### Prerequisites
- Node.js v20+
- MySQL database (Google Cloud SQL recommended)
- Shopify Partner account
- SendGrid account (free tier: 100 emails/day)

### Quick Setup

```bash
# 1. Clone repository
git clone https://github.com/tfswheels/license-manager.git
cd license-manager

# 2. Install dependencies
cd server && npm install
cd ../admin && npm install

# 3. Configure environment
cd ../server
cp .env.example .env
# Edit .env with your credentials

# 4. Setup database
node setup-database.js
node run-migration.js

# 5. Start servers
npm run dev  # Backend (port 3001)
cd ../admin && npm run dev  # Frontend (port 5173)
```

### Environment Configuration

```bash
# Server (server/.env)
PORT=3001
APP_URL=https://your-domain.com

# Database
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=license_manager
DB_PORT=3306

# Shopify Partner App
SHOPIFY_API_KEY=your-api-key
SHOPIFY_API_SECRET=your-api-secret
SHOPIFY_SCOPES=read_products,read_orders,read_customers

# SendGrid
SENDGRID_API_KEY=your-sendgrid-key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Your Company Name

# Alerts
ADMIN_EMAIL=admin@yourdomain.com
LOW_INVENTORY_THRESHOLD=10
```

---

## 📱 Admin Dashboard

### Dashboard Page
- Real-time statistics (orders, licenses, products)
- Shop selector for multi-store support
- Quick action cards
- Installation status

### Products Page
- Smart product selector modal
- Search by name, SKU, ID, variant
- Multi-select with checkboxes
- Bulk operations (delete, assign template)
- Template assignment dropdown per product
- License inventory tracking
- Pagination controls

### License Management
- CSV and Excel upload (.csv, .xlsx, .xls)
- Upload preview with validation
- View all licenses (paginated)
- Filter by status (available/allocated)
- Delete unallocated licenses
- Release allocated licenses
- Download license lists

### Orders Page
- Order history with pagination
- License allocation status
- Warning indicators for incomplete allocations
- Detailed order view
- Manual license allocation
- Email delivery status

### Templates Page
- Template list with search
- Create/Edit/Delete templates
- Set default template (⭐)
- View product count per template
- Template status indicators
- Split-screen editor with live preview

### Template Editor
- HTML and Plain Text tabs
- Live preview with sample data
- Click-to-insert variable palette
- Auto-generate plain text from HTML
- Template validation with warnings
- Cursor-position variable insertion
- Support for: {{first_name}}, {{last_name}}, {{order_number}}, {{license_keys}}, {{product_name}}

---

## 📡 API Endpoints

### Authentication
- `GET /auth/install` - OAuth installation
- `GET /auth/callback` - OAuth callback with auto-webhook registration
- `GET /auth/status` - Installation status check

### Webhooks
- `POST /webhooks/orders/create` - Order creation (auto-registered)

### Admin API - Products
- `GET /api/admin/products` - List products with license counts
- `DELETE /api/admin/products/:id` - Delete product
- `PUT /api/admin/products/:id/template` - Assign template
- `POST /api/admin/products/bulk-assign-template` - Bulk assign

### Admin API - Licenses
- `POST /api/admin/licenses/parse-csv` - Parse CSV/Excel file
- `POST /api/admin/products/:id/licenses/upload` - Upload licenses
- `GET /api/admin/products/:id/licenses` - View licenses
- `DELETE /api/admin/licenses/:id` - Delete license
- `POST /api/admin/licenses/:id/release` - Release license

### Admin API - Templates
- `GET /api/admin/templates` - List templates
- `GET /api/admin/templates/:id` - Get template
- `POST /api/admin/templates` - Create template
- `PUT /api/admin/templates/:id` - Update template
- `DELETE /api/admin/templates/:id` - Delete template
- `POST /api/admin/templates/:id/set-default` - Set as default
- `POST /api/admin/templates/validate` - Validate HTML
- `GET /api/admin/templates/:id/products` - Get assigned products

### Admin API - Orders
- `GET /api/admin/orders` - List orders
- `GET /api/admin/orders/:id` - Order details
- `POST /api/admin/orders/:id/allocate` - Manual allocation

---

## 🔄 Workflow

### Normal Flow
1. Customer places order on Shopify
2. Shopify sends webhook to app (auto-registered during install)
3. System checks product's assigned template
4. Allocates licenses from available pool
5. Sends email using custom template (or default)
6. Marks licenses as allocated
7. Checks inventory levels and sends alerts if low

### Manual Allocation Flow
1. Admin views orders with failed allocations
2. Admin uploads more licenses via CSV or Excel
3. Admin triggers manual allocation
4. System allocates and sends emails using assigned templates

---

## 💡 Key Features vs Competitors

| Feature | This App | SendOwl | Sky Pilot |
|---------|----------|---------|-----------|
| Price | $19.99/mo | $15-159/mo | $15-35/mo |
| Unlimited Templates | ✅ | ❌ | ❌ |
| Product-Specific Templates | ✅ | ❌ | ❌ |
| Excel Upload | ✅ | ❌ | ❌ |
| Live Template Preview | ✅ | ❌ | ❌ |
| Modern UI | ✅ | ❌ | ⚠️ |
| Bulk Operations | ✅ | ⚠️ | ⚠️ |
| Real-time Stats | ✅ | ⚠️ | ⚠️ |

---

## 🔒 Security

- OAuth 2.0 for Shopify authentication
- HMAC webhook signature verification
- Database connection pooling with prepared statements
- Environment variable configuration (no secrets in code)
- CORS restricted to admin panel origin
- Template validation (prevents script injection)
- Sensitive data encrypted at rest

---

## 📦 Tech Stack

### Backend
- **Node.js** with ES6 modules
- **Express** - RESTful API
- **MySQL 2** - Connection pooling
- **Shopify API** - OAuth, GraphQL, Webhooks
- **SendGrid** - Email delivery
- **SheetJS** - Excel file parsing
- **PapaCSV** - CSV parsing

### Frontend
- **React 19** - UI framework
- **Vite 7** - Build tool
- **Tailwind CSS 4** - Styling
- **React Router 7** - Navigation
- **Lucide React** - Icons
- **Axios** - API client

### Infrastructure
- **Google Cloud SQL** - MySQL database
- **Railway/Render** - Application hosting (recommended)
- **ngrok** - Local development webhook testing

---

## 🎯 Roadmap

### Phase 1: Production Launch ✅
- [x] Core license delivery
- [x] Custom email templates
- [x] Admin dashboard
- [x] Product management
- [x] Template assignment

### Phase 2: Enhanced Features (Next)
- [ ] Custom domain email sending
- [ ] Email settings per shop
- [ ] Template preview emails
- [ ] License expiration dates
- [ ] Usage tracking & analytics
- [ ] Advanced reporting
- [ ] Template duplication
- [ ] Rich text template editor

### Phase 3: Advanced (Future)
- [ ] Custom template rules (by tag, vendor, collection)
- [ ] License auto-generation
- [ ] Multi-language support
- [ ] Customer portal for license management
- [ ] API for developers
- [ ] Webhook retry logic
- [ ] Advanced fraud detection

---

## 📝 Development Notes

### Database
- Uses UTC timestamps throughout
- Licenses can have duplicates (inventory system)
- Allocated licenses locked to order_id
- Products with NULL email_template_id use shop's default template
- Connection pool max: 10 connections

### Email System
- Both HTML and plain text versions sent
- Plain text auto-generates from HTML
- SendGrid free tier: 100 emails/day
- Template variables replaced at send time
- Default template auto-created on shop install

### Webhooks
- Auto-registered during OAuth installation
- Signature verified using Shopify API secret
- Async processing (responds immediately to Shopify)
- Errors logged but don't block webhook response

---

## 🐛 Known Issues

None! App is production-ready. 🎉

---

## 📄 License

Private project - All rights reserved

---

## 👥 Team

- **Developer**: Jeremiah (tfswheels)
- **Started**: October 13, 2025
- **Status**: Production Ready ✅

---

## 🔗 Links

- **GitHub**: https://github.com/tfswheels/license-manager
- **Admin Dashboard**: http://localhost:5173 (dev)
- **Backend API**: http://localhost:3001 (dev)

---

## 📞 Support

For questions or issues:
- GitHub Issues: Create an issue in this repository
- Email: support@yourdomain.com

---

## 🎉 Latest Updates (October 14, 2025)

✅ **Product-Template Assignment System**
- Individual product template selection
- Bulk template assignment
- Visual template indicators
- Accurate product counts for default templates

✅ **Excel File Support**
- Upload licenses from .xlsx and .xls files
- Automatic file type detection
- First column parsing
- Preview before upload

✅ **Production Ready**
- Full end-to-end testing complete
- Email delivery working
- Webhook automation tested
- All features operational

**Ready for deployment!** 🚀