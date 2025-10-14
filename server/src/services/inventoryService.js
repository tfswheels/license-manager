import db from '../config/database.js';
import { sendInventoryAlert } from './emailService.js';

export async function checkInventoryAlerts(connection, productId) {
  try {
    const [counts] = await connection.execute(
      `SELECT COUNT(*) as available 
       FROM licenses 
       WHERE product_id = ? AND allocated = FALSE`,
      [productId]
    );

    const availableCount = counts[0].available;
    const threshold = parseInt(process.env.LOW_INVENTORY_THRESHOLD || '10');

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
            threshold
          });

          await connection.execute(
            `INSERT INTO inventory_alerts 
             (product_id, available_count, threshold, alert_sent, alert_sent_at)
             VALUES (?, ?, ?, TRUE, CURRENT_TIMESTAMP)`,
            [productId, availableCount, threshold]
          );

          console.log(`⚠️ Low inventory alert sent for ${productName}`);
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
