# DigiKey HQ - License Manager for Shopify

A complete digital license distribution system for Shopify stores. Automatically sends license keys to customers after purchase with custom email templates.

**Built by a real SendOwl customer who needed a better solution.** 🚀

---

## 🎯 Project Overview

**Status:** 🟢 **SHOPIFY APP STORE READY**
**Deployed:** October 2025
**Website:** https://digikeyhq.com
**API:** https://api.digikeyhq.com

### Tech Stack
- **Backend:** Node.js, Express, MySQL, Shopify API, SendGrid
- **Frontend:** React 18, Vite 5, Tailwind CSS 4
- **Infrastructure:** Railway (backend), Vercel (frontend), Google Cloud SQL (database)
- **Integration:** Shopify App Bridge 3.x, OAuth 2.0, Session Tokens

---

## ✨ Current Features

### 🏪 Shopify App Store Ready ✅ NEW
- **GDPR Compliance** - All 3 mandatory webhooks implemented
- **Legal Documentation** - Privacy Policy, Terms of Service, GDPR Compliance pages
- **App Billing** - 4 subscription tiers with free trials
- **Embedded App** - Seamless integration with Shopify Admin via App Bridge
- **Security Headers** - Comprehensive CSP, HSTS, and security best practices
- **Session Token Auth** - JWT-based authentication for embedded apps

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
- **Automatic template assignment via rules** ⭐
- Template variable system: `{{first_name}}`, `{{last_name}}`, `{{order_number}}`, `{{license_keys}}`, `{{product_name}}`
- Template validation with warnings
- Click-to-insert variable palette

### 📦 Smart Product Management ✅
- GraphQL-based product fetching (retrieves ALL products, even 1000+)
- Advanced search (name, SKU, Shopify ID, variant ID)
- Bulk product selection with checkboxes
- Bulk template assignment
- Individual product template selection
- **Product metadata storage (tags, vendor, price)** ⭐
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

### ⚙️ System Settings ✅
- **License Delivery Method** - Choose FIFO (oldest first) or LIFO (newest first)
- **License Uniqueness Enforcement** - Prevent duplicate license allocation
- **Per-Order Uniqueness** - No duplicate licenses within same order
- **Out-of-Stock Behavior** - Configure what happens when licenses unavailable:
  - Don't send email
  - Send with custom placeholder message
- **Email Settings (SaaS Architecture)** - Multi-tenant email delivery:
  - Custom shop display name
  - Reply-to email address (customer replies go to merchant)
  - Advanced: Custom sender email (requires domain verification)
- **Notification Settings** - Admin alerts for:
  - Out of stock situations
  - Uniqueness constraint issues
- **Template Assignment Rules Engine** - Auto-assign templates based on:
  - Product tags (e.g., "software", "game")
  - Vendor/manufacturer
  - Price ranges (e.g., $10-$50)
  - Collections (ID-based)
- **Rule Priority System** - Control rule application order
- **Exclusion Tags** - Bypass rules for specific products
- **Bulk Rule Application** - Apply rules to all products at once
- **Active/Inactive Rules** - Toggle rules without deletion

### 💰 Shopify App Billing ✅ NEW
- **Free Tier** - 2 products, 100 licenses
- **Basic** - $9.99/mo, 10 products, 1K licenses, 7-day trial
- **Professional** - $29.99/mo, 50 products, 10K licenses, advanced rules
- **Enterprise** - $99.99/mo, unlimited products/licenses, dedicated support
- Automatic subscription management
- Free trial periods
- Usage-based limits
- Seamless plan upgrades

### 🔐 GDPR Compliance ✅ NEW
- **customers/data_request** - Export customer data on request
- **customers/redact** - Anonymize customer data after 48 hours
- **shop/redact** - Delete all shop data after app uninstall
- Audit logging for all GDPR requests
- Privacy Policy (https://digikeyhq.com/privacy-policy)
- Terms of Service (https://digikeyhq.com/terms-of-service)
- GDPR Compliance page (https://digikeyhq.com/gdpr-compliance)

### 📊 Complete Admin Dashboard ✅
- Real-time statistics (orders, licenses, products)
- Shop selector for multi-store support
- Quick action cards with hover effects
- Order history with pagination
- License allocation status indicators
- Warning indicators for incomplete allocations
- Detailed order view
- **Settings page for system configuration** ⭐
- **Embedded in Shopify Admin** ⭐ NEW
- Responsive design
- Modern UI with Tailwind CSS

### 🔐 Security & Compliance ✅
- OAuth 2.0 for Shopify authentication
- **Session Token Authentication** (JWT) for embedded apps
- HMAC webhook signature verification
- **Comprehensive Security Headers:**
  - Content-Security-Policy (CSP)
  - X-Frame-Options (for embedding)
  - Strict-Transport-Security (HSTS)
  - X-Content-Type-Options
  - Referrer-Policy
  - Permissions-Policy
- Database connection pooling with prepared statements
- Environment variable configuration (no secrets in code)
- CORS restricted to trusted origins
- Template validation (prevents XSS)
- Railway IP whitelist on Cloud SQL database
- Private network database connection (Railway internal)

---

## 🏗️ Architecture

### Application Flow
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

### Shopify Integration
```
Merchant Installs App
    ↓
OAuth Flow (api.digikeyhq.com/auth)
    ↓
Shop Saved + Webhooks Registered
    ↓
Redirect to Embedded App (digikeyhq.com)
    ↓
App Bridge Initializes
    ↓
Session Token Authentication
    ↓
App Loads in Shopify Admin iframe
```

### Database Schema (12 Tables)

**Core Tables:**
- `shops` - Installed Shopify stores with OAuth tokens, exclusion tags
- `products` - Shopify products with tags, vendor, price, template assignment
- `licenses` - License keys with allocation status
- `orders` - Order records from Shopify
- `order_items` - Line items with allocation tracking
- `email_logs` - Audit trail of sent emails
- `email_templates` - Custom email templates
- `inventory_alerts` - Low stock notifications
- `template_assignment_rules` - Automatic template assignment rules
- `shop_settings` - Comprehensive system settings per shop
- `subscriptions` - **NEW** - Shopify billing subscriptions
- `gdpr_requests` - **NEW** - GDPR compliance audit log

---

## 🎯 Complete Roadmap

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
- [x] Template assignment rules
- [x] Settings page
- [x] **Shopify App Store integration** ⭐
- [x] **GDPR compliance webhooks** ⭐
- [x] **App billing system** ⭐
- [x] **Embedded app with App Bridge** ⭐
- [x] **Security headers** ⭐

---

### 🚧 Phase 2: Enhanced Operations (IN PROGRESS - Q4 2025)

#### Order Management & Customer Service
1. [ ] **Manual License Allocation** 🔥 - Allocate licenses to orders that failed
2. [ ] **Resend License Email** 🔥 - Re-send licenses with current email
3. [ ] **Update Customer Email** 🔥 - Change customer email on order
4. [ ] **Email Delivery Status Tracking** - Show delivery status with SendGrid webhooks
5. [ ] **Auto-retry Failed Allocations** - Prompt to allocate when licenses uploaded

#### Product & License Management
6. [ ] **Show Product Price** - Display product price on Products page
7. [ ] **Manual License Send** - Send license directly to customer
8. [ ] **License Expiration Dates** - Time-limited licenses

#### Template System
9. [ ] **Template Preview Emails** - Send test emails with sample data
10. [ ] **Template Duplication** - Copy existing templates

#### Analytics & Reporting
11. [ ] **Advanced Reporting** - Export orders, licenses, analytics
12. [ ] **Analytics Dashboard** - Usage metrics and trends

---

### 🔮 Phase 3: Advanced Features (2026)

#### Customer Experience
- [ ] **Customer Portal** - Self-service license management
- [ ] **Multi-language Support** - Localized templates and UI

#### Developer & Integration
- [ ] **Public API** - Developer API for custom integrations
- [ ] **Webhook Retry Logic** - Automatic retry for failed webhooks
- [ ] **Advanced Fraud Detection** - Suspicious order flagging

#### License Management
- [ ] **License Usage Tracking** - Track activation and usage
- [ ] **License Auto-Generation** - Generate keys automatically

---

## 💡 Competitive Advantages

| Feature | DigiKey HQ | SendOwl | Sky Pilot |
|---------|-----------|---------|-----------|
| **Price** | $9.99-99.99/mo | $15-159/mo | $15-35/mo |
| **Shopify App Store** | ✅ | ❌ | ✅ |
| **Embedded App** | ✅ | ❌ | ✅ |
| **Unlimited Templates** | ✅ | ❌ | ❌ |
| **Template Assignment Rules** | ✅ ⭐ | ❌ | ❌ |
| **Excel Upload** | ✅ | ❌ | ❌ |
| **Live Template Preview** | ✅ | ❌ | ❌ |
| **GDPR Compliant** | ✅ | ⚠️ | ⚠️ |
| **Modern UI** | ✅ | ❌ | ⚠️ |
| **GraphQL Product Fetch** | ✅ | ❌ | ❌ |
| **Custom Email Settings** | ✅ | ❌ | ❌ |
| **Bulk Operations** | ✅ | ⚠️ | ⚠️ |

---

## 📝 Development Notes

### Shopify Integration
- **Embedded App Mode** - Runs inside Shopify Admin iframe
- **App Bridge 3.x** - Modern embedded app framework
- **Session Tokens** - JWT-based authentication (no cookies)
- **OAuth 2.0** - Initial installation flow
- **Webhooks** - Auto-registered on installation
- **Billing API** - GraphQL mutations for subscriptions

### GDPR Compliance
- **customers/data_request** - Collects order and email data
- **customers/redact** - Anonymizes PII after 48 hours
- **shop/redact** - Complete data deletion after uninstall
- **Audit Logging** - All GDPR requests logged
- **Public Legal Pages** - Accessible without authentication

### Database
- Uses UTC timestamps throughout
- Licenses can have duplicates (inventory system)
- Allocated licenses locked to `order_id`
- Products with NULL `email_template_id` use shop's default
- Template rules evaluated by priority (lower = higher priority)
- Connection pool max: 10 connections
- Index optimization on frequently queried fields

### Email System
- Both HTML and plain text versions sent
- Plain text auto-generates from HTML if not provided
- SendGrid free tier: 100 emails/day
- Template variables replaced at send time
- Default template auto-created on shop install
- SaaS architecture with reply-to support

### Security
- **CSP** - Restricts resource loading to trusted sources
- **Session Tokens** - Auto-refresh every minute
- **HMAC Verification** - All webhooks verified
- **Prepared Statements** - SQL injection prevention
- **Environment Variables** - No secrets in code
- **HTTPS Only** - Enforced in production

---

## 🔐 Security Checklist

- [x] OAuth 2.0 implementation
- [x] Session token authentication
- [x] Webhook signature verification (HMAC)
- [x] Environment variables for secrets
- [x] Database connection pooling
- [x] SQL injection prevention (prepared statements)
- [x] CORS whitelist
- [x] XSS prevention in templates
- [x] HTTPS enforced (Railway + Vercel)
- [x] Database IP whitelist
- [x] No secrets in code/git
- [x] Content Security Policy (CSP)
- [x] Security headers (HSTS, X-Frame-Options, etc.)
- [x] GDPR compliance
- [x] Rate limiting headers

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

cd ../admin
cp .env.example .env
# Edit .env with your API key

# 4. Setup database
cd ../server
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

### Testing GDPR Webhooks

```bash
# Install Shopify CLI
npm install -g @shopify/cli @shopify/app

# Trigger webhooks
shopify webhook trigger --topic customers/data_request
shopify webhook trigger --topic customers/redact
shopify webhook trigger --topic shop/redact
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
POST /webhooks/orders/create                      - Order creation webhook
POST /webhooks/gdpr/customers/data_request        - GDPR data export
POST /webhooks/gdpr/customers/redact              - GDPR customer deletion
POST /webhooks/gdpr/shop/redact                   - GDPR shop deletion
POST /webhooks/sendgrid                           - SendGrid delivery status
```

### Billing
```
GET  /auth/billing/status       - Check subscription status
POST /auth/billing/subscribe    - Create subscription
POST /auth/billing/cancel       - Cancel subscription
GET  /auth/billing/callback     - Billing confirmation
GET  /auth/billing/plans        - List available plans
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

**Template Rules:**
```
GET  /api/admin/shops/:id/template-rules              - Get all rules
POST /api/admin/shops/:id/template-rules              - Create rule
PUT  /api/admin/shops/:id/template-rules/:ruleId      - Update rule
DELETE /api/admin/shops/:id/template-rules/:ruleId    - Delete rule
POST /api/admin/shops/:id/template-rules/apply        - Apply all rules
```

**System Settings:**
```
GET  /api/admin/shops/:id/settings       - Get shop settings
PUT  /api/admin/shops/:id/settings       - Update shop settings
POST /api/admin/shops/:id/settings/reset - Reset settings to defaults
```

**Stats:**
```
GET  /api/admin/shops/:id/stats  - Get shop statistics
```

---

## 📦 Deployment

### Production URLs
- **Frontend:** https://digikeyhq.com
- **Backend:** https://api.digikeyhq.com
- **Database:** Google Cloud SQL (MySQL)

### Backend (Railway)
1. Create Railway project
2. Add MySQL plugin (or connect external)
3. Set environment variables:
   ```bash
   APP_URL=https://api.digikeyhq.com
   FRONTEND_URL=https://digikeyhq.com
   SHOPIFY_API_KEY=...
   SHOPIFY_API_SECRET=...
   # ... see .env.example
   ```
4. Deploy from GitHub
5. Configure custom domain: `api.digikeyhq.com`

### Frontend (Vercel)
1. Import GitHub repository
2. Framework preset: Vite
3. Root Directory: `admin`
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Environment variables:
   ```bash
   VITE_SHOPIFY_API_KEY=...
   VITE_API_URL=https://api.digikeyhq.com
   VITE_ENV=production
   ```
7. Configure custom domain: `digikeyhq.com`

### Database Migrations

Run migrations in order:
```bash
001_initial_schema.sql
002_email_templates.sql
002_add_manual_orders.sql
003_template_assignment_rules.sql
004_add_price_columns.sql
005_shop_settings.sql
006_add_reply_to_email.sql
007_gdpr_requests.sql          # NEW - GDPR audit logging
008_subscriptions.sql          # NEW - Shopify billing
```

### Shopify Partner Dashboard Configuration

**App URL:** `https://digikeyhq.com`

**Allowed redirection URL(s):**
```
https://api.digikeyhq.com/auth/callback
```

**Embedded app:** ✅ **Enabled**

**Webhooks:**
- `orders/create` → `https://api.digikeyhq.com/webhooks/orders/create`
- `customers/data_request` → `https://api.digikeyhq.com/webhooks/gdpr/customers/data_request`
- `customers/redact` → `https://api.digikeyhq.com/webhooks/gdpr/customers/redact`
- `shop/redact` → `https://api.digikeyhq.com/webhooks/gdpr/shop/redact`

**Legal URLs:**
- Privacy Policy: `https://digikeyhq.com/privacy-policy`
- Terms of Service: `https://digikeyhq.com/terms-of-service`

**App Scopes:**
```
read_products, read_orders, read_customers
```

---

## 🎓 Recent Updates

### October 22, 2025 - Shopify App Store Ready 🎉
- ✅ Implemented all 3 mandatory GDPR webhooks
- ✅ Created public legal documentation pages
- ✅ Integrated Shopify Billing API with 4 subscription tiers
- ✅ Converted to embedded app with App Bridge 3.x
- ✅ Implemented session token authentication
- ✅ Added comprehensive security headers (CSP, HSTS, etc.)
- ✅ Updated OAuth flow for embedded apps
- ✅ Created SHOPIFY_INTEGRATION.md documentation
- ✅ Fixed navigation parameter persistence
- ✅ Made legal pages publicly accessible
- ✅ **Custom domain: digikeyhq.com** 🎯

### October 22, 2025 - Comprehensive System Settings
- ✅ Added System Settings page with full configuration UI
- ✅ Implemented license delivery method (FIFO/LIFO)
- ✅ Added license uniqueness enforcement
- ✅ Configured out-of-stock behavior
- ✅ Implemented SaaS email architecture
- ✅ Added notification system for admin alerts

### October 17, 2025 - Template Rules Engine
- ✅ Added Template Rules page with rule management UI
- ✅ Implemented template assignment rules engine
- ✅ Added product metadata storage (tags, vendor, price)
- ✅ Created rule priority system
- ✅ Added exclusion tag functionality

---

## 📚 Documentation

- **README.md** - This file (project overview)
- **SHOPIFY_INTEGRATION.md** - Complete Shopify integration guide
- **server/.env.example** - Backend environment variables
- **admin/.env.example** - Frontend environment variables

---

## 🌐 Links

- **Website:** https://digikeyhq.com
- **API:** https://api.digikeyhq.com
- **Privacy Policy:** https://digikeyhq.com/privacy-policy
- **Terms of Service:** https://digikeyhq.com/terms-of-service
- **GDPR Compliance:** https://digikeyhq.com/gdpr-compliance
- **Support:** support@digikeyhq.com

---

## 📄 License

Proprietary - All rights reserved

---

**Built with ❤️ for digital product sellers who deserve better tools.**

**DigiKey HQ** - Professional license management for Shopify stores.
