# Shopify App Store Integration Guide

This document outlines all the features and compliance measures implemented to prepare License Manager for Shopify App Store submission.

## Table of Contents

1. [GDPR Compliance](#gdpr-compliance)
2. [Legal Documentation](#legal-documentation)
3. [App Billing Integration](#app-billing-integration)
4. [Embedded App UI (App Bridge)](#embedded-app-ui-app-bridge)
5. [Security Headers](#security-headers)
6. [Session Token Authentication](#session-token-authentication)
7. [Deployment Checklist](#deployment-checklist)

---

## GDPR Compliance

### Implemented Webhooks

We've implemented all three mandatory GDPR webhooks required by Shopify:

#### 1. `customers/data_request`
- **Endpoint**: `POST /webhooks/gdpr/customers/data_request`
- **Purpose**: Handles customer data export requests
- **Implementation**:
  - Collects all order data for the customer
  - Retrieves email delivery logs and license allocations
  - Logs the request for compliance audit trail
  - Stores data for merchant to manually review and send to customer

#### 2. `customers/redact`
- **Endpoint**: `POST /webhooks/gdpr/customers/redact`
- **Purpose**: Anonymizes customer data after deletion request
- **Implementation** (triggers 48 hours after customer requests deletion):
  - Anonymizes customer email, name, and addresses in orders
  - Redacts email addresses in email logs
  - Removes all PII while preserving business records
  - Logs the redaction for compliance

#### 3. `shop/redact`
- **Endpoint**: `POST /webhooks/gdpr/shop/redact`
- **Purpose**: Deletes all shop data when app is uninstalled
- **Implementation** (triggers 48 hours after uninstall):
  - Deletes all shop data including access tokens
  - Removes products, licenses, orders, and customer data
  - Deletes email templates and settings
  - Permanently removes shop record
  - Logs deletion for compliance audit

### Database Tables

- **Migration**: `007_gdpr_requests.sql`
- **Table**: `gdpr_requests`
- **Purpose**: Audit log for all GDPR webhook requests

### Files

- `server/src/routes/gdprWebhooks.js` - GDPR webhook handlers
- `server/migrations/007_gdpr_requests.sql` - Database schema

---

## Legal Documentation

### Implemented Pages

We've created comprehensive legal documentation pages hosted on the Vercel frontend:

#### 1. Privacy Policy
- **Route**: `/privacy-policy`
- **URL**: `https://digikeyhq.com/privacy-policy`
- **Contents**:
  - Data collection and usage
  - GDPR compliance information
  - CCPA compliance for California users
  - International data transfers
  - Sub-processor information
  - User rights and contact information

#### 2. Terms of Service
- **Route**: `/terms-of-service`
- **URL**: `https://digikeyhq.com/terms-of-service`
- **Contents**:
  - Service description
  - User responsibilities
  - Billing and payments
  - Liability disclaimers
  - Termination policies
  - Dispute resolution

#### 3. GDPR Compliance Page
- **Route**: `/gdpr-compliance`
- **URL**: `https://digikeyhq.com/gdpr-compliance`
- **Contents**:
  - Detailed GDPR principles
  - User rights explanation
  - Automated webhook handling
  - Security measures
  - Data protection officer contact

### Shopify App Listing URLs

When submitting to Shopify App Store, use these URLs:

- **Privacy Policy URL**: `https://digikeyhq.com/privacy-policy`
- **Terms of Service URL**: `https://digikeyhq.com/terms-of-service`
- **Support URL**: `support@digikeyhq.com`

### Files

- `admin/src/pages/PrivacyPolicy.jsx`
- `admin/src/pages/TermsOfService.jsx`
- `admin/src/pages/GDPRCompliance.jsx`
- `admin/src/App.jsx` (routes registered)

---

## App Billing Integration

### Billing Plans

We've integrated Shopify's Billing API with 4 subscription tiers:

| Plan | Price | Trial | Max Products | Max Licenses | Features |
|------|-------|-------|--------------|--------------|----------|
| **Free** | $0 | N/A | 2 | 100 | Basic features |
| **Basic** | $9.99/mo | 7 days | 10 | 1,000 | Email support, custom templates |
| **Professional** | $29.99/mo | 7 days | 50 | 10,000 | Advanced rules, priority support |
| **Enterprise** | $99.99/mo | 14 days | Unlimited | Unlimited | Dedicated support |

### API Endpoints

- `GET /auth/billing/status` - Check shop's subscription status
- `POST /auth/billing/subscribe` - Create new subscription
- `POST /auth/billing/cancel` - Cancel active subscription
- `GET /auth/billing/callback` - Handle billing confirmation
- `GET /auth/billing/plans` - List available plans

### Features

- **Recurring Application Charges**: Monthly subscriptions via Shopify Billing API
- **Free Trials**: 7-14 day trials depending on plan
- **Test Mode**: Automatic test charges in development
- **Plan Upgrades/Downgrades**: Seamless plan switching
- **Usage-Based Limits**: Enforce feature limits based on subscription tier
- **Automatic Renewal**: Subscriptions renew automatically

### Database

- **Migration**: `008_subscriptions.sql`
- **Table**: `subscriptions`
- **Tracks**: Plan details, status, pricing, trial periods

### Files

- `server/src/services/billingService.js` - Billing logic
- `server/src/routes/billing.js` - Billing API routes
- `server/migrations/008_subscriptions.sql` - Database schema

---

## Embedded App UI (App Bridge)

### Shopify App Bridge Integration

We've converted the app to a fully embedded Shopify app using App Bridge 3.x:

#### Configuration

- **Backend**: `isEmbeddedApp: true` in `server/src/config/shopify.js`
- **Frontend**: App Bridge Provider wraps entire React app

#### Features

- **Seamless Embedding**: App runs within Shopify admin iframe
- **Navigation**: Uses App Bridge navigation for smooth UX
- **Authentication**: Session token-based auth (no cookies needed)
- **OAuth Flow**: Updated to support embedded app redirects
- **Performance**: Optimized for embedded context

#### Components

- `AppBridgeProvider.jsx` - Wraps app with Shopify App Bridge context
- Session token utilities for authenticated API requests
- Automatic shop detection from URL parameters

### App Bridge Provider

```jsx
<AppBridgeProvider>
  <Layout>
    <Routes>
      {/* All routes */}
    </Routes>
  </Layout>
</AppBridgeProvider>
```

### URL Parameters

Embedded apps require these URL parameters:
- `shop` - Shop domain (e.g., `store.myshopify.com`)
- `host` - Base64 encoded host parameter from Shopify

### Files

- `admin/src/components/AppBridgeProvider.jsx`
- `admin/src/utils/sessionToken.js`
- `admin/src/App.jsx` (updated with provider)
- `server/src/config/shopify.js` (embedded mode enabled)

---

## Security Headers

### Comprehensive Security Implementation

We've implemented industry-standard security headers required for Shopify App Store compliance:

#### Headers Implemented

1. **Content-Security-Policy (CSP)**
   - Restricts resource loading to trusted sources
   - Allows Shopify CDN and admin domains
   - Prevents XSS attacks

2. **X-Frame-Options**
   - Allows embedding from Shopify admin
   - `ALLOW-FROM https://admin.shopify.com`

3. **X-Content-Type-Options**
   - Prevents MIME type sniffing
   - `nosniff`

4. **X-XSS-Protection**
   - Enables browser XSS filter
   - `1; mode=block`

5. **Referrer-Policy**
   - Controls referrer information
   - `strict-origin-when-cross-origin`

6. **Permissions-Policy**
   - Restricts browser features
   - Disables unnecessary features (geolocation, camera, etc.)

7. **Strict-Transport-Security (HSTS)**
   - Forces HTTPS in production
   - `max-age=31536000; includeSubDomains; preload`

8. **Additional Headers**
   - X-DNS-Prefetch-Control
   - X-Download-Options
   - X-Permitted-Cross-Domain-Policies

#### CORS Configuration

- Allows Shopify admin and myshopify.com domains
- Supports credentials for embedded apps
- Handles preflight OPTIONS requests

#### Rate Limiting

- Rate limit headers inform clients of limits
- Configurable: 1000 requests/hour (default)

### Files

- `server/src/middleware/securityHeaders.js`
- `server/src/index.js` (middleware applied globally)

---

## Session Token Authentication

### JWT-Based Authentication

For embedded apps, we use Shopify session tokens instead of traditional OAuth cookies:

#### How It Works

1. **Frontend**: App Bridge generates session tokens
2. **API Requests**: Tokens sent in `Authorization: Bearer <token>` header
3. **Backend**: Middleware verifies token signature and extracts shop info
4. **Security**: Tokens expire after 1 minute, automatically refreshed by App Bridge

#### Middleware

- `verifySessionToken` - Optional verification (backward compatible)
- `requireSessionToken` - Strict verification (requires valid token)

#### Token Payload

Session tokens contain:
- `iss` - Issuer (shop domain)
- `dest` - Destination (shop URL)
- `aud` - Audience (API key)
- `sub` - Subject (user ID)
- `exp` - Expiration
- `nbf` - Not before
- `iat` - Issued at

#### Usage

```javascript
// Apply to protected routes
app.use('/api/admin', verifySessionToken);
```

### Files

- `server/src/middleware/verifySessionToken.js`
- `admin/src/utils/sessionToken.js`

---

## Deployment Checklist

### Before Submitting to Shopify App Store

#### 1. Environment Variables

**Backend** (Railway):
```bash
APP_URL=https://api.digikeyhq.com
SHOPIFY_API_KEY=your_key
SHOPIFY_API_SECRET=your_secret
SHOPIFY_SCOPES=read_products,read_orders,read_customers
SHOPIFY_REDIRECT_URI=https://api.digikeyhq.com/auth/callback
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
FRONTEND_URL=https://digikeyhq.com
NODE_ENV=production
```

**Frontend** (Vercel):
```bash
VITE_SHOPIFY_API_KEY=your_shopify_api_key
VITE_API_URL=https://api.digikeyhq.com
VITE_ENV=production
```

#### 2. Database Migrations

Run all migrations in order:
```bash
001_initial_schema.sql
002_email_templates.sql
002_add_manual_orders.sql
003_template_assignment_rules.sql
004_add_price_columns.sql
005_shop_settings.sql
006_add_reply_to_email.sql
007_gdpr_requests.sql
008_subscriptions.sql
```

#### 3. Shopify Partner Dashboard

- [ ] Create production app in Partner Dashboard
- [ ] Set App URL to Vercel frontend
- [ ] Set Redirect URLs to backend /auth/callback
- [ ] Configure webhook URLs:
  - Orders: `https://your-backend/webhooks/orders/create`
  - GDPR: `https://your-backend/webhooks/gdpr/*`
- [ ] Set app scopes: `read_products,read_orders,read_customers`
- [ ] Enable embedded app
- [ ] Add Privacy Policy URL
- [ ] Add Terms of Service URL

#### 4. App Listing Requirements

- [ ] App name and description
- [ ] App icon (512x512px)
- [ ] Screenshots (at least 3)
- [ ] Support email
- [ ] Privacy policy URL
- [ ] Terms of service URL
- [ ] Pricing information
- [ ] Category selection

#### 5. Testing

- [ ] Test OAuth installation flow
- [ ] Test embedded app loading in Shopify admin
- [ ] Test session token authentication
- [ ] Test GDPR webhooks (use Shopify CLI to trigger)
- [ ] Test billing subscription flow
- [ ] Test all CRUD operations
- [ ] Test security headers
- [ ] Verify legal pages are accessible

#### 6. Performance

- [ ] Frontend build optimized for production
- [ ] Backend configured for production (HTTPS, security headers)
- [ ] Database connection pooling enabled
- [ ] CDN configured for static assets
- [ ] App loads within 2 seconds (Shopify requirement)

#### 7. Compliance

- [ ] GDPR webhooks implemented and tested
- [ ] Privacy policy published and accessible
- [ ] Terms of service published and accessible
- [ ] Data retention policies documented
- [ ] Security measures documented

---

## Testing GDPR Webhooks

### Using Shopify CLI

```bash
# Install Shopify CLI
npm install -g @shopify/cli @shopify/app

# Trigger customer data request
shopify webhook trigger --topic customers/data_request --api-version 2024-01

# Trigger customer redaction
shopify webhook trigger --topic customers/redact --api-version 2024-01

# Trigger shop redaction
shopify webhook trigger --topic shop/redact --api-version 2024-01
```

### Manual Testing

1. Install app on development store
2. Create test customer and orders
3. Uninstall app
4. Wait 48 hours or use webhook triggers
5. Verify data is deleted/anonymized

---

## Support

For questions about Shopify integration:
- **Email**: support@digikeyhq.com
- **Documentation**: This file
- **Shopify Partner Help**: https://help.shopify.com/partners

---

## Version History

### v1.1.0 - Shopify App Store Ready
- ✅ GDPR compliance webhooks
- ✅ Legal documentation pages
- ✅ App billing integration
- ✅ Embedded app with App Bridge
- ✅ Session token authentication
- ✅ Comprehensive security headers
- ✅ Production-ready OAuth flow

---

**Last Updated**: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
