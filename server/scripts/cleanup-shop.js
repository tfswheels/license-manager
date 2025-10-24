// scripts/cleanup-shop.js
import db from '../src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Clean up a shop from the database (useful after uninstall)
 * Usage: node scripts/cleanup-shop.js <shop-domain>
 */
async function cleanupShop(shopDomain) {
  try {
    console.log(`\n🗑️  Cleaning up shop: ${shopDomain}\n`);

    // Get shop first
    const [shops] = await db.execute(
      'SELECT id FROM shops WHERE shop_domain = ?',
      [shopDomain]
    );

    if (shops.length === 0) {
      console.log('❌ Shop not found in database');
      console.log('\nAvailable shops:');
      const [allShops] = await db.execute('SELECT shop_domain FROM shops');
      allShops.forEach(s => console.log(`  - ${s.shop_domain}`));
      await db.end();
      process.exit(1);
    }

    const shopId = shops[0].id;

    console.log('⚠️  WARNING: This will delete ALL data for this shop!');
    console.log('This includes:');
    console.log('  - Products');
    console.log('  - Licenses');
    console.log('  - Orders');
    console.log('  - Email templates');
    console.log('  - Settings');
    console.log('  - Template rules\n');

    // In a real scenario, you'd want to prompt for confirmation
    // For now, we'll proceed automatically

    console.log('🔄 Starting cleanup...\n');

    // Delete in correct order to respect foreign keys
    await db.execute('SET FOREIGN_KEY_CHECKS = 0');

    const deletions = [
      { table: 'allocated_licenses', query: 'DELETE FROM allocated_licenses WHERE order_id IN (SELECT id FROM orders WHERE shop_id = ?)' },
      { table: 'email_logs', query: 'DELETE el FROM email_logs el INNER JOIN orders o ON el.order_id = o.id WHERE o.shop_id = ?' },
      { table: 'order_items', query: 'DELETE oi FROM order_items oi INNER JOIN orders o ON oi.order_id = o.id WHERE o.shop_id = ?' },
      { table: 'orders', query: 'DELETE FROM orders WHERE shop_id = ?' },
      { table: 'licenses', query: 'DELETE l FROM licenses l INNER JOIN products p ON l.product_id = p.id WHERE p.shop_id = ?' },
      { table: 'template_assignment_rules', query: 'DELETE FROM template_assignment_rules WHERE shop_id = ?' },
      { table: 'email_templates', query: 'DELETE FROM email_templates WHERE shop_id = ?' },
      { table: 'shop_settings', query: 'DELETE FROM shop_settings WHERE shop_id = ?' },
      { table: 'usage_tracking', query: 'DELETE FROM usage_tracking WHERE shop_id = ?' },
      { table: 'products', query: 'DELETE FROM products WHERE shop_id = ?' },
      { table: 'shops', query: 'DELETE FROM shops WHERE id = ?' }
    ];

    for (const deletion of deletions) {
      try {
        const [result] = await db.execute(deletion.query, [shopId]);
        const affected = result.affectedRows || 0;
        console.log(`✅ ${deletion.table}: ${affected} row(s) deleted`);
      } catch (err) {
        console.log(`⚠️  ${deletion.table}: ${err.message}`);
      }
    }

    await db.execute('SET FOREIGN_KEY_CHECKS = 1');

    console.log(`\n✅ Shop ${shopDomain} has been completely removed from the database\n`);

    await db.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await db.end();
    process.exit(1);
  }
}

const shopDomain = process.argv[2];
if (!shopDomain) {
  console.error('Usage: node scripts/cleanup-shop.js <shop-domain>');
  console.error('Example: node scripts/cleanup-shop.js old-shop.myshopify.com');
  process.exit(1);
}

cleanupShop(shopDomain);
