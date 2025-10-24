// scripts/debug-database.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Debug database connection - find which database we're actually using
 */
async function debugDatabase() {
  let connection;

  try {
    console.log('\n🔍 Debugging Database Connection...\n');

    // Create direct connection to Railway
    const railwayConfig = {
      host: 'turntable.proxy.rlwy.net',
      user: 'root',
      password: 'ctVFdDmcnRZMPCCdEnmrTTbsHnurDXMW',
      port: 50440,
      // Don't specify database - we want to see all
    };

    connection = await mysql.createConnection(railwayConfig);

    console.log('✅ Connected to Railway MySQL\n');

    // List all databases
    console.log('📋 All Databases on Railway:');
    const [databases] = await connection.query('SHOW DATABASES');
    databases.forEach(db => {
      console.log(`  - ${db.Database}`);
    });
    console.log('');

    // Check railway database (Railway's default database name)
    console.log('🔍 Checking railway database:\n');
    await connection.query('USE railway');

    const [shops] = await connection.query('SELECT id, shop_domain, installed_at FROM shops ORDER BY id DESC');
    console.log(`Found ${shops.length} shops in railway database:`);
    shops.forEach(shop => {
      console.log(`  ID ${shop.id}: ${shop.shop_domain} (installed ${shop.installed_at})`);
    });
    console.log('');

    // Check environment variables the server is using
    console.log('📋 Environment Variables (.env file):');
    console.log(`  DB_HOST: ${process.env.DB_HOST || '❌ NOT SET'}`);
    console.log(`  DB_NAME: ${process.env.DB_NAME || '❌ NOT SET'}`);
    console.log(`  DB_USER: ${process.env.DB_USER || '❌ NOT SET'}`);
    console.log(`  DB_PORT: ${process.env.DB_PORT || '❌ NOT SET'}`);
    console.log('');

    // Check if there are other databases with shops tables
    console.log('🔍 Searching for other databases with shops table:\n');
    for (const dbRow of databases) {
      const dbName = dbRow.Database;
      if (dbName === 'information_schema' || dbName === 'mysql' || dbName === 'performance_schema' || dbName === 'sys') {
        continue;
      }

      try {
        await connection.query(`USE ${dbName}`);
        const [tables] = await connection.query("SHOW TABLES LIKE 'shops'");

        if (tables.length > 0) {
          console.log(`✅ Found 'shops' table in database: ${dbName}`);
          const [shopCount] = await connection.query('SELECT COUNT(*) as count FROM shops');
          const [shopList] = await connection.query('SELECT id, shop_domain FROM shops ORDER BY id DESC LIMIT 5');

          console.log(`   Total shops: ${shopCount[0].count}`);
          shopList.forEach(shop => {
            console.log(`   - ID ${shop.id}: ${shop.shop_domain}`);
          });
          console.log('');
        }
      } catch (err) {
        // Skip databases we can't access
      }
    }

    console.log('💡 Summary:');
    console.log('  If you see shop ID 12 in a different database,');
    console.log('  that means your server is connecting to a different database!');
    console.log('  Check your Railway environment variables.\n');

    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

debugDatabase();
