// scripts/check-db-connection.js
import db from '../src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Check database connection and show which database we're connected to
 */
async function checkConnection() {
  try {
    console.log('\n🔍 Checking Database Connection...\n');

    // Show environment variables (masked)
    console.log('📋 Environment Variables:');
    console.log(`DB_HOST: ${process.env.DB_HOST || '❌ NOT SET'}`);
    console.log(`DB_USER: ${process.env.DB_USER || '❌ NOT SET'}`);
    console.log(`DB_NAME: ${process.env.DB_NAME || '❌ NOT SET'}`);
    console.log(`DB_PORT: ${process.env.DB_PORT || '3306 (default)'}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development (default)'}\n`);

    // Try to connect
    console.log('🔌 Attempting connection...\n');

    const [dbInfo] = await db.execute('SELECT DATABASE() as current_database');
    console.log(`✅ Connected to database: ${dbInfo[0].current_database}\n`);

    // Count shops
    const [shopCount] = await db.execute('SELECT COUNT(*) as count FROM shops');
    console.log(`📊 Total shops in database: ${shopCount[0].count}\n`);

    // List all shops
    const [shops] = await db.execute(`
      SELECT id, shop_domain, installed_at
      FROM shops
      ORDER BY id DESC
      LIMIT 20
    `);

    if (shops.length > 0) {
      console.log('🏪 Shops in database:\n');
      shops.forEach(shop => {
        console.log(`  ID ${shop.id}: ${shop.shop_domain}`);
        console.log(`    Installed: ${shop.installed_at}\n`);
      });
    } else {
      console.log('❌ No shops found in this database\n');
    }

    await db.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Database Error:', error.message);
    console.error('\n💡 Possible issues:');
    console.error('  1. Missing .env file in server directory');
    console.error('  2. Incorrect database credentials');
    console.error('  3. Database server not accessible from this location');
    console.error('  4. Firewall blocking connection\n');

    await db.end();
    process.exit(1);
  }
}

checkConnection();
