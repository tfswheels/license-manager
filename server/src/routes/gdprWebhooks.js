// server/src/routes/gdprWebhooks.js
import express from 'express';
import crypto from 'crypto';
import db from '../config/database.js';
import { shopify } from '../config/shopify.js';

const router = express.Router();

// Verify webhook signature for GDPR webhooks
// CRITICAL: Use raw payload directly, do NOT JSON.stringify!
function verifyWebhook(req, res, next) {
  try {
    const hmac = req.get('X-Shopify-Hmac-SHA256');
    const secret = process.env.SHOPIFY_API_SECRET;

    if (!hmac) {
      console.error('❌ GDPR Webhook: Missing HMAC header');
      return res.status(401).send('Unauthorized: Missing HMAC');
    }

    // Use the raw payload DIRECTLY - do NOT parse or stringify!
    // req.body is a Buffer from express.raw()
    const rawPayload = req.body;

    // Generate HMAC using raw payload
    const generatedHash = crypto
      .createHmac('sha256', secret)
      .update(rawPayload, 'utf8')
      .digest('base64');

    // Use Shopify's safe compare to prevent timing attacks
    if (shopify.auth.safeCompare(generatedHash, hmac)) {
      // Verification successful - parse body for route handlers
      req.shopifyData = JSON.parse(rawPayload.toString('utf8'));
      next();
    } else {
      console.error('❌ GDPR Webhook verification failed');
      console.error('Expected:', generatedHash);
      console.error('Received:', hmac);
      res.status(401).send('Unauthorized: Invalid HMAC');
    }
  } catch (error) {
    console.error('❌ GDPR Webhook verification error:', error);
    res.status(401).send('Unauthorized: Verification error');
  }
}

// Apply verification middleware to all GDPR webhook routes
router.use(verifyWebhook);

/**
 * GDPR: Customer Data Request Webhook
 * Shopify sends this when a customer requests their data
 * We need to collect all customer data and make it available
 */
router.post('/customers/data_request', async (req, res) => {
  try {
    const requestData = req.shopifyData;
    const shop = req.get('X-Shopify-Shop-Domain');

    console.log(`📋 GDPR Data Request received from ${shop} for customer: ${requestData.customer?.id}`);

    const customerId = requestData.customer?.id;
    const customerEmail = requestData.customer?.email;

    if (!customerId && !customerEmail) {
      console.warn('⚠️ No customer ID or email provided in data request');
      return res.status(200).send('OK');
    }

    // Collect all customer data from our database
    const customerData = {
      shop_domain: shop,
      customer_id: customerId,
      customer_email: customerEmail,
      request_id: requestData.id,
      requested_at: new Date().toISOString(),
      data: {}
    };

    try {
      // Get all orders for this customer
      const [orders] = await db.query(`
        SELECT o.*, oi.product_id, oi.quantity, oi.variant_id
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        INNER JOIN shops s ON o.shop_id = s.id
        WHERE s.shop_domain = ?
          AND (o.customer_id = ? OR o.customer_email = ?)
        ORDER BY o.created_at DESC
      `, [shop, customerId, customerEmail]);

      customerData.data.orders = orders;

      // Get all email logs for this customer
      const [emailLogs] = await db.query(`
        SELECT el.*
        FROM email_logs el
        INNER JOIN orders o ON el.order_id = o.id
        INNER JOIN shops s ON o.shop_id = s.id
        WHERE s.shop_domain = ?
          AND (o.customer_id = ? OR o.customer_email = ?)
        ORDER BY el.created_at DESC
      `, [shop, customerId, customerEmail]);

      customerData.data.email_logs = emailLogs;

      // Log the data request for compliance records
      await db.query(`
        INSERT INTO gdpr_requests (shop_domain, request_type, customer_id, customer_email, request_data, created_at)
        VALUES (?, 'data_request', ?, ?, ?, NOW())
      `, [shop, customerId, customerEmail, JSON.stringify(requestData)]);

      console.log(`✅ GDPR Data Request processed for customer ${customerId || customerEmail}`);
      console.log(`📊 Found ${orders.length} orders and ${emailLogs.length} email logs`);

      // In production, you would typically:
      // 1. Store this data in a secure location
      // 2. Notify an admin to manually review and send to customer
      // 3. Or automatically email the data to the customer

    } catch (dbError) {
      console.error('❌ Database error processing GDPR data request:', dbError);
      // Still return 200 to Shopify even if there's an error
    }

    res.status(200).send('OK');

  } catch (error) {
    console.error('❌ Error processing GDPR data request webhook:', error);
    res.status(500).send('Error');
  }
});

/**
 * GDPR: Customer Redact Webhook
 * Shopify sends this 48 hours after a customer requests data deletion
 * We need to redact/anonymize all customer data
 */
router.post('/customers/redact', async (req, res) => {
  try {
    const requestData = req.shopifyData;
    const shop = req.get('X-Shopify-Shop-Domain');

    console.log(`🔒 GDPR Customer Redaction received from ${shop} for customer: ${requestData.customer?.id}`);

    const customerId = requestData.customer?.id;
    const customerEmail = requestData.customer?.email;

    if (!customerId && !customerEmail) {
      console.warn('⚠️ No customer ID or email provided in redaction request');
      return res.status(200).send('OK');
    }

    try {
      // Get shop_id first
      const [shops] = await db.query('SELECT id FROM shops WHERE shop_domain = ?', [shop]);

      if (shops.length === 0) {
        console.warn(`⚠️ Shop not found: ${shop}`);
        return res.status(200).send('OK');
      }

      const shopId = shops[0].id;

      // Anonymize customer data in orders
      await db.query(`
        UPDATE orders
        SET
          customer_email = 'redacted@privacy.invalid',
          customer_first_name = 'Redacted',
          customer_last_name = 'User',
          customer_id = NULL,
          shipping_address = NULL,
          billing_address = NULL
        WHERE shop_id = ?
          AND (customer_id = ? OR customer_email = ?)
      `, [shopId, customerId, customerEmail]);

      // Anonymize email logs
      await db.query(`
        UPDATE email_logs el
        INNER JOIN orders o ON el.order_id = o.id
        SET el.recipient_email = 'redacted@privacy.invalid'
        WHERE o.shop_id = ?
          AND (o.customer_id = ? OR o.customer_email = ?)
      `, [shopId, customerId, customerEmail]);

      // Log the redaction for compliance records
      await db.query(`
        INSERT INTO gdpr_requests (shop_domain, request_type, customer_id, customer_email, request_data, created_at)
        VALUES (?, 'customer_redact', ?, ?, ?, NOW())
      `, [shop, customerId, customerEmail, JSON.stringify(requestData)]);

      console.log(`✅ GDPR Customer Redaction completed for customer ${customerId || customerEmail}`);

    } catch (dbError) {
      console.error('❌ Database error processing GDPR customer redaction:', dbError);
      // Still return 200 to Shopify even if there's an error
    }

    res.status(200).send('OK');

  } catch (error) {
    console.error('❌ Error processing GDPR customer redaction webhook:', error);
    res.status(500).send('Error');
  }
});

/**
 * GDPR: Shop Redact Webhook
 * Shopify sends this 48 hours after a shop uninstalls the app
 * We need to delete or anonymize all shop data
 */
router.post('/shop/redact', async (req, res) => {
  try {
    const requestData = req.shopifyData;
    const shop = req.get('X-Shopify-Shop-Domain');

    console.log(`🗑️ GDPR Shop Redaction received for shop: ${shop}`);

    try {
      // Get shop_id first
      const [shops] = await db.query('SELECT id FROM shops WHERE shop_domain = ?', [shop]);

      if (shops.length === 0) {
        console.warn(`⚠️ Shop not found: ${shop}`);
        return res.status(200).send('OK');
      }

      const shopId = shops[0].id;

      // Option 1: Complete deletion (recommended for GDPR compliance)
      // Delete in correct order to respect foreign key constraints

      // Delete email logs first (depends on orders)
      await db.query(`
        DELETE el FROM email_logs el
        INNER JOIN orders o ON el.order_id = o.id
        WHERE o.shop_id = ?
      `, [shopId]);

      // Delete inventory alerts
      await db.query('DELETE FROM inventory_alerts WHERE shop_id = ?', [shopId]);

      // Delete order items
      await db.query(`
        DELETE oi FROM order_items oi
        INNER JOIN orders o ON oi.order_id = o.id
        WHERE o.shop_id = ?
      `, [shopId]);

      // Delete orders
      await db.query('DELETE FROM orders WHERE shop_id = ?', [shopId]);

      // Delete licenses
      await db.query(`
        DELETE l FROM licenses l
        INNER JOIN products p ON l.product_id = p.id
        WHERE p.shop_id = ?
      `, [shopId]);

      // Delete template assignment rules
      await db.query('DELETE FROM template_assignment_rules WHERE shop_id = ?', [shopId]);

      // Delete email templates
      await db.query('DELETE FROM email_templates WHERE shop_id = ?', [shopId]);

      // Delete shop settings
      await db.query('DELETE FROM shop_settings WHERE shop_id = ?', [shopId]);

      // Delete products
      await db.query('DELETE FROM products WHERE shop_id = ?', [shopId]);

      // Finally, delete the shop itself
      await db.query('DELETE FROM shops WHERE id = ?', [shopId]);

      // Log the shop redaction for compliance records (in a separate audit table)
      await db.query(`
        INSERT INTO gdpr_requests (shop_domain, request_type, customer_id, customer_email, request_data, created_at)
        VALUES (?, 'shop_redact', NULL, NULL, ?, NOW())
      `, [shop, JSON.stringify(requestData)]);

      console.log(`✅ GDPR Shop Redaction completed for shop: ${shop}`);
      console.log(`🗑️ All data for shop ${shop} has been permanently deleted`);

    } catch (dbError) {
      console.error('❌ Database error processing GDPR shop redaction:', dbError);
      // Still return 200 to Shopify even if there's an error
    }

    res.status(200).send('OK');

  } catch (error) {
    console.error('❌ Error processing GDPR shop redaction webhook:', error);
    res.status(500).send('Error');
  }
});

export default router;
