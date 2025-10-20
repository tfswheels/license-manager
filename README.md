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

## ✨ Current Features

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
- Set shop default template
- **Automatic template assignment via rules** ⭐ NEW
- Template variable system: `{{first_name}}`, `{{last_name}}`, `{{order_number}}`, `{{license_keys}}`, `{{product_name}}`
- Template validation with warnings
- Click-to-insert variable palette

### 📦 Smart Product Management ✅
- GraphQL-based product fetching (retrieves ALL products, even 1000+)
- Advanced search (name, SKU, Shopify ID, variant ID)
- Bulk product selection with checkboxes
- Bulk template assignment
- Individual product template selection
- **Product metadata storage (tags, vendor, price)** ⭐ NEW
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

### ⚙️ Settings & Automation ✅ NEW
- **Template Assignment Rules Engine** - Auto-assign templates based on:
  - Product tags (e.g., "software", "game")
  - Vendor/manufacturer
  - Price ranges (e.g., $10-$50)
  - Collections (ID-based)
- **Rule Priority System** - Control rule application order
- **Exclusion Tags** - Bypass rules for specific products
- **Bulk Rule Application** - Apply rules to all products at once
- **Active/Inactive Rules** - Toggle rules without deletion

### 📊 Complete Admin Dashboard ✅
- Real-time statistics (orders, licenses, products)
- Shop selector for multi-store support
- Quick action cards with hover effects
- Order history with pagination
- License allocation status indicators
- Warning indicators for incomplete allocations
- Detailed order view
- **Settings page for system configuration** ⭐ NEW
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
    ├→ Check Product → Apply Template Rules → Get Template
    ├→ Allocate Licenses from Available Pool
    ├→ Send Custom Email (SendGrid)
    ├→ Update Database (mark allocated)
    └→ Check Inventory → Send Alert if Low
```

### Database Schema (9 Tables)

**Core Tables:**
- `shops` - Installed Shopify stores with OAuth tokens, exclusion tags
- `products` - Shopify products with tags, vendor, price, template assignment
- `licenses` - License keys with allocation status
- `orders` - Order records from Shopify
- `order_items` - Line items with allocation tracking
- `email_logs` - Audit trail of sent emails
- `email_templates` - Custom email templates
- `inventory_alerts` - Low stock notifications
- `template_assignment_rules` - **NEW** - Automatic template assignment rules

---

## 🎯 Complete Roadmap & Planned Improvements

### ✅ Phase 1: Core System (COMPLETE - October 2025)
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
- [x] **Template assignment rules** ⭐
- [x] **Settings page** ⭐

---

### 🚧 Phase 2: Enhanced Operations (IN PROGRESS - Q4 2025)

#### Order Management & Customer Service
1. [ ] **Manual License Allocation** 🔥 - Allocate licenses to orders that failed due to insufficient inventory
2. [ ] **Resend License Email** 🔥 - Re-send licenses to customer with current email address
3. [ ] **Update Customer Email** 🔥 - Change customer email address on order record
4. [ ] **Email Delivery Status Tracking** - Show delivery status (✅ Delivered, ⚠️ Pending, ❌ Failed/Bounced) using SendGrid webhooks
5. [ ] **Auto-retry Failed Allocations** - When licenses uploaded, prompt to auto-allocate to waiting orders
6. [ ] **Show Order Price** - Display order value on Orders page and Order details

#### Product & License Management
7. [ ] **Show Product Price** - Display product price on Products page (data already stored)
8. [ ] **Manual License Send** - Send license directly to customer (name + email), creates free order record
9. [ ] **License Send Method** - Choose allocation strategy: FIFO (first-in-first-out), LIFO (last-in-first-out), or Random
10. [ ] **License Uniqueness Enforcement** - Prevent duplicate license allocation if enabled
11. [ ] **Per-Order License Uniqueness** - Same order won't receive duplicate licenses (when uniqueness enabled)
12. [ ] **Out-of-Stock Behavior** - Configure what happens when no licenses available:
    - Don't send email
    - Replace `{{license_keys}}` with custom placeholder message
    - Send "Contact merchant" message

#### Template System
13. [x] **Template Assignment Rules** - Auto-assign templates based on:
    - [x] Product tags
    - [x] Price ranges
    - [x] Vendor
    - [ ] Collections (framework ready, needs full implementation)
14. [x] **Template Rule Exclusion Tag** - Add tag to products to exclude from automatic template rules
15. [x] **Template Rule Re-assignment** - When rules saved, re-assign all products automatically
16. [ ] **Template Preview Emails** - Send test emails with sample data
17. [ ] **Template Duplication** - Copy existing templates

#### Settings & Configuration
18. [x] **Settings Page** 🔥 - Centralized settings management for:
    - [x] Template assignment rules
    - [ ] License allocation strategy (infrastructure ready)
    - [ ] Uniqueness settings
    - [ ] Out-of-stock behavior
    - [ ] Email delivery preferences
19. [ ] **Email Settings Per Shop** - Custom from addresses and sender names
20. [ ] **Advanced Reporting** - Export orders, licenses, and analytics data

---

### 🔮 Phase 3: Advanced Features (2026)

#### License Management
21. [ ] **License Expiration Dates** - Time-limited licenses with auto-expiry
22. [ ] **License Usage Tracking** - Track activation and usage statistics
23. [ ] **License Auto-Generation** - Generate keys automatically using custom algorithms

#### Customer Experience
24. [ ] **Customer Portal** - Self-service license management for customers
25. [ ] **Multi-language Support** - Localized templates and UI

#### Developer & Integration
26. [ ] **Public API** - Developer API for custom integrations
27. [ ] **Webhook Retry Logic** - Automatic retry for failed webhooks
28. [ ] **Advanced Fraud Detection** - Suspicious order flagging and prevention

#### Analytics & Insights
29. [ ] **Analytics Dashboard** - Usage metrics, trends, and business intelligence
30. [ ] **Rich Text Template Editor** - WYSIWYG editor option for templates

---

## 📊 Feature Priority Matrix

| Priority | Features | Est. Time | Status |
|----------|----------|-----------|--------|
| 🔥 **HIGH** | Manual Allocation, Email Updates, Resend Email | 10-15 hours | Next Sprint |
| 🟡 **MEDIUM** | Delivery Status, Manual Send, Out-of-Stock Behavior, Uniqueness | 20-25 hours | Sprint 2-3 |
| 🟢 **LOW** | Price Display, Send Method, Template Preview, Reporting | 10-15 hours | Sprint 3-4 |
| ⚪ **DEFER** | Customer Portal, Auto-Gen, Fraud Detection, Analytics | 100+ hours | Phase 3 |

---

## 🗓️ Recommended Implementation Order

### ✅ **Sprint 1 (Week 1) - COMPLETE** 
1. ✅ Settings Page (infrastructure foundation)
2. ✅ Template Assignment Rules
3. ✅ Product metadata storage

**Completed: ~12 hours**

### **Sprint 2 (Week 2) - Core Customer Service** ⚡
1. Manual License Allocation
2. Update Customer Email
3. Resend License Email
4. Show Order/Product Prices

**Total: ~12-15 hours**

### **Sprint 3 (Week 3) - Customer Experience** 🎨
5. Out-of-Stock Behavior
6. Manual License Send
7. Template Preview Emails
8. Email Delivery Status

**Total: ~15-20 hours**

### **Sprint 4 (Week 4) - Advanced Features** 🚀
9. License Uniqueness Enforcement
10. License Send Method (FIFO/LIFO/Random)
11. Email Settings Per Shop
12. Auto-retry Failed Allocations

**Total: ~18-25 hours**

---

## 💡 Key Features vs Competitors

| Feature | This App | SendOwl | Sky Pilot |
|---------|----------|---------|-----------|
| Price | $19.99/mo | $15-159/mo | $15-35/mo |
| Unlimited Templates | ✅ | ❌ | ❌ |
| Product-Specific Templates | ✅ | ❌ | ❌ |
| **Template Assignment Rules** | ✅ ⭐ | ❌ | ❌ |
| Excel Upload | ✅ | ❌ | ❌ |
| Live Template Preview | ✅ | ❌ | ❌ |
| Modern UI | ✅ | ❌ | ⚠️ |
| Bulk Operations | ✅ | ⚠️ | ⚠️ |
| Real-time Stats | ✅ | ⚠️ | ⚠️ |
| GraphQL Product Fetch | ✅ | ❌ | ❌ |
| Multi-Shop Support | ✅ | ⚠️ | ⚠️ |
| License Uniqueness | 🔜 | ❌ | ⚠️ |

---

## 📝 Development Notes

### Database
- Uses UTC timestamps throughout
- Licenses can have duplicates (inventory system)
- Allocated licenses locked to `order_id`
- Products with NULL `email_template_id` use shop's default template
- **Template rules evaluated by priority (lower number = higher priority)**
- **Products store tags, vendor, price for rule matching**
- Connection pool max: 10 connections
- Index optimization on frequently queried fields

### Template Assignment Rules
- **Rule Types**: tag, vendor, price_range, collection
- **Priority System**: Rules evaluated in order (1-999, lower first)
- **Exclusion Mechanism**: Products with exclusion tag bypass all rules
- **Active/Inactive**: Toggle rules without deletion
- **Bulk Application**: Apply all rules to all products with one click
- **Automatic Updates**: Can trigger re-assignment when products added

### Email System
- Both HTML and plain text versions sent
- Plain text auto-generates from HTML if not provided
- SendGrid free tier: 100 emails/day
- Template variables replaced at send time
- Default template auto-created on shop install
- **Template selection via rules or manual assignment**
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

## 🐛 Known Issues

**None currently!** 🎉

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
POST /api/admin/shops/:id/fetch       - Fetch products from Shopify
POST /api/admin/products/add          - Add selected products
PUT  /api/admin/products/:id/template - Assign template to product
POST /api/admin/products/bulk-template - Bulk assign templates
DELETE /api/admin/products/:id        - Remove product from app
```

**Licenses:**
```
GET  /api/admin/products/:id/licenses - Get licenses for product
POST /api/admin/products/:id/licenses - Upload licenses
GET  /api/admin/licenses              - List all licenses
DELETE /api/admin/licenses/:id        - Delete unallocated license
```

**Orders:**
```
GET  /api/admin/orders           - List orders
GET  /api/admin/orders/:id       - Get order details
POST /api/admin/orders/:id/allocate - Manual allocation
```

**Templates:**
```
GET  /api/admin/templates        - List templates
POST /api/admin/templates        - Create template
GET  /api/admin/templates/:id    - Get template
PUT  /api/admin/templates/:id    - Update template
DELETE /api/admin/templates/:id  - Delete template
PUT  /api/admin/templates/:id/default - Set as default
```

**Template Rules (NEW):**
```
GET  /api/admin/shops/:id/template-rules              - Get all rules
POST /api/admin/shops/:id/template-rules              - Create rule
PUT  /api/admin/shops/:id/template-rules/:ruleId      - Update rule
DELETE /api/admin/shops/:id/template-rules/:ruleId    - Delete rule
POST /api/admin/shops/:id/template-rules/apply        - Apply all rules
GET  /api/admin/shops/:id/template-rules/exclusion-tag - Get exclusion tag
PUT  /api/admin/shops/:id/template-rules/exclusion-tag - Set exclusion tag
```

**Stats:**
```
GET  /api/admin/shops/:id/stats  - Get shop statistics
```

---

## 📦 Deployment

### Backend (Railway)
1. Create Railway project
2. Add MySQL plugin
3. Set environment variables
4. Deploy from GitHub
5. Configure domain

### Frontend (Vercel)
1. Import GitHub repository
2. Framework preset: Vite
3. Build: `npm run build`
4. Output: `dist`
5. Deploy

### Database Migrations

When deploying new features:
```bash
# Run migrations in order
node run-migration.js
```

---

## 🎓 Recent Updates

### October 17, 2025 - Settings & Template Rules
- ✅ Added Settings page with rule management UI
- ✅ Implemented template assignment rules engine
- ✅ Added product metadata storage (tags, vendor, price)
- ✅ Created rule priority system
- ✅ Added exclusion tag functionality
- ✅ Updated product fetching to include metadata
- ✅ Database schema expanded to 9 tables

---

**Built with ❤️ for digital product sellers who deserve better tools.**