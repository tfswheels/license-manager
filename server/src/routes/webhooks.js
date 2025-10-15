// server/src/routes/webhooks.js
import express from 'express';
import crypto from 'crypto';
import { processOrder } from '../services/orderService.js';

const router = express.Router();

// Verify webhook signature
function verifyWebhook(req, res, next) {
  const hmac = req.get('X-Shopify-Hmac-SHA256');
  const body = req.body;
  const secret = process.env.SHOPIFY_API_SECRET;


  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');

  if (hash === hmac) {
    // Parse the body for next middleware
    req.shopifyData = JSON.parse(body.toString('utf8'));
    next();
  } else {
    console.error('❌ Webhook verification failed');
    res.status(401).send('Unauthorized');
  }
}

// Order creation webhook
router.post('/orders/create', verifyWebhook, async (req, res) => {
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

    // Respond immediately to Shopify
    res.status(200).send('OK');

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Error');
  }
});

export default router;