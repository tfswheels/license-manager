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

    console.log('🔵 Registering webhooks...');
    await registerWebhooks(shop, accessToken);

    console.log('🔵 Redirecting to frontend...');

    // Build frontend URL with shop and host parameters
    const frontendUrl = process.env.FRONTEND_URL || 'https://license-manager-lovat.vercel.app';
    const host = req.query.host || '';

    // Redirect to frontend with all necessary parameters for embedded apps
    const redirectUrl = `${frontendUrl}?shop=${shop}&host=${encodeURIComponent(host)}`;

    console.log(`🔵 Redirecting to: ${redirectUrl}`);
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).send('Installation failed. Please try again.');
  }
});

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