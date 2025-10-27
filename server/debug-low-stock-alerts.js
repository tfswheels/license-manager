// Debug script for low stock alerts
import db from './src/config/database.js';

async function debugLowStockAlerts() {
  const connection = await db.getConnection();

  try {
    console.log('\n=== LOW STOCK ALERT DEBUGGING ===\n');

    // 1. Check all shops
    const [shops] = await connection.execute('SELECT id, shop_domain FROM shops');
    console.log(`Found ${shops.length} shops:`);
    shops.forEach(shop => console.log(`  - Shop ID ${shop.id}: ${shop.shop_domain}`));

    if (shops.length === 0) {
      console.log('\n❌ No shops found in database!');
      return;
    }

    console.log('\n--- Checking each shop ---\n');

    for (const shop of shops) {
      console.log(`\n📊 Shop ID ${shop.id} (${shop.shop_domain})`);
      console.log('─'.repeat(60));

      // 2. Check shop settings
      const [settings] = await connection.execute(
        `SELECT
          low_stock_threshold,
          notify_on_low_stock,
          notification_email
         FROM shop_settings
         WHERE shop_id = ?`,
        [shop.id]
      );

      if (settings.length === 0) {
        console.log('❌ NO SETTINGS FOUND - shop_settings row does not exist!');
        console.log('   Run the migration or create default settings.\n');
        continue;
      }

      const setting = settings[0];

      console.log('\n✓ Shop Settings:');
      console.log(`  notify_on_low_stock: ${setting.notify_on_low_stock ? '✓ ENABLED' : '✗ DISABLED'}`);
      console.log(`  notification_email: ${setting.notification_email || '❌ NOT SET'}`);
      console.log(`  low_stock_threshold: ${setting.low_stock_threshold ?? '(null, will default to 10)'}`);

      // Check for issues
      const issues = [];
      if (!setting.notify_on_low_stock) {
        issues.push('⚠️  notify_on_low_stock is DISABLED');
      }
      if (!setting.notification_email) {
        issues.push('⚠️  notification_email is NOT SET (emails will not be sent)');
      }

      if (issues.length > 0) {
        console.log('\n🔴 ISSUES FOUND:');
        issues.forEach(issue => console.log(`  ${issue}`));
        console.log('\n💡 Fix: Go to System Settings in the admin panel and:');
        if (!setting.notification_email) {
          console.log('   1. Set the "Notification Email Address"');
        }
        if (!setting.notify_on_low_stock) {
          console.log('   2. Enable "Notify on Low Stock"');
        }
        continue;
      }

      console.log('\n✓ Settings are correctly configured!');

      // 3. Check products and their inventory
      const [products] = await connection.execute(
        'SELECT id, product_name, shopify_product_id FROM products WHERE shop_id = ?',
        [shop.id]
      );

      if (products.length === 0) {
        console.log('\n⚠️  No products found for this shop');
        continue;
      }

      console.log(`\n📦 Found ${products.length} products. Checking inventory...`);

      const threshold = setting.low_stock_threshold || 10;

      for (const product of products) {
        const [counts] = await connection.execute(
          `SELECT COUNT(*) as total,
            SUM(CASE WHEN allocated = FALSE THEN 1 ELSE 0 END) as available
           FROM licenses
           WHERE product_id = ?`,
          [product.id]
        );

        const count = counts[0];
        const available = count.available || 0;
        const total = count.total || 0;

        const belowThreshold = available <= threshold;
        const status = belowThreshold ? '🔴 LOW STOCK' : '✓';

        console.log(`\n  ${status} Product: ${product.product_name} (ID: ${product.id})`);
        console.log(`     Available: ${available} / Total: ${total} (Threshold: ${threshold})`);

        if (belowThreshold) {
          // Check for recent alerts
          const [recentAlerts] = await connection.execute(
            `SELECT id, alert_sent_at, available_count
             FROM inventory_alerts
             WHERE product_id = ?
             AND alert_sent = TRUE
             AND alert_sent_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
             ORDER BY alert_sent_at DESC
             LIMIT 1`,
            [product.id]
          );

          if (recentAlerts.length > 0) {
            const alert = recentAlerts[0];
            const sentAt = new Date(alert.alert_sent_at);
            const hoursAgo = ((Date.now() - sentAt.getTime()) / (1000 * 60 * 60)).toFixed(1);
            console.log(`     ⚠️  Alert already sent ${hoursAgo} hours ago`);
            console.log(`     (Count was ${alert.available_count} at that time)`);
            console.log(`     Next alert can be sent after 24 hours from last alert`);
          } else {
            console.log(`     ✓ No recent alerts (within 24 hours)`);
            console.log(`     📧 Alert SHOULD be sent on next order processing`);
          }

          // Check all alerts history
          const [allAlerts] = await connection.execute(
            `SELECT id, alert_sent_at, available_count
             FROM inventory_alerts
             WHERE product_id = ?
             ORDER BY alert_sent_at DESC
             LIMIT 5`,
            [product.id]
          );

          if (allAlerts.length > 0) {
            console.log(`     📜 Alert history (last 5):`);
            allAlerts.forEach(a => {
              const date = new Date(a.alert_sent_at).toISOString();
              console.log(`        - ${date}: ${a.available_count} licenses available`);
            });
          } else {
            console.log(`     📜 No alerts have ever been sent for this product`);
          }
        }
      }
    }

    console.log('\n\n=== SUMMARY ===\n');
    console.log('Low stock alerts are triggered when:');
    console.log('  1. An order is processed (after licenses are allocated)');
    console.log('  2. Available licenses <= threshold');
    console.log('  3. notify_on_low_stock is enabled');
    console.log('  4. notification_email is set');
    console.log('  5. No alert has been sent in the last 24 hours for that product');
    console.log('\nEmail content:');
    console.log('  - Subject: "⚠️ Low Inventory Alert: [Product Name]"');
    console.log('  - Sent to: notification_email from shop_settings');
    console.log('  - Contains: Product name, available count, threshold');
    console.log('\nCheck /home/user/license-manager/server/src/services/emailService.js:147');
    console.log('for the exact email template.\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

debugLowStockAlerts();
