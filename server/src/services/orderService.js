// server/src/services/orderService.js
import db from '../config/database.js';
import { sendLicenseEmail, sendNotificationEmail } from './emailService.js';
import { checkInventoryAlerts } from './inventoryService.js';
import { getShopSettings } from './settingsService.js';
import { canProcessOrder } from './billingService.js';

export async function processOrder(shopDomain, orderData) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [shops] = await connection.execute(
      'SELECT id, access_token FROM shops WHERE shop_domain = ?',
      [shopDomain]
    );

    if (shops.length === 0) {
      throw new Error(`Shop not found: ${shopDomain}`);
    }

    const shopId = shops[0].id;
    const accessToken = shops[0].access_token;

    // Extract shop name from domain (e.g., "mystore" from "mystore.myshopify.com")
    const shopName = shopDomain.replace('.myshopify.com', '').replace('-', ' ');

    // Check if shop can process more orders based on their plan
    const orderLimitCheck = await canProcessOrder(shopId, shopDomain);
    if (!orderLimitCheck.allowed) {
      await connection.rollback();
      console.warn(`⚠️ Order ${orderData.order_number} rejected: Monthly limit (${orderLimitCheck.limit}) reached`);
      throw new Error(`Monthly order limit of ${orderLimitCheck.limit} orders has been reached. Please upgrade your plan to process more orders.`);
    }

    // Get shop settings for this order
    const settings = await getShopSettings(shopId);

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
        `INSERT INTO order_items (order_id, product_id, shopify_line_item_id, quantity, price)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, dbProductId, lineItem.id.toString(), quantity, parseFloat(lineItem.price) || 0]
      );

      const orderItemId = orderItemResult.insertId;

      const allocationResult = await allocateLicenses(
        connection,
        dbProductId,
        orderId,
        quantity,
        settings
      );

      const { licenses, uniquenessIssue } = allocationResult;

      if (licenses.length > 0) {
        await connection.execute(
          `UPDATE order_items SET licenses_allocated = ? WHERE id = ?`,
          [licenses.length, orderItemId]
        );

        // Send email with template support and settings
        await sendLicenseEmail({
          email: orderData.email,
          firstName: orderData.customer?.first_name || 'Customer',
          lastName: orderData.customer?.last_name || '',
          orderNumber: orderData.order_number || orderData.name,
          productName: lineItem.title,
          productId: dbProductId,
          licenses: licenses.map(l => l.license_key),
          settings,
          shopDomain,
          accessToken,
          shopName
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

        await checkInventoryAlerts(connection, dbProductId, shopId);

        // Send notification if uniqueness caused partial allocation
        if (uniquenessIssue && settings.notify_on_uniqueness_issue && settings.notification_email) {
          await sendNotificationEmail({
            to: settings.notification_email,
            subject: `License Uniqueness Issue - Order ${orderData.order_number}`,
            message: `Order ${orderData.order_number} requested ${quantity} licenses for "${lineItem.title}" but only ${licenses.length} unique licenses were available.`
          });
        }
      } else {
        // No licenses available
        console.warn(`⚠️ No licenses available for product ${lineItem.title}`);

        // Handle out of stock behavior
        if (settings.out_of_stock_behavior === 'send_placeholder') {
          // Send email with placeholder
          await sendLicenseEmail({
            email: orderData.email,
            firstName: orderData.customer?.first_name || 'Customer',
            lastName: orderData.customer?.last_name || '',
            orderNumber: orderData.order_number || orderData.name,
            productName: lineItem.title,
            productId: dbProductId,
            licenses: [],
            settings,
            placeholder: settings.out_of_stock_placeholder,
            shopDomain,
            accessToken,
            shopName
          });

          await connection.execute(
            `INSERT INTO email_logs (order_id, order_item_id, customer_email,
              licenses_sent, email_status)
             VALUES (?, ?, ?, ?, ?)`,
            [orderId, orderItemId, orderData.email, JSON.stringify([]), 'sent_placeholder']
          );

          await connection.execute(
            `UPDATE order_items SET email_sent = TRUE, email_sent_at = NOW() WHERE id = ?`,
            [orderItemId]
          );
        }
        // else: no_email - don't send anything

        // Send notification about out of stock
        if (settings.notify_on_out_of_stock && settings.notification_email) {
          await sendNotificationEmail({
            to: settings.notification_email,
            subject: `Out of Stock Alert - Order ${orderData.order_number}`,
            message: `Order ${orderData.order_number} could not be fulfilled for "${lineItem.title}" (Quantity: ${quantity}). No licenses available in the database.`
          });
        }
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

async function allocateLicenses(connection, productId, orderId, quantity, settings) {
  const safeLimit = parseInt(quantity) || 1;
  let uniquenessIssue = false;

  // Determine sort order based on FIFO/LIFO setting
  const sortOrder = settings.license_delivery_method === 'LIFO' ? 'DESC' : 'ASC';

  let query = `SELECT id, license_key FROM licenses
               WHERE product_id = ? AND allocated = FALSE`;

  // If enforce_unique_per_order is enabled, exclude licenses already allocated to this order
  if (settings.enforce_unique_per_order) {
    // Get licenses already allocated to this order for this product
    const [existingLicenses] = await connection.execute(
      `SELECT DISTINCT license_key FROM licenses
       WHERE product_id = ? AND order_id = ?`,
      [productId, orderId]
    );

    if (existingLicenses.length > 0) {
      const excludedKeys = existingLicenses.map(l => `'${l.license_key.replace(/'/g, "''")}'`).join(',');
      query += ` AND license_key NOT IN (${excludedKeys})`;
    }
  }

  // If enforce_unique_licenses is enabled, get distinct license keys only
  if (settings.enforce_unique_licenses) {
    // Get unique licenses with the earliest id for each key (or latest for LIFO)
    query = `SELECT id, license_key FROM licenses
             WHERE product_id = ? AND allocated = FALSE`;

    if (settings.enforce_unique_per_order) {
      const [existingLicenses] = await connection.execute(
        `SELECT DISTINCT license_key FROM licenses
         WHERE product_id = ? AND order_id = ?`,
        [productId, orderId]
      );

      if (existingLicenses.length > 0) {
        const excludedKeys = existingLicenses.map(l => `'${l.license_key.replace(/'/g, "''")}'`).join(',');
        query += ` AND license_key NOT IN (${excludedKeys})`;
      }
    }

    query += ` GROUP BY license_key
               ORDER BY ${sortOrder === 'DESC' ? 'MAX' : 'MIN'}(id) ${sortOrder}
               LIMIT ${safeLimit}`;

    const [uniqueLicenses] = await connection.execute(query, [productId]);

    if (uniqueLicenses.length < quantity) {
      uniquenessIssue = true;
      console.warn(
        `Only ${uniqueLicenses.length} unique licenses available for product ${productId} (requested ${quantity})`
      );
    }

    if (uniqueLicenses.length === 0) {
      return { licenses: [], uniquenessIssue };
    }

    const licenseIds = uniqueLicenses.map(l => l.id);
    const placeholders = licenseIds.map(() => '?').join(',');

    await connection.execute(
      `UPDATE licenses
       SET allocated = TRUE, order_id = ?, allocated_at = NOW()
       WHERE id IN (${placeholders})`,
      [orderId, ...licenseIds]
    );

    return { licenses: uniqueLicenses, uniquenessIssue };

  } else {
    // No uniqueness enforcement - just get licenses in order
    query += ` ORDER BY id ${sortOrder} LIMIT ${safeLimit}`;

    const [availableLicenses] = await connection.execute(query, [productId]);

    if (availableLicenses.length < quantity) {
      console.warn(
        `Only ${availableLicenses.length} of ${quantity} licenses available for product ${productId}`
      );
    }

    if (availableLicenses.length === 0) {
      return { licenses: [], uniquenessIssue: false };
    }

    const licenseIds = availableLicenses.map(l => l.id);
    const placeholders = licenseIds.map(() => '?').join(',');

    await connection.execute(
      `UPDATE licenses
       SET allocated = TRUE, order_id = ?, allocated_at = NOW()
       WHERE id IN (${placeholders})`,
      [orderId, ...licenseIds]
    );

    return { licenses: availableLicenses, uniquenessIssue: false };
  }
}

export async function manualAllocate(orderId) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [orderItems] = await connection.execute(
      `SELECT oi.*, o.customer_email, o.customer_first_name, o.customer_last_name,
              o.order_number, p.product_name, p.id as product_id, p.shop_id
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

    // Get shop settings and access token for email
    const shopId = orderItems[0].shop_id;
    const settings = await getShopSettings(shopId);

    const [shops] = await connection.execute(
      'SELECT shop_domain, access_token FROM shops WHERE id = ?',
      [shopId]
    );

    const shopDomain = shops[0]?.shop_domain;
    const accessToken = shops[0]?.access_token;
    const shopName = shopDomain?.replace('.myshopify.com', '').replace('-', ' ');

    for (const item of orderItems) {
      const needed = item.quantity - item.licenses_allocated;

      const allocationResult = await allocateLicenses(
        connection,
        item.product_id,
        orderId,
        needed,
        settings
      );

      const { licenses } = allocationResult;

      if (licenses.length > 0) {
        await connection.execute(
          `UPDATE order_items
           SET licenses_allocated = licenses_allocated + ?
           WHERE id = ?`,
          [licenses.length, item.id]
        );

        // Send email with template support and settings
        await sendLicenseEmail({
          email: item.customer_email,
          firstName: item.customer_first_name || 'Customer',
          lastName: item.customer_last_name || '',
          orderNumber: item.order_number,
          productName: item.product_name,
          productId: item.product_id,
          licenses: licenses.map(l => l.license_key),
          settings,
          shopDomain,
          accessToken,
          shopName
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

        // Check for low inventory alerts
        await checkInventoryAlerts(connection, item.product_id, shopId);
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