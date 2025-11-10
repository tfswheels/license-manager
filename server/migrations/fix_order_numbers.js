// Migration script to fix order numbers by fetching from Shopify
import mysql from 'mysql2/promise';
import { shopify } from '../src/config/shopify.js';

// Use Railway database directly (not .env)
const db = mysql.createPool({
  host: 'turntable.proxy.rlwy.net',
  user: 'root',
  password: 'ctVFdDmcnRZMPCCdEnmrTTbsHnurDXMW',
  database: 'railway',
  port: 50440,
  waitForConnections: true,
  connectionLimit: 10
});

async function fixOrderNumbers() {
  console.log('Starting order number migration...');

  try {
    // Test database connection first
    console.log('Testing database connection...');
    const connection = await db.getConnection();
    console.log('✓ Database connection established');
    connection.release();

    // Get all orders that aren't manual orders from all shops
    const query = `
      SELECT o.id, o.shopify_order_id, o.order_number, s.shop_domain, s.access_token, s.id as shop_id
      FROM orders o
      JOIN shops s ON o.shop_id = s.id
      WHERE o.shopify_order_id NOT LIKE 'MANUAL-%'
      ORDER BY o.id DESC
    `;

    console.log('Executing query...');
    const [orders] = await db.execute(query);

    console.log(`Found ${orders.length} orders to check`);
    if (orders.length === 0) {
      console.log('No orders found - this might indicate a database connection issue');
      return;
    }

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const order of orders) {
      try {
        // Skip if order_number already looks correct (starts with # or contains -)
        if (order.order_number && (order.order_number.includes('-') || order.order_number.startsWith('#'))) {
          console.log(`Skipping order ${order.id} - already has correct format: ${order.order_number}`);
          skipped++;
          continue;
        }

        // Fetch order from Shopify
        const client = new shopify.clients.Rest({
          session: {
            shop: order.shop_domain,
            accessToken: order.access_token
          }
        });

        const response = await client.get({
          path: `orders/${order.shopify_order_id}`
        });

        const shopifyOrder = response.body.order;
        const correctOrderNumber = shopifyOrder.name || shopifyOrder.order_number;

        // Update in database
        await db.execute(
          'UPDATE orders SET order_number = ? WHERE id = ?',
          [correctOrderNumber, order.id]
        );

        console.log(`✓ Updated order ${order.id}: ${order.order_number} → ${correctOrderNumber}`);
        updated++;

        // Rate limiting - wait 500ms between requests
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`✗ Error updating order ${order.id}:`, error.message);
        errors++;
      }
    }

    console.log('\n=== Migration Complete ===');
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);
    console.log(`Total: ${orders.length}`);

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await db.end();
  }
}

// Run migration
fixOrderNumbers()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
