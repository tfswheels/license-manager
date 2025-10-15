// Run this locally to check shop data
// node check-shop-token.js

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkShop() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306')
  });

  console.log('Checking shops table...\n');

  const [shops] = await connection.execute('SELECT * FROM shops');

  if (shops.length === 0) {
    console.log('❌ NO SHOPS FOUND IN DATABASE');
    console.log('   You need to install the app via /auth/install?shop=YOUR_SHOP');
    return;
  }

  shops.forEach((shop, index) => {
    console.log(`Shop ${index + 1}:`);
    console.log(`  Domain: ${shop.shop_domain}`);
    console.log(`  Token: ${shop.access_token ? `${shop.access_token.substring(0, 20)}...` : 'MISSING'}`);
    console.log(`  Installed: ${shop.installed_at}`);
    console.log('');
  });

  await connection.end();
}

checkShop().catch(console.error);