// server/check-shops.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkShops() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306')
  });

  try {
    console.log('📊 Checking installed shops...\n');
    
    const [shops] = await connection.execute(
      'SELECT id, shop_domain, installed_at, updated_at FROM shops'
    );

    if (shops.length === 0) {
      console.log('❌ No shops installed yet');
    } else {
      console.log(`✅ Found ${shops.length} shop(s):\n`);
      shops.forEach(shop => {
        console.log(`  Shop: ${shop.shop_domain}`);
        console.log(`  ID: ${shop.id}`);
        console.log(`  Installed: ${shop.installed_at}`);
        console.log(`  Updated: ${shop.updated_at}`);
        console.log('---');
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkShops();