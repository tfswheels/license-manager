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
- **Responsive Design** - Mobile-first design with card views ⭐ NEW
- **Compact Embedded UI** - Shopify-native compact design ⭐ NEW

### 🚀 Automatic License Delivery ✅
- Webhook-driven automation (orders/create)
- Real-time order processing
- Instant email delivery via SendGrid
- License allocation tracking
- Inventory monitoring with low-stock alerts
- **Free License Allocation** - Send licenses manually to any email ⭐ NEW

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
- **Smart Reply-To Email** - Auto-populates with shop email ⭐ NEW

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
- **Mobile card view** - Responsive card layout on mobile ⭐ NEW

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
  - **Reply-to email address** - Auto-populated with shop email ⭐ NEW
  - Customers reply directly to merchant
  - Advanced: Custom sender email (requires domain verification)
  - Default sender: mail@digikeyhq.com ⭐ NEW
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
- **Fully responsive design** - Desktop, tablet, mobile ⭐ NEW
- **Mobile-first card views** - Touch-friendly interface ⭐ NEW
- **Collapsible sidebar** - Hamburger menu on mobile ⭐ NEW
- Modern UI with Tailwind CSS

### 📱 Responsive Design ✅ NEW
- **Mobile-First Architecture** - Optimized for all screen sizes
- **Breakpoints:**
  - Desktop (>1024px) - Full table view
  - Tablet (768-1024px) - Card view with visible sidebar
  - Mobile (<768px) - Card view with collapsible sidebar
  - Small (<640px) - Optimized single column
- **Touch Optimizations:**
  - 44px minimum tap targets (Apple/Android guidelines)
  - Horizontal scroll with momentum
  - Custom styled scrollbars
  - Landscape mode support
- **Responsive Components:**
  - Tables → Cards on mobile
  - Stacked buttons and forms
  - Full-width modals on small screens
  - Collapsible navigation
- **Embedded Mode:**
  - Compact Shopify-native design
  - Smaller fonts and spacing
  - Shopify green color scheme
  - Auto-detection of embedded environment

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
    │   ├→ FROM: mail@digikeyhq.com
    │   ├→ REPLY-TO: shop@example.com (auto-populated)
    │   └→ Can be overridden in settings
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
    ↓
Responsive UI Detects Screen Size
    ↓
Compact Design (Embedded) + Mobile Layout (if small screen)
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
- `shop_settings` - Comprehensive system settings per shop (includes auto-populated reply-to)
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
- [x] **Fully responsive mobile design** ⭐ NEW
- [x] **Compact embedded UI** ⭐ NEW
- [x] **Auto-populate shop email for reply-to** ⭐ NEW
- [x] **Free license allocation** ⭐ NEW

---

### 🚧 Phase 2: Enhanced Operations (IN PROGRESS - Q4 2025)

#### Order Management & Customer Service
1. [x] **Manual License Allocation** ✅ - Allocate licenses to orders that failed
2. [x] **Manual License Send** ✅ - Send license directly to any customer email (FREE orders)
3. [ ] **Resend License Email** 🔥 - Re-send licenses with current email
4. [ ] **Update Customer Email** 🔥 - Change customer email on order
5. [ ] **Email Delivery Status Tracking** - Show delivery status with SendGrid webhooks
6. [ ] **Auto-retry Failed Allocations** - Prompt to allocate when licenses uploaded

#### Product & License Management
7. [x] **Show Product Price** ✅ - Display product price on Products page
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
| **Mobile Responsive** | ✅ ⭐ | ❌ | ⚠️ |
| **Unlimited Templates** | ✅ | ❌ | ❌ |
| **Template Assignment Rules** | ✅ ⭐ | ❌ | ❌ |
| **Excel Upload** | ✅ | ❌ | ❌ |
| **Live Template Preview** | ✅ | ❌ | ❌ |
| **GDPR Compliant** | ✅ | ⚠️ | ⚠️ |
| **Modern UI** | ✅ | ❌ | ⚠️ |
| **GraphQL Product Fetch** | ✅ | ❌ | ❌ |
| **Custom Email Settings** | ✅ | ❌ | ❌ |
| **Auto-Populate Shop Email** | ✅ ⭐ | ❌ | ❌ |
| **Free License Allocation** | ✅ ⭐ | ❌ | ❌ |
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

### Email Delivery
- **From Address:** mail@digikeyhq.com (verified SendGrid domain)
- **Reply-To Logic:**
  1. User-defined reply-to (if set in settings)
  2. Shop email from Shopify API (auto-populated on first settings load)
  3. From email (fallback)
- **SaaS Architecture** - Each shop can customize sender name and reply-to
- **SendGrid Integration** - Transactional email with delivery tracking

### Responsive Design
- **Auto-Detection** - Detects embedded mode (shop param or iframe)
- **Dual Styling** - Applies both compact (embedded) and responsive (mobile) styles
- **Breakpoint System:**
  - Desktop: Full tables, sidebar visible
  - Tablet: Cards, sidebar visible
  - Mobile: Cards, collapsible sidebar
- **Touch-Friendly** - 44px minimum tap targets, momentum scrolling
- **Accessibility** - ARIA labels, keyboard navigation, screen reader support

---

## 🚀 Deployment

### Environment Variables

**Backend (Railway):**
```env
PORT=3001
NODE_ENV=production
APP_URL=https://api.digikeyhq.com
FRONTEND_URL=https://digikeyhq.com

# Database
DB_HOST=your_cloud_sql_host
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=license_manager
DB_PORT=3306

# Shopify
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_SCOPES=read_products,read_orders,read_customers
SHOPIFY_REDIRECT_URI=https://api.digikeyhq.com/auth/callback

# SendGrid
MAIL_API_KEY=your_sendgrid_key
FROM_EMAIL=mail@digikeyhq.com
FROM_NAME=DigiKey HQ
ADMIN_EMAIL=admin@digikeyhq.com
```

**Frontend (Vercel):**
```env
VITE_API_URL=https://api.digikeyhq.com
```

### Domain Configuration
- **Frontend:** digikeyhq.com (Vercel)
- **Backend:** api.digikeyhq.com (Railway)
- **SendGrid:** mail@digikeyhq.com (verified domain)

---

## 📚 Documentation

- **[SHOPIFY_INTEGRATION.md](./SHOPIFY_INTEGRATION.md)** - Complete Shopify App Store submission guide
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Step-by-step deployment instructions

---

## 🤝 Contributing

This is a commercial product. For feature requests or bug reports, please contact support@digikeyhq.com

---

## 📄 License

Proprietary - All rights reserved © 2025 DigiKey HQ

---

**Built with ❤️ for Shopify merchants who sell digital products**
