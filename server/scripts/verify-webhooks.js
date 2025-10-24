// scripts/verify-webhooks.js
import { shopify } from '../src/config/shopify.js';
import db from '../src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Verify webhook registration for a shop
 * Usage: node scripts/verify-webhooks.js <shop-domain>
 */
async function verifyWebhooks(shopDomain) {
  try {
    console.log(`\n🔍 Verifying webhooks for: ${shopDomain}\n`);

    // Get shop from database
    const [shops] = await db.execute(
      'SELECT id, shop_domain, access_token FROM shops WHERE shop_domain = ?',
      [shopDomain]
    );

    if (shops.length === 0) {
      console.error('❌ Shop not found in database');
      console.log('\nAvailable shops:');
      const [allShops] = await db.execute('SELECT shop_domain FROM shops');
      allShops.forEach(s => console.log(`  - ${s.shop_domain}`));
      process.exit(1);
    }

    const shop = shops[0];
    const client = new shopify.clients.Rest({
      session: { shop: shop.shop_domain, accessToken: shop.access_token }
    });

    // Fetch all registered webhooks
    const response = await client.get({ path: 'webhooks' });
    const webhooks = response.body.webhooks || [];

    console.log(`✅ Found ${webhooks.length} registered webhooks:\n`);

    const requiredWebhooks = [
      'orders/create',
      'customers/data_request',
      'customers/redact',
      'shop/redact'
    ];

    const registeredTopics = new Set(webhooks.map(w => w.topic));

    // Check each required webhook
    requiredWebhooks.forEach(topic => {
      const isRegistered = registeredTopics.has(topic);
      const webhook = webhooks.find(w => w.topic === topic);

      if (isRegistered) {
        console.log(`✅ ${topic}`);
        console.log(`   Address: ${webhook.address}`);
        console.log(`   Format: ${webhook.format}`);
        console.log(`   Created: ${webhook.created_at}\n`);
      } else {
        console.log(`❌ ${topic} - NOT REGISTERED\n`);
      }
    });

    // Check environment variables
    console.log('\n📋 Environment Variables:\n');
    console.log(`APP_URL: ${process.env.APP_URL || '❌ NOT SET'}`);
    console.log(`SHOPIFY_API_KEY: ${process.env.SHOPIFY_API_KEY ? '✅ SET' : '❌ NOT SET'}`);
    console.log(`SHOPIFY_API_SECRET: ${process.env.SHOPIFY_API_SECRET ? '✅ SET (used for webhooks)' : '❌ NOT SET'}`);
    console.log(`SHOPIFY_WEBHOOK_SECRET: ${process.env.SHOPIFY_WEBHOOK_SECRET ? '⚠️ SET (currently unused)' : '❌ NOT SET'}`);

    // Summary
    console.log('\n📊 Summary:\n');
    const missingWebhooks = requiredWebhooks.filter(topic => !registeredTopics.has(topic));
    if (missingWebhooks.length === 0) {
      console.log('✅ All required webhooks are registered!');
    } else {
      console.log(`❌ Missing ${missingWebhooks.length} webhooks:`);
      missingWebhooks.forEach(topic => console.log(`   - ${topic}`));
      console.log('\nTo register missing webhooks, reinstall the app or run:');
      console.log('node scripts/register-webhooks.js <shop-domain>');
    }

    await db.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.body);
    }
    await db.end();
    process.exit(1);
  }
}

const shopDomain = process.argv[2];
if (!shopDomain) {
  console.error('Usage: node scripts/verify-webhooks.js <shop-domain>');
  console.error('Example: node scripts/verify-webhooks.js digikey-hq.myshopify.com');
  process.exit(1);
}

verifyWebhooks(shopDomain);
