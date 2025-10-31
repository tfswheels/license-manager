import express from 'express';
import { shopify } from '../config/shopify.js';
import db from '../config/database.js';

const router = express.Router();

router.get('/install', async (req, res) => {
  try {
    const { shop } = req.query;

    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    const shopDomain = shop.includes('.myshopify.com') 
      ? shop 
      : `${shop}.myshopify.com`;

    await shopify.auth.begin({
      shop: shopDomain,
      callbackPath: '/auth/callback',
      isOnline: false,
      rawRequest: req,
      rawResponse: res
    });

  } catch (error) {
    console.error('OAuth begin error:', error);
    res.status(500).json({ 
      error: 'Failed to start installation',
      message: error.message 
    });
  }
});

router.get('/callback', async (req, res) => {
  console.log('🔵 CALLBACK HIT - Query params:', req.query);
  
  try {
    console.log('🔵 Starting shopify.auth.callback...');
    
    const callback = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res
    });

    console.log('🔵 Callback completed, got session');

    const { session } = callback;
    const { shop, accessToken } = session;

    console.log('🔵 Shop:', shop);
    console.log('🔵 Token preview:', accessToken?.substring(0, 20) + '...');
    console.log('🔵 Scopes:', session.scope);

    console.log('🔵 Attempting database insert...');

    // DEBUG: Check which database we're actually using
    const [dbCheck] = await db.execute('SELECT DATABASE() as current_db');
    console.log('🔍 CURRENT DATABASE:', dbCheck[0].current_db);
    console.log('🔍 ENV DB_NAME:', process.env.DB_NAME);

    const [result] = await db.execute(
      `INSERT INTO shops (shop_domain, access_token, scopes)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
       access_token = VALUES(access_token),
       scopes = VALUES(scopes),
       updated_at = CURRENT_TIMESTAMP`,
      [shop, accessToken, session.scope]
    );

    console.log('🔵 Database result:', result);
    console.log(`✅ Shop installed: ${shop}`);

    // Get the shop ID to create default template
    const [shopRows] = await db.execute(
      'SELECT id FROM shops WHERE shop_domain = ?',
      [shop]
    );
    const shopId = shopRows[0].id;

    // Create default email template if this is a new installation
    await createDefaultTemplate(shopId);

    console.log('🔵 Registering webhooks...');
    await registerWebhooks(shop, accessToken);

    console.log('🔵 Redirecting to Shopify Admin...');

    // For embedded apps, redirect back to Shopify Admin to load the app in iframe
    // This ensures proper App Bridge initialization and avoids "page not found" errors
    const apiKey = process.env.SHOPIFY_API_KEY;
    const redirectUrl = `https://${shop}/admin/apps/${apiKey}?installing=true`;

    console.log(`🔵 Redirecting to: ${redirectUrl}`);
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).send('Installation failed. Please try again.');
  }
});

async function createDefaultTemplate(shopId) {
  try {
    // Check if shop already has a default template
    const [existing] = await db.execute(
      'SELECT id FROM email_templates WHERE shop_id = ? AND is_default = TRUE',
      [shopId]
    );

    if (existing.length > 0) {
      console.log(`✅ Default template already exists for shop ${shopId}`);
      return;
    }

    // Create default HTML template
    const htmlTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
    }
    .container { padding: 30px 20px; }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #4CAF50;
      margin-bottom: 30px;
    }
    .license-box {
      background: #f5f5f5;
      padding: 20px;
      margin: 25px 0;
      border-radius: 8px;
      border-left: 4px solid #4CAF50;
    }
    .license-key {
      font-family: 'Courier New', monospace;
      font-size: 15px;
      margin: 8px 0;
      padding: 10px;
      background: white;
      border-radius: 4px;
      word-break: break-all;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Thank You for Your Purchase!</h2>
    </div>

    <p>Hi {{first_name}},</p>

    <p>Your order <strong>#{{order_number}}</strong> has been confirmed.</p>

    <p><strong>Product:</strong> {{product_name}}</p>

    <div class="license-box">
      <strong>Your License Keys:</strong>
      {{license_keys}}
    </div>

    <p>Please save these license keys in a secure location. You'll need them to activate your product.</p>

    <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>

    <p>Best regards,<br>{{shop_name}}</p>

    <div class="footer">
      <p>This email was sent because you placed an order with us.</p>
    </div>
  </div>
</body>
</html>`;

    // Create default plain text template
    const textTemplate = `Hi {{first_name}},

Thank you for your purchase!

Your order #{{order_number}} has been confirmed.

Product: {{product_name}}

Your License Keys:
{{license_keys}}

Please save these license keys in a secure location. You'll need them to activate your product.

If you have any questions or need assistance, please don't hesitate to contact us.

Best regards,
{{shop_name}}

---
This email was sent because you placed an order with us.`;

    // Insert default template
    await db.execute(
      `INSERT INTO email_templates
        (shop_id, template_name, email_subject, email_html_template, email_text_template, is_default)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [
        shopId,
        'Default License Email',
        'Your License Key for {{product_name}}',
        htmlTemplate,
        textTemplate
      ]
    );

    console.log(`✅ Created default email template for shop ${shopId}`);
  } catch (error) {
    console.error('Error creating default template:', error);
    // Don't throw - installation should continue even if template creation fails
  }
}

async function registerWebhooks(shop, accessToken) {
  const client = new shopify.clients.Rest({
    session: { shop, accessToken }
  });

  // Only register webhooks that can be registered via API
  // GDPR webhooks MUST be registered in Partner Dashboard for security
  const webhooks = [
    {
      topic: 'orders/create',
      address: `${process.env.APP_URL}/webhooks/orders/create`,
      format: 'json'
    }
  ];

  console.log('📝 Note: GDPR webhooks (customers/data_request, customers/redact, shop/redact)');
  console.log('   must be configured in Shopify Partner Dashboard → App Setup → Webhooks');
  console.log('   They cannot be registered programmatically for security reasons.\n');

  try {
    for (const webhook of webhooks) {
      try {
        await client.post({
          path: 'webhooks',
          data: { webhook }
        });
        console.log(`✅ Registered webhook: ${webhook.topic}`);
      } catch (webhookError) {
        // Log but continue with other webhooks
        console.error(`⚠️ Failed to register webhook ${webhook.topic}:`, webhookError.message);
      }
    }

    console.log(`✅ Webhooks registered for ${shop}`);
  } catch (error) {
    console.error('Webhook registration error:', error);
  }
}

router.get('/status', async (req, res) => {
  try {
    const { shop } = req.query;

    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    const [rows] = await db.execute(
      'SELECT shop_domain, installed_at FROM shops WHERE shop_domain = ?',
      [shop]
    );

    if (rows.length === 0) {
      return res.json({ installed: false });
    }

    res.json({ 
      installed: true,
      shop: rows[0].shop_domain,
      installedAt: rows[0].installed_at
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check installation status' });
  }
});

export default router;