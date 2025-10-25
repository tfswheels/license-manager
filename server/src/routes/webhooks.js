// server/src/routes/webhooks.js
import express from 'express';
import crypto from 'crypto';
import { shopify } from '../config/shopify.js';
import { processOrder } from '../services/orderService.js';

const router = express.Router();

/**
 * CRITICAL: Verify webhook HMAC signature
 * Uses timing-safe comparison to prevent timing attacks
 * Returns 401 Unauthorized for invalid signatures (required by Shopify)
 */
function verifyWebhook(req, res, next) {
  try {
    const hmac = req.get('X-Shopify-Hmac-SHA256');
    const body = req.body; // Raw body buffer from express.raw()
    const secret = process.env.SHOPIFY_API_SECRET;

    if (!hmac) {
      console.error('❌ Order Webhook: Missing HMAC header');
      return res.status(401).send('Unauthorized: Missing HMAC');
    }

    if (!secret) {
      console.error('❌ SHOPIFY_API_SECRET not configured');
      return res.status(500).send('Server configuration error');
    }

    // Generate HMAC hash from raw body
    const generatedHash = crypto
      .createHmac('sha256', secret)
      .update(body, 'utf8')
      .digest('base64');

    // Use timing-safe comparison (required by Shopify for security)
    // This prevents timing attacks that could guess the HMAC
    const isValid = shopify.auth.safeCompare(generatedHash, hmac);

    if (isValid) {
      // Verification successful - parse body for route handlers
      req.shopifyData = JSON.parse(body.toString('utf8'));
      console.log('✅ Order webhook HMAC verified successfully');
      next();
    } else {
      console.error('❌ Order webhook HMAC verification failed');
      console.error('Expected:', generatedHash);
      console.error('Received:', hmac);
      res.status(401).send('Unauthorized: Invalid HMAC');
    }
  } catch (error) {
    console.error('❌ Order webhook verification error:', error);
    res.status(401).send('Unauthorized: Verification error');
  }
}

/**
 * Order creation webhook - HMAC VERIFICATION NOW APPLIED
 * This is the critical fix - middleware was defined but never used!
 */
router.post('/create', verifyWebhook, async (req, res) => {
  try {
    const orderData = req.shopifyData;
    const shop = req.get('X-Shopify-Shop-Domain');

    console.log(`📦 New order received from ${shop}: Order #${orderData.order_number}`);

    // Process order asynchronously
    processOrder(shop, orderData)
      .then(() => {
        console.log(`✅ Order #${orderData.order_number} processed successfully`);
      })
      .catch(error => {
        console.error(`❌ Error processing order #${orderData.order_number}:`, error);
      });

    // Respond immediately to Shopify (required within 5 seconds)
    res.status(200).send('OK');

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Error');
  }
});

export default router;