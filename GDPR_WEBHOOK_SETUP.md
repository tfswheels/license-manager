# GDPR Webhook Setup Guide

## Important: GDPR Webhooks Cannot Be Registered Programmatically

GDPR webhooks (customers/data_request, customers/redact, shop/redact) **must** be configured manually in the Shopify Partner Dashboard for security and compliance reasons. They cannot be registered via API.

## Step-by-Step Setup

### 1. Go to Partner Dashboard
1. Navigate to [Shopify Partner Dashboard](https://partners.shopify.com)
2. Click on your app: **DigiKey HQ**

### 2. Navigate to Webhooks Section
1. Click **Configuration** in the left sidebar
2. Scroll down to **Webhooks** section
3. Click **Add webhook**

### 3. Register Each GDPR Webhook

You need to add **3 mandatory GDPR webhooks**:

#### Webhook 1: Customer Data Request
- **Event:** `Customer data request`
- **URL:** `https://api.digikeyhq.com/webhooks/gdpr/customers/data_request`
- **Format:** JSON
- **API Version:** 2024-10 (or latest stable)
- **Description:** Handles customer data export requests (GDPR compliance)

#### Webhook 2: Customer Redact
- **Event:** `Customer redact`
- **URL:** `https://api.digikeyhq.com/webhooks/gdpr/customers/redact`
- **Format:** JSON
- **API Version:** 2024-10 (or latest stable)
- **Description:** Anonymizes customer data 48 hours after deletion request

#### Webhook 3: Shop Redact
- **Event:** `Shop redact`
- **URL:** `https://api.digikeyhq.com/webhooks/gdpr/shop/redact`
- **Format:** JSON
- **API Version:** 2024-10 (or latest stable)
- **Description:** Deletes all shop data 48 hours after app uninstall

### 4. Verify Webhooks Are Active

After adding each webhook:
1. Ensure the **Status** shows as "Active"
2. Check that the URLs are correct (no typos!)
3. Verify the API version is 2024-10 or later

## Testing GDPR Webhooks

### Test in Development Store

1. Install your app on a development store
2. Go to Partner Dashboard → Your App → **Test your app**
3. Trigger test GDPR webhooks to verify they work

### Check Server Logs

After triggering test webhooks, check your Railway logs:
- Should see: `✅ GDPR Data Request processed`
- Should see: `✅ GDPR Customer Redaction completed`
- Should see: `✅ GDPR Shop Redaction completed`

## Shopify Compliance Checklist

After setting up GDPR webhooks, verify:
- ✅ All 3 GDPR webhooks registered in Partner Dashboard
- ✅ Webhooks showing as "Active"
- ✅ HMAC verification enabled (already implemented in code)
- ✅ Webhooks return 200 OK status
- ✅ Server logs show successful processing

## Common Issues

### Webhooks Not Triggering
- **Cause:** Webhooks only trigger on actual events (real uninstalls, real GDPR requests)
- **Solution:** Use Shopify's test webhook feature in Partner Dashboard

### 401 Unauthorized Errors
- **Cause:** HMAC signature verification failing
- **Solution:** Verify `SHOPIFY_API_SECRET` matches your app's API secret

### 500 Server Errors
- **Cause:** Database connection or code errors
- **Solution:** Check Railway logs for detailed error messages

## Important Notes

1. **GDPR webhooks are required** for Shopify App Store approval
2. **They must be registered before** submitting your app for review
3. **Test them thoroughly** in a development store before submission
4. **Monitor logs** to ensure they're working correctly
5. **Keep API version updated** to the latest stable version

## Webhook Endpoints (Already Implemented)

✅ All webhook handlers are already implemented in `/server/src/routes/gdprWebhooks.js`:
- Customer data request handler
- Customer redact handler
- Shop redact handler
- HMAC signature verification
- Database cleanup logic

You just need to register them in the Partner Dashboard!
