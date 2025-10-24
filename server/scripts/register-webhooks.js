// scripts/register-webhooks.js
import { shopify } from '../src/config/shopify.js';
import db from '../src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Manually register webhooks for a shop
 * Usage: node scripts/register-webhooks.js <shop-domain>
 */
async function registerWebhooks(shopDomain) {
  try {
    console.log(`\n🔧 Registering webhooks for: ${shopDomain}\n`);

    if (!process.env.APP_URL) {
      console.error('❌ APP_URL not set in environment variables');
      process.exit(1);
    }

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

    const webhooks = [
      {
        topic: 'orders/create',
        address: `${process.env.APP_URL}/webhooks/orders/create`,
        format: 'json'
      },
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

    console.log(`📍 Using APP_URL: ${process.env.APP_URL}\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const webhook of webhooks) {
      try {
        await client.post({
          path: 'webhooks',
          data: { webhook }
        });
        console.log(`✅ Registered: ${webhook.topic}`);
        console.log(`   → ${webhook.address}\n`);
        successCount++;
      } catch (webhookError) {
        console.error(`❌ Failed: ${webhook.topic}`);
        console.error(`   Error: ${webhookError.message}\n`);
        errorCount++;
      }
    }

    console.log('\n📊 Summary:\n');
    console.log(`✅ Successfully registered: ${successCount}/${webhooks.length}`);
    if (errorCount > 0) {
      console.log(`❌ Failed: ${errorCount}/${webhooks.length}`);
      console.log('\nNote: Webhooks may already be registered (this is OK)');
    }

    console.log('\n💡 To verify webhooks, run:');
    console.log(`node scripts/verify-webhooks.js ${shopDomain}`);

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
  console.error('Usage: node scripts/register-webhooks.js <shop-domain>');
  console.error('Example: node scripts/register-webhooks.js digikey-hq.myshopify.com');
  process.exit(1);
}

registerWebhooks(shopDomain);
