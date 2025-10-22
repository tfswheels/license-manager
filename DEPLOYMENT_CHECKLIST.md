# DigiKey HQ - Deployment Checklist

Complete guide for deploying your Shopify app with custom domain `digikeyhq.com`

---

## ✅ Environment Variables to Update

### Railway (Backend - api.digikeyhq.com)

Update these environment variables in your Railway project:

```bash
# Server URLs
APP_URL=https://api.digikeyhq.com
FRONTEND_URL=https://digikeyhq.com

# Shopify Configuration
SHOPIFY_API_KEY=your_shopify_api_key_here
SHOPIFY_API_SECRET=your_shopify_api_secret_here
SHOPIFY_SCOPES=read_products,read_orders,read_customers
SHOPIFY_REDIRECT_URI=https://api.digikeyhq.com/auth/callback
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret_here

# Database (Google Cloud SQL)
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=license_manager
DB_PORT=3306

# SendGrid Email
MAIL_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@digikeyhq.com
FROM_NAME=DigiKey HQ

# Admin Settings
ADMIN_EMAIL=admin@digikeyhq.com
LOW_INVENTORY_THRESHOLD=10

# Environment
NODE_ENV=production
PORT=3001
```

### Vercel (Frontend - digikeyhq.com)

Update these environment variables in your Vercel project:

```bash
VITE_SHOPIFY_API_KEY=your_shopify_api_key_here
VITE_API_URL=https://api.digikeyhq.com
VITE_ENV=production
```

**Important:** Make sure `VITE_SHOPIFY_API_KEY` is set! The app won't work without it.

---

## 🔧 Shopify Partner Dashboard Configuration

Go to: https://partners.shopify.com → Apps → Your App → Configuration

### App Setup

| Setting | Value |
|---------|-------|
| **App URL** | `https://digikeyhq.com` |
| **Allowed redirection URL(s)** | `https://api.digikeyhq.com/auth/callback` |
| **Embedded app** | ✅ **Enabled** (check this box) |

### App Scopes
```
read_products
read_orders
read_customers
```

### Webhooks

Configure these webhook URLs:

| Topic | URL |
|-------|-----|
| `orders/create` | `https://api.digikeyhq.com/webhooks/orders/create` |
| `customers/data_request` | `https://api.digikeyhq.com/webhooks/gdpr/customers/data_request` |
| `customers/redact` | `https://api.digikeyhq.com/webhooks/gdpr/customers/redact` |
| `shop/redact` | `https://api.digikeyhq.com/webhooks/gdpr/shop/redact` |

### Legal URLs

| Field | URL |
|-------|-----|
| **Privacy policy** | `https://digikeyhq.com/privacy-policy` |
| **Terms of service** | `https://digikeyhq.com/terms-of-service` |

---

## 🌐 Domain Configuration

### ✅ Already Done (by you)
- [x] Purchased digikeyhq.com
- [x] DNS configured for Railway (api subdomain)
- [x] DNS configured for Vercel (root domain)
- [x] DNS verified on both platforms

### Railway DNS Records
For `api.digikeyhq.com`:
```
Type: CNAME
Name: api
Value: [Your Railway domain]
```

### Vercel DNS Records
For `digikeyhq.com`:
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

---

## 📦 Deployment Steps

### 1. Update Environment Variables

**Railway:**
1. Go to Railway Dashboard
2. Select your project
3. Click **Variables** tab
4. Update `APP_URL` and `FRONTEND_URL` (see values above)
5. Save changes

**Vercel:**
1. Go to Vercel Dashboard
2. Select your project
3. Click **Settings** → **Environment Variables**
4. Update `VITE_API_URL` to `https://api.digikeyhq.com`
5. Ensure `VITE_SHOPIFY_API_KEY` is set
6. Save changes

### 2. Deploy Code

**Option A - Merge to Main (Recommended):**
```bash
git checkout main
git merge claude/prepare-shopify-integration-011CUNpiRxaTcg8F8pZjWhYz
git push
```

Both Railway and Vercel will auto-deploy from main branch.

**Option B - Deploy from Branch:**
- Railway: Will auto-deploy from the branch push
- Vercel: Manually trigger deployment from dashboard

### 3. Update Shopify Partner Dashboard

Follow the configuration table above to update:
- [x] App URL
- [x] Redirect URLs
- [x] Webhook URLs
- [x] Legal URLs
- [x] Enable embedded app

### 4. Test the Application

After deployment:

**Test Legal Pages (Public Access):**
- [ ] Visit https://digikeyhq.com/privacy-policy (should load)
- [ ] Visit https://digikeyhq.com/terms-of-service (should load)
- [ ] Visit https://digikeyhq.com/gdpr-compliance (should load)

**Test API:**
- [ ] Visit https://api.digikeyhq.com (should show API info)
- [ ] Visit https://api.digikeyhq.com/health (should return status OK)

**Test App in Shopify:**
1. [ ] Uninstall app from test store (if installed)
2. [ ] Clear browser cache/cookies
3. [ ] Install app from Partner Dashboard
4. [ ] App should load in Shopify admin iframe
5. [ ] Navigate to Products page (should work)
6. [ ] Navigate to Orders page (should work)
7. [ ] Navigate to Settings page (should work)

**Test OAuth Flow:**
- [ ] Installation redirects correctly
- [ ] Webhooks are registered
- [ ] Shop saved to database
- [ ] App loads in embedded mode

---

## 🔍 Verification Checklist

### Environment Variables
- [ ] Railway: `APP_URL` = `https://api.digikeyhq.com`
- [ ] Railway: `FRONTEND_URL` = `https://digikeyhq.com`
- [ ] Vercel: `VITE_API_URL` = `https://api.digikeyhq.com`
- [ ] Vercel: `VITE_SHOPIFY_API_KEY` is set
- [ ] All other env vars configured

### Shopify Partner Dashboard
- [ ] App URL = `https://digikeyhq.com`
- [ ] Redirect URL = `https://api.digikeyhq.com/auth/callback`
- [ ] Embedded app checkbox enabled
- [ ] All 4 webhooks configured
- [ ] Privacy policy URL set
- [ ] Terms of service URL set

### Domains
- [ ] `digikeyhq.com` resolves to Vercel
- [ ] `api.digikeyhq.com` resolves to Railway
- [ ] Both domains have valid SSL certificates
- [ ] Legal pages accessible at digikeyhq.com

### Application
- [ ] Frontend loads at https://digikeyhq.com
- [ ] API responds at https://api.digikeyhq.com
- [ ] App loads in Shopify admin iframe
- [ ] Navigation works (shop/host params persist)
- [ ] Legal pages load without authentication

---

## 🐛 Troubleshooting

### "This app must be accessed through Shopify admin"

**Problem:** App showing error message instead of loading

**Solution:**
1. Check that `VITE_SHOPIFY_API_KEY` is set in Vercel
2. Verify env vars are set to production URLs
3. Clear browser cache and try again
4. Uninstall and reinstall the app

### OAuth redirects to wrong URL

**Problem:** After installation, redirecting to old Vercel URL

**Solution:**
1. Check Railway `FRONTEND_URL` is set to `https://digikeyhq.com`
2. Redeploy Railway after updating env var
3. Uninstall and reinstall the app

### CORS errors in browser console

**Problem:** Network requests blocked by CORS

**Solution:**
1. Check Railway logs to verify CORS middleware is loading
2. Verify `digikeyhq.com` is in allowed origins
3. Redeploy backend
4. Clear browser cache

### Legal pages show 404

**Problem:** Legal pages not accessible

**Solution:**
1. Verify latest code is deployed to Vercel
2. Check build logs for errors
3. Test routes in Vercel deployment preview
4. Redeploy frontend

### Webhooks not triggering

**Problem:** Orders not processing automatically

**Solution:**
1. Check webhook URLs in Partner Dashboard
2. Verify webhooks were registered (check Railway logs)
3. Test webhook signature verification
4. Use Shopify CLI to manually trigger webhooks

---

## 📞 Need Help?

If you encounter issues:

1. **Check Railway logs:** Railway Dashboard → Deployments → View Logs
2. **Check Vercel logs:** Vercel Dashboard → Deployments → View Function Logs
3. **Check browser console:** F12 → Console tab for errors
4. **Test webhooks:** Use Shopify CLI to trigger test webhooks

---

## 🎉 Post-Deployment

Once everything is working:

1. [ ] Test with real order (small test purchase)
2. [ ] Verify license email delivery
3. [ ] Test GDPR webhooks (using Shopify CLI)
4. [ ] Submit app to Shopify App Store
5. [ ] Set up monitoring/alerts
6. [ ] Update app screenshots for listing
7. [ ] Write app description for App Store

---

## 📊 Summary of Changes

### What Was Updated

**Branding:**
- App name: DigiKey HQ
- Domain: digikeyhq.com
- API: api.digikeyhq.com
- Support: support@digikeyhq.com

**Documentation:**
- README.md - Complete rewrite with all features
- SHOPIFY_INTEGRATION.md - All URLs updated
- Environment examples - Production URLs

**Code:**
- CORS origins updated
- Security headers updated
- API response branding
- Console logs updated

### What You Still Need to Do

1. Update environment variables (Railway + Vercel)
2. Update Shopify Partner Dashboard
3. Deploy code (merge branch or redeploy)
4. Test application thoroughly
5. Submit to Shopify App Store

---

**Last Updated:** {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

Good luck with your deployment! 🚀
