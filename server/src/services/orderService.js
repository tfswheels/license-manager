// server/src/services/orderService.js
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

        // Send email with template support
        await sendLicenseEmail({
          email: orderData.email,
          firstName: orderData.customer?.first_name || 'Customer',
          lastName: orderData.customer?.last_name || '',
          orderNumber: orderData.order_number || orderData.name,
          productName: lineItem.title,
          productId: dbProductId, // Pass product ID for template lookup
          licenses: licenses.map(l => l.license_key)
        });

        await connection.execute(
          `INSERT INTO email_logs (order_id, order_item_id, customer_email, 
            licenses_sent, email_status)
           VALUES (?, ?, ?, ?, ?)`,
          [orderId, orderItemId, orderData.email, JSON.stringify(licenses.map(l => l.license_key)), 'sent']
        );

        await connection.execute(
          `UPDATE order_items SET email_sent = TRUE, email_sent_at = NOW() WHERE id = ?`,
          [orderItemId]
        );

        await checkInventoryAlerts(connection, dbProductId);
      } else {
        console.warn(`⚠️ Not enough licenses for product ${lineItem.title}`);
      }
    }

    await connection.commit();
    console.log(`✅ Order ${orderData.order_number} processed successfully`);

    return { success: true, orderId };

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
    `SELECT id, license_key FROM licenses 
     WHERE product_id = ? AND allocated = FALSE 
     LIMIT ?`,
    [productId, quantity]
  );

  if (availableLicenses.length < quantity) {
    console.warn(
      `Only ${availableLicenses.length} of ${quantity} licenses available for product ${productId}`
    );
  }

  if (availableLicenses.length === 0) {
    return [];
  }

  const licenseIds = availableLicenses.map(l => l.id);
  const placeholders = licenseIds.map(() => '?').join(',');

  await connection.execute(
    `UPDATE licenses 
     SET allocated = TRUE, order_id = ?, allocated_at = NOW() 
     WHERE id IN (${placeholders})`,
    [orderId, ...licenseIds]
  );

  return availableLicenses;
}

export async function manualAllocate(orderId) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [orderItems] = await connection.execute(
      `SELECT oi.*, o.customer_email, o.customer_first_name, o.customer_last_name, 
              o.order_number, p.product_name, p.id as product_id
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ? AND oi.licenses_allocated < oi.quantity`,
      [orderId]
    );

    if (orderItems.length === 0) {
      await connection.commit();
      return { success: true, message: 'All licenses already allocated' };
    }

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

        // Send email with template support
        await sendLicenseEmail({
          email: item.customer_email,
          firstName: item.customer_first_name || 'Customer',
          lastName: item.customer_last_name || '',
          orderNumber: item.order_number,
          productName: item.product_name,
          productId: item.product_id, // Pass product ID for template lookup
          licenses: licenses.map(l => l.license_key)
        });

        await connection.execute(
          `INSERT INTO email_logs (order_id, order_item_id, customer_email, 
            licenses_sent, email_status)
           VALUES (?, ?, ?, ?, ?)`,
          [orderId, item.id, item.customer_email, JSON.stringify(licenses.map(l => l.license_key)), 'sent']
        );

        await connection.execute(
          `UPDATE order_items SET email_sent = TRUE, email_sent_at = NOW() WHERE id = ?`,
          [item.id]
        );
      }
    }

    await connection.commit();
    console.log(`✅ Manual allocation completed for order ${orderId}`);

    return { success: true, message: 'Licenses allocated and sent' };

  } catch (error) {
    await connection.rollback();
    console.error('Manual allocation error:', error);
    throw error;
  } finally {
    connection.release();
  }
}