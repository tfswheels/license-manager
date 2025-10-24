// scripts/list-shops.js
import db from '../src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * List all shops in the database with details
 */
async function listShops() {
  try {
    console.log('\n📋 All Shops in Database:\n');

    const [shops] = await db.execute(`
      SELECT
        id,
        shop_domain,
        installed_at,
        updated_at,
        access_token IS NOT NULL as has_token
      FROM shops
      ORDER BY installed_at DESC
    `);

    if (shops.length === 0) {
      console.log('❌ No shops found in database\n');
    } else {
      shops.forEach(shop => {
        console.log(`Shop ID: ${shop.id}`);
        console.log(`Domain: ${shop.shop_domain}`);
        console.log(`Installed: ${shop.installed_at}`);
        console.log(`Updated: ${shop.updated_at}`);
        console.log(`Has Access Token: ${shop.has_token ? '✅' : '❌'}`);
        console.log('---');
      });
      console.log(`\nTotal: ${shops.length} shop(s)\n`);
    }

    await db.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await db.end();
    process.exit(1);
  }
}

listShops();
