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
  try {
    const callback = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res
    });

    const { session } = callback;
    const { shop, accessToken } = session;

    const [result] = await db.execute(
      `INSERT INTO shops (shop_domain, access_token, scopes) 
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       access_token = VALUES(access_token),
       scopes = VALUES(scopes),
       updated_at = CURRENT_TIMESTAMP`,
      [shop, accessToken, session.scope]
    );

    console.log(`✅ Shop installed: ${shop}`);

    await registerWebhooks(shop, accessToken);

    res.redirect(`${process.env.APP_URL}/install-success?shop=${shop}`);

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send('Installation failed. Please try again.');
  }
});

async function registerWebhooks(shop, accessToken) {
  const client = new shopify.clients.Rest({ 
    session: { shop, accessToken } 
  });

  try {
    await client.post({
      path: 'webhooks',
      data: {
        webhook: {
          topic: 'orders/create',
          address: `${process.env.APP_URL}/webhooks/orders/create`,
          format: 'json'
        }
      }
    });

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
