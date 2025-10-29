import db from '../config/database.js';
import { sendInventoryAlert } from './emailService.js';

export async function checkInventoryAlerts(connection, productId, shopId) {
  try {
    // Get shop settings for threshold and alert email
    const [shopSettings] = await connection.execute(
      `SELECT low_stock_threshold, notify_on_low_stock, notification_email
       FROM shop_settings
       WHERE shop_id = ?`,
      [shopId]
    );

    // Skip if low stock alerts are disabled
    if (shopSettings.length === 0 || !shopSettings[0].notify_on_low_stock) {
      return;
    }

    const threshold = shopSettings[0].low_stock_threshold || 5;
    const notificationEmail = shopSettings[0].notification_email;

    // Skip if no notification email is configured
    if (!notificationEmail) {
      console.log(`⚠️ Low stock alerts enabled but no notification_email configured for shop ${shopId}`);
      return;
    }

    const [counts] = await connection.execute(
      `SELECT COUNT(*) as available
       FROM licenses
       WHERE product_id = ? AND allocated = FALSE`,
      [productId]
    );

    const availableCount = counts[0].available;

    if (availableCount <= threshold) {
      const [recentAlerts] = await connection.execute(
        `SELECT id FROM inventory_alerts
         WHERE product_id = ?
         AND alert_sent = TRUE
         AND alert_sent_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
        [productId]
      );

      if (recentAlerts.length === 0) {
        const [products] = await connection.execute(
          'SELECT product_name FROM products WHERE id = ?',
          [productId]
        );

        if (products.length > 0) {
          const productName = products[0].product_name;

          await sendInventoryAlert({
            productName,
            availableCount,
            threshold,
            toEmail: notificationEmail
          });

          await connection.execute(
            `INSERT INTO inventory_alerts
             (product_id, available_count, threshold, alert_sent, alert_sent_at)
             VALUES (?, ?, ?, TRUE, CURRENT_TIMESTAMP)`,
            [productId, availableCount, threshold]
          );

          console.log(`⚠️ Low inventory alert sent for ${productName} to ${notificationEmail}`);
        }
      }
    }
  } catch (error) {
    console.error('Inventory check error:', error);
  }
}

export async function getInventoryStats(productId) {
  const connection = await db.getConnection();
  
  try {
    const [stats] = await connection.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN allocated = FALSE THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN allocated = TRUE THEN 1 ELSE 0 END) as allocated
       FROM licenses 
       WHERE product_id = ?`,
      [productId]
    );

    return stats[0];
  } finally {
    connection.release();
  }
}
