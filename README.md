# License Manager for Shopify

A complete digital license distribution system for Shopify stores. Automatically sends license keys to customers after purchase with custom email templates.

**Built by a real SendOwl customer who needed a better solution.** 🚀

---

## 🎯 Project Overview

**Status:** 🟢 **LIVE IN PRODUCTION**  
**Deployed:** October 14, 2025  
**Frontend:** https://license-manager-lovat.vercel.app  
**Backend API:** https://license-manager-production-96dd.up.railway.app  

### Tech Stack
- **Backend:** Node.js, Express, MySQL, Shopify API, SendGrid  
- **Frontend:** React 19, Vite, Tailwind CSS  
- **Infrastructure:** Railway (backend), Vercel (frontend), Google Cloud SQL (database)

---

## ✨ Features

### 🚀 Automatic License Delivery ✅
- Webhook-driven automation (orders/create)
- Real-time order processing
- Instant email delivery via SendGrid
- License allocation tracking
- Inventory monitoring with low-stock alerts

### 📧 Custom Email Templates ✅
- Unlimited custom templates per shop
- Split-screen editor with live preview
- HTML and plain text versions
- Auto-generate plain text from HTML
- Product-specific template assignment
- Set shop default template (⭐)
- Template variable system: `{{first_name}}`, `{{last_name}}`, `{{order_number}}`, `{{license_keys}}`, `{{product_name}}`
- Template validation with warnings
- Click-to-insert variable palette

### 📦 Smart Product Management ✅
- GraphQL-based product fetching (retrieves ALL products, even 1000+)
- Advanced search (name, SKU, Shopify ID, variant ID)
- Bulk product selection with checkboxes
- Bulk template assignment
- Individual product template selection
- License inventory tracking per product
- Pagination (25/50/100/250 per page)
- Product filtering and sorting

### 🔑 Flexible License Upload ✅
- CSV file support (.csv)
- Excel file support (.xlsx, .xls)
- Drag-and-drop upload interface
- Upload preview with validation
- View all licenses (paginated)
- Filter by status (available/allocated)
- Delete unallocated licenses
- Release allocated licenses back to pool
- Download license lists

### 📊 Complete Admin Dashboard ✅
- Real-time statistics (orders, licenses, products)
- Shop selector for multi-store support
- Quick action cards
- Order history with pagination
- License allocation status indicators
- Warning indicators for incomplete allocations
- Detailed order view
- Responsive design
- Modern UI with Tailwind CSS

### 🔐 Security & Compliance ✅
- OAuth 2.0 for Shopify authentication
- HMAC webhook signature verification
- Database connection pooling with prepared statements
- Environment variable configuration (no secrets in code)
- CORS restricted to admin panel origin
- Template validation (prevents XSS)
- Railway IP whitelist on Cloud SQL database
- Private network database connection (Railway internal)

---

## 🏗️ Architecture

```
Customer Order (Shopify)
    ↓
Webhook Handler (Auto-registered on install)
    ↓
License Allocator
    ├→ Check Product → Get Assigned Template
    ├→ Allocate Licenses from Available Pool
    ├→ Send Custom Email (SendGrid)
    ├→ Update Database (mark allocated)
    └→ Check Inventory → Send Alert if Low
```

### Database Schema (8 Tables)

**Core Tables:**
- `shops` - Installed Shopify stores with OAuth tokens
- `products` - Shopify products linked to license pools and templates
- `licenses` - License keys with allocation status
- `orders` - Order records from Shopify webhooks
- `order_items` - Line items with allocation tracking

**Supporting Tables:**
- `email_logs` - Email delivery audit trail
- `inventory_alerts` - Low stock notifications
- `email_templates` - Custom email templates per shop

**Key Relationships:**
- Products → Licenses (one-to-many)
- Products → Templates (many-to-one, nullable)
- Shops → Templates (one default per shop)
- Orders → Licenses (via order_items)

---

## 🚀 Deployment (Production)

### Live URLs

**Frontend (Vercel):**
```
https://license-manager-lovat.vercel.app
```

**Backend API (Railway):**
```
https://license-manager-production-96dd.up.railway.app
```

**Database:**
- Railway MySQL (private network)
- Connected via mysql.railway.internal
- No public access required

### Environment Variables

**Backend (Railway):**
PORT=8080
NODE_ENV=production
APP_URL=https://license-manager-production-96dd.up.railway.app

# Database (Railway MySQL - Private Network)
DB_HOST=mysql.railway.internal
DB_USER=root
DB_PASSWORD=[SECURE]
DB_NAME=railway
DB_PORT=3306

# Shopify
SHOPIFY_API_KEY=[KEY]
SHOPIFY_API_SECRET=[SECRET]
SHOPIFY_SCOPES=read_products,read_orders,read_customers
SHOPIFY_REDIRECT_URI=https://license-manager-production-96dd.up.railway.app/auth/callback
SHOPIFY_WEBHOOK_SECRET=[SECRET]

# SendGrid
SENDGRID_API_KEY=[KEY]
FROM_EMAIL=jeremiah@tfswheels.com
FROM_NAME=TFS License Manager

# Alerts
ADMIN_EMAIL=jeremiah@tfswheels.com
LOW_INVENTORY_THRESHOLD=10

**Frontend (Vercel):**
- Automatically uses production API URL via `import.meta.env.PROD` check

### Deployment Process

**Backend (Railway):**
1. Connected to GitHub repo
2. Root directory: `server`
3. Auto-deploys on push to `main`
4. Build: `npm install`
5. Start: `npm start`

**Database (Railway MySQL):**
1. Managed MySQL instance
2. Private network connection
3. Automatic backups
4. Connected to backend via internal network

**Frontend (Vercel):**
1. Connected to GitHub repo
2. Root directory: `admin`
3. Framework preset: Vite
4. Build: `npm run build`
5. Output: `dist`
6. Auto-deploys on push to `main`

---

## 🛠️ Local Development

### Prerequisites
- Node.js v20+
- MySQL database
- Shopify Partner account
- SendGrid account

### Setup

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

# 5. Start development servers
# Terminal 1 - Backend
cd server
npm run dev  # Runs on http://localhost:3001

# Terminal 2 - Frontend
cd admin
npm run dev  # Runs on http://localhost:5173
```

### Testing Webhooks Locally

Use ngrok to expose your local server:

```bash
ngrok http 3001

# Update Shopify Partner app with ngrok URL
# Update server/.env APP_URL with ngrok URL
```

---

## 📱 Admin Dashboard Pages

### Dashboard
- Real-time stats: Total orders, licenses, products
- Shop selector dropdown
- Quick action cards
- Recent activity

### Products
- List all Shopify products
- Search bar (name, SKU, ID, variant)
- Bulk select with checkboxes
- Template assignment dropdown per product
- Bulk template assignment
- License count per product
- Add/remove products from system
- Pagination controls

### Licenses
- Upload via CSV or Excel
- Drag-and-drop interface
- Preview before upload
- View all licenses table
- Filter: All / Available / Allocated
- Actions: Delete unallocated, Release allocated
- Download as CSV
- Pagination

### Orders
- Order history table
- License allocation status badges
- Warning indicators for incomplete allocations
- Detailed order view modal
- Manual license allocation (coming soon)
- Email delivery status (coming soon)
- Resend license emails (coming soon)

### Templates
- Template list with search
- Create/Edit/Delete templates
- Set default template (⭐ icon)
- Product count per template
- Template editor:
  - Split-screen layout
  - HTML and Plain Text tabs
  - Live preview with sample data
  - Variable palette (click to insert)
  - Auto-generate plain text from HTML
  - Subject line editor
  - Template validation

---

## 📡 API Endpoints

### Authentication
```
GET  /auth/install       - Start OAuth flow
GET  /auth/callback      - OAuth callback with webhook registration
GET  /auth/status        - Check installation status
```

### Webhooks
```
POST /webhooks/orders/create  - Order creation webhook (auto-registered)
```

### Admin API

**Shops:**
```
GET  /api/admin/shops    - List installed shops
```

**Products:**
```
GET  /api/admin/products              - List products for shop
POST /api/admin/shops/:id/fetch       - Fetch products from Shopify (GraphQL)
POST /api/admin/shops/:id/add         - Add selected products
POST /api/admin/products/:id          - Update product (template assignment)
POST /api/admin/products/bulk-assign  - Bulk template assignment
DELETE /api/admin/products/:id        - Remove product
```

**Licenses:**
```
GET  /api/admin/licenses                    - List licenses
POST /api/admin/products/:id/licenses/bulk  - Upload licenses (CSV/Excel)
PUT  /api/admin/licenses/:id                - Update license
DELETE /api/admin/licenses/:id              - Delete license
```

**Orders:**
```
GET  /api/admin/orders         - List orders
GET  /api/admin/orders/:id     - Get order details
```

**Templates:**
```
GET    /api/admin/templates       - List templates
GET    /api/admin/templates/:id   - Get template
POST   /api/admin/templates       - Create template
PUT    /api/admin/templates/:id   - Update template
DELETE /api/admin/templates/:id   - Delete template
POST   /api/admin/templates/:id/default  - Set as default
```

---

## 🔄 Workflows

### Automatic Allocation Flow

1. Customer places order on Shopify
2. Shopify sends `orders/create` webhook
3. System receives webhook (signature verified)
4. For each line item:
   - Check if product exists in system
   - Get product's assigned template (or shop default)
   - Allocate required number of licenses
   - Mark licenses as allocated
5. Send email with licenses using template
6. Log email delivery
7. Check inventory levels
8. Send alert if below threshold

### Manual Upload Flow

1. Admin uploads licenses (CSV or Excel)
2. System validates file format
3. Preview shown to admin
4. Admin confirms upload
5. Licenses added to product pool
6. Available count updated
7. Inventory alert cleared if resolved

### Template Assignment Flow

1. Admin creates custom template
2. Admin assigns template to specific products
3. Or sets template as shop default
4. When order comes in:
   - Check product's template
   - If null, use shop default
   - Render template with order variables
   - Send email

---

## 🎯 Roadmap

### ✅ Phase 1: Core System (COMPLETE)
- [x] OAuth installation flow
- [x] Webhook processing
- [x] License allocation engine
- [x] Email delivery system
- [x] Admin dashboard
- [x] Product management
- [x] License upload (CSV + Excel)
- [x] Custom email templates
- [x] Template editor with live preview
- [x] Production deployment

### 🚧 Phase 2: Enhanced Operations (NEXT - Q4 2025)
- [ ] **Manual license allocation** - Allocate licenses to orders that failed
- [ ] **Email delivery tracking** - Show success/failure status on orders page
- [ ] **Resend license emails** - Re-send same licenses to customer
- [ ] **Auto-retry failed allocations** - When licenses uploaded, auto-allocate to waiting orders
- [ ] Template preview emails - Send test emails
- [ ] Template duplication - Copy existing templates
- [ ] Rich text template editor - WYSIWYG editor option
- [ ] Email settings per shop - Custom from addresses
- [ ] Advanced reporting - Export orders, licenses, analytics

### 🔮 Phase 3: Advanced Features (2026)
- [ ] License expiration dates - Time-limited licenses
- [ ] Usage tracking - Track license activation/usage
- [ ] Customer portal - Self-service license management
- [ ] License auto-generation - Generate keys automatically
- [ ] Multi-language support - Localized templates
- [ ] Custom template rules - By tag, vendor, collection
- [ ] API for developers - Public API access
- [ ] Webhook retry logic - Automatic retry on failures
- [ ] Advanced fraud detection - Suspicious order flagging
- [ ] Analytics dashboard - Usage metrics, trends

---

## 📋 Planned Improvements

### Priority Improvements (From User Feedback)

#### 1. Manual License Allocation 🔥
**Problem:** If an order comes in but no licenses are available, the order fails. Currently, admin must manually send licenses to customers.

**Solution:**
- Add "Manual Allocation" button on orders with failed allocations
- When admin uploads new licenses, show option to:
  - Auto-allocate to waiting orders
  - Or manually select which orders to fulfill
- Resend email automatically after allocation
- Update order status to "Fulfilled"

**Implementation:**
```
Orders Page → Show "Needs Licenses" badge
Click order → See "Allocate Licenses" button
Admin uploads licenses → Prompt: "Allocate to 3 waiting orders?"
System allocates → Sends emails → Updates status
```

#### 2. Email Delivery Tracking 📧
**Problem:** Can't see if email was successfully delivered or bounced.

**Solution:**
- Add `delivery_status` column to `email_logs` table
- Integrate SendGrid webhook events (delivered, bounced, etc.)
- Display status on Orders page:
  - ✅ Delivered
  - ⚠️ Pending
  - ❌ Failed/Bounced
- Click status to see full delivery log

#### 3. Resend License Email 🔄
**Problem:** Customer didn't receive email or deleted it.

**Solution:**
- Add "Resend Email" button on order details
- Sends same allocated licenses
- Uses current template assignment (in case template was updated)
- Logs as separate email entry
- Shows "Resent" badge with timestamp

---

## 🐛 Known Issues

**None currently!** 🎉

The app is stable and production-ready.

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
| GraphQL Product Fetch | ✅ | ❌ | ❌ |
| Multi-Shop Support | ✅ | ⚠️ | ⚠️ |

---

## 📝 Development Notes

### Database
- Uses UTC timestamps throughout
- Licenses can have duplicates (inventory system)
- Allocated licenses locked to `order_id`
- Products with NULL `email_template_id` use shop's default template
- Connection pool max: 10 connections
- Index optimization on frequently queried fields

### Email System
- Both HTML and plain text versions sent
- Plain text auto-generates from HTML if not provided
- SendGrid free tier: 100 emails/day
- Template variables replaced at send time
- Default template auto-created on shop install
- Customer name handling: Uses first/last name or defaults to "Customer"

### Webhooks
- Auto-registered during OAuth installation
- Signature verified using HMAC with `SHOPIFY_WEBHOOK_SECRET`
- Async processing (responds 200 OK immediately to Shopify)
- Errors logged but don't block webhook response
- 5-second timeout for webhook processing
- Idempotent handling (won't process same order twice)

### Frontend
- React 19 with hooks
- Vite for fast builds
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls
- Excel parsing via SheetJS
- CSV parsing via PapaCSV
- Icon library: Lucide React

### Backend
- Express server with ES6 modules
- MySQL connection pooling
- Shopify SDK for OAuth and API calls
- SendGrid for email delivery
- CORS enabled for Vercel frontend
- Environment-based configuration
- RESTful API design

---

## 🔐 Security Checklist

- [x] OAuth 2.0 implementation
- [x] Webhook signature verification
- [x] Environment variables for secrets
- [x] Database connection pooling
- [x] SQL injection prevention (prepared statements)
- [x] CORS whitelist
- [x] XSS prevention in templates
- [x] HTTPS enforced (Railway + Vercel)
- [x] Database IP whitelist
- [x] No secrets in code/git
- [x] Secure password storage (OAuth tokens)

---

## 👥 Team

**Developer:** Jeremiah (tfswheels)  
**GitHub:** https://github.com/tfswheels/license-manager  
**Contact:** jeremiah@tfswheels.com  

---

## 📄 License

Private project - All rights reserved  
© 2025 TFS Wheels

---

## 🎉 Project Timeline

- **October 13, 2025** - Project started, backend complete
- **October 14, 2025** - Frontend complete, production deployment
- **October 15, 2025** - Database migrated to Railway (private network)

- **Status:** Live and operational! 🚀

---

## 📞 Support

For questions or issues:
- **GitHub Issues:** Create an issue in this repository
- **Email:** jeremiah@tfswheels.com

---

## 🙏 Acknowledgments

Built with:
- [Shopify](https://shopify.dev) - E-commerce platform
- [SendGrid](https://sendgrid.com) - Email delivery
- [Railway](https://railway.app) - Backend hosting
- [Vercel](https://vercel.com) - Frontend hosting
- [Google Cloud](https://cloud.google.com) - Database hosting

**Ready for customers!** 🎯