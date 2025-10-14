import db from '../config/database.js';
import { sendLicenseEmail } from './emailService.js';
import { checkInventoryAlerts } from './inventoryService.js';

export async function processOrder(shopDomain, orderData) {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const [shops] = await connection.execute(
      'SELECT id FROM shops WHERE shop_domain = ?',
      [shopDomain]
    );

    if (shops.length === 0) {
      throw new Error(`Shop not found: ${shopDomain}`);
    }

    const shopId = shops[0].id;

    const [orderResult] = await connection.execute(
      `INSERT INTO orders (shop_id, shopify_order_id, order_number, customer_email, 
        customer_first_name, customer_last_name, order_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        shopId,
        orderData.id.toString(),
        orderData.order_number || orderData.name,
        orderData.email,
        orderData.customer?.first_name || '',
        orderData.customer?.last_name || '',
        orderData.financial_status
      ]
    );

    const orderId = orderResult.insertId;

    for (const lineItem of orderData.line_items) {
      const productId = lineItem.product_id?.toString();
      
      if (!productId) continue;

      const [products] = await connection.execute(
        `SELECT id FROM products 
         WHERE shop_id = ? AND shopify_product_id = ?`,
        [shopId, productId]
      );

      if (products.length === 0) {
        console.log(`⚠️ Product ${productId} not linked to licenses, skipping`);
        continue;
      }

      const dbProductId = products[0].id;
      const quantity = lineItem.quantity;

      const [orderItemResult] = await connection.execute(
        `INSERT INTO order_items (order_id, product_id, shopify_line_item_id, quantity)
         VALUES (?, ?, ?, ?)`,
        [orderId, dbProductId, lineItem.id.toString(), quantity]
      );

      const orderItemId = orderItemResult.insertId;

      const licenses = await allocateLicenses(
        connection, 
        dbProductId, 
        orderId, 
        quantity
      );

      if (licenses.length > 0) {
        await connection.execute(
          `UPDATE order_items SET licenses_allocated = ? WHERE id = ?`,
          [licenses.length, orderItemId]
        );

        await sendLicenseEmail({
          email: orderData.email,
          firstName: orderData.customer?.first_name || 'Customer',
          orderNumber: orderData.order_number || orderData.name,
          productName: lineItem.title,
          licenses: licenses.map(l => l.license_key)
        });

        await connection.execute(
          `INSERT INTO email_logs (order_id, order_item_id, customer_email, 
            licenses_sent, email_status)
           VALUES (?, ?, ?, ?, ?)`,
          [orderId, orderItemId, orderData.email, 
           JSON.stringify(licenses.map(l => l.license_key)), 'sent']
        );

        await connection.execute(
          `UPDATE order_items SET email_sent = TRUE, email_sent_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [orderItemId]
        );

        console.log(`✅ Allocated ${licenses.length} licenses for product ${dbProductId}`);
      } else {
        console.error(`❌ No licenses available for product ${dbProductId}`);
        
        await connection.execute(
          `INSERT INTO email_logs (order_id, order_item_id, customer_email, 
            email_status, error_message)
           VALUES (?, ?, ?, ?, ?)`,
          [orderId, orderItemId, orderData.email, 'failed', 
           'No licenses available']
        );
      }

      await checkInventoryAlerts(connection, dbProductId);
    }

    await connection.commit();
    console.log(`✅ Order ${orderData.order_number} processed successfully`);

  } catch (error) {
    await connection.rollback();
    console.error('Order processing error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

async function allocateLicenses(connection, productId, orderId, quantity) {
  const [availableLicenses] = await connection.execute(
    `SELECT id, license_key 
     FROM licenses 
     WHERE product_id = ? AND allocated = FALSE 
     ORDER BY id ASC
     LIMIT ?`,
    [productId, quantity]
  );

  if (availableLicenses.length < quantity) {
    console.warn(`⚠️ Requested ${quantity} licenses, only ${availableLicenses.length} available`);
  }

  const licenseIds = availableLicenses.map(l => l.id);
  
  if (licenseIds.length > 0) {
    await connection.execute(
      `UPDATE licenses 
       SET allocated = TRUE, order_id = ?, allocated_at = CURRENT_TIMESTAMP 
       WHERE id IN (${licenseIds.map(() => '?').join(',')})`,
      [orderId, ...licenseIds]
    );
  }

  return availableLicenses;
}

export async function manualAllocate(orderId) {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const [orders] = await connection.execute(
      `SELECT o.*, s.shop_domain 
       FROM orders o 
       JOIN shops s ON o.shop_id = s.id 
       WHERE o.id = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      throw new Error('Order not found');
    }

    const order = orders[0];

    const [orderItems] = await connection.execute(
      `SELECT oi.*, p.product_name 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = ? AND oi.licenses_allocated < oi.quantity`,
      [orderId]
    );

    for (const item of orderItems) {
      const needed = item.quantity - item.licenses_allocated;
      
      const licenses = await allocateLicenses(
        connection,
        item.product_id,
        orderId,
        needed
      );

      if (licenses.length > 0) {
        await connection.execute(
          `UPDATE order_items 
           SET licenses_allocated = licenses_allocated + ? 
           WHERE id = ?`,
          [licenses.length, item.id]
        );

        await sendLicenseEmail({
          email: order.customer_email,
          firstName: order.customer_first_name || 'Customer',
          orderNumber: order.order_number,
          productName: item.product_name,
          licenses: licenses.map(l => l.license_key)
        });

        await connection.execute(
          `UPDATE order_items 
           SET email_sent = TRUE, email_sent_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [item.id]
        );
      }
    }

    await connection.commit();
    return { success: true };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
