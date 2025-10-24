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
    const redirectUrl = `https://${shop}/admin/apps/${apiKey}`;

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
      padding: 20px;
    }
    .header {
      background-color: #4CAF50;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    .content {
      background-color: #f9f9f9;
      padding: 30px;
      border: 1px solid #ddd;
    }
    .license-key {
      background-color: #fff;
      border: 2px solid #4CAF50;
      padding: 15px;
      margin: 20px 0;
      font-family: 'Courier New', monospace;
      font-size: 16px;
      font-weight: bold;
      text-align: center;
      border-radius: 5px;
    }
    .footer {
      background-color: #f1f1f1;
      padding: 15px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-radius: 0 0 5px 5px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Your License Key</h1>
  </div>
  <div class="content">
    <p>Hi {{customer_name}},</p>
    <p>Thank you for your purchase of <strong>{{product_name}}</strong>!</p>
    <p>Here is your license key:</p>
    <div class="license-key">
      {{license_key}}
    </div>
    <p><strong>Order Details:</strong></p>
    <ul>
      <li>Order Number: {{order_number}}</li>
      <li>Order Date: {{order_date}}</li>
    </ul>
    <p>If you have any questions, please reply to this email.</p>
    <p>Best regards,<br>{{shop_name}}</p>
  </div>
  <div class="footer">
    <p>This is an automated email. Please do not reply to this message.</p>
  </div>
</body>
</html>`;

    // Create default plain text template
    const textTemplate = `Hi {{customer_name}},

Thank you for your purchase of {{product_name}}!

Here is your license key:

{{license_key}}

Order Details:
- Order Number: {{order_number}}
- Order Date: {{order_date}}

If you have any questions, please reply to this email.

Best regards,
{{shop_name}}`;

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

  const webhooks = [
    // Order webhook for license processing
    {
      topic: 'orders/create',
      address: `${process.env.APP_URL}/webhooks/orders/create`,
      format: 'json'
    },
    // GDPR Compliance webhooks (required for Shopify App Store)
    {
      topic: 'customers/data_request',
      address: `${process.env.APP_URL}/webhooks/gdpr/customers/data_request`,
      format: 'json'
    },
    {
      topic: 'customers/redact',
      address: `${process.env.APP_URL}/webhooks/gdpr/customers/redact`,
      format: 'json'
    },
    {
      topic: 'shop/redact',
      address: `${process.env.APP_URL}/webhooks/gdpr/shop/redact`,
      format: 'json'
    }
  ];

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

    console.log(`✅ All webhooks registered for ${shop}`);
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