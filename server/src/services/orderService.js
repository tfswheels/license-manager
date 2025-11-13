// server/src/services/orderService.js
import db from '../config/database.js';
import { sendLicenseEmail, sendNotificationEmail } from './emailService.js';
import { checkInventoryAlerts } from './inventoryService.js';
import { getShopSettings } from './settingsService.js';
import { canProcessOrder } from './billingService.js';
import { shopify } from '../config/shopify.js';

/**
 * Mark a Shopify order as fulfilled after successful license delivery
 */
/**
 * Add timeline note and DigiKey tag to Shopify order
 */
async function addOrderTimelineAndTag(shopDomain, accessToken, shopifyOrderId, orderNum) {
  if (!shopifyOrderId || shopifyOrderId.startsWith('MANUAL-')) {
    return;
  }

  try {
    const client = new shopify.clients.Rest({
      session: { shop: shopDomain, accessToken }
    });

    // Get current order to preserve existing data
    const orderResponse = await client.get({
      path: `orders/${shopifyOrderId}`
    });
    const order = orderResponse.body.order;
    const currentTags = order.tags || '';
    const currentNote = order.note || '';

    // Add DigiKey tag if not already present
    const tags = currentTags.split(',').map(t => t.trim()).filter(Boolean);
    if (!tags.includes('DigiKey')) {
      tags.push('DigiKey');
    }

    // Append timeline note to existing note (Shopify only has one note field per order)
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'UTC' });
    const newNote = currentNote
      ? `${currentNote}\n\n[${timestamp}] DigiKey HQ: License keys delivered automatically`
      : `[${timestamp}] DigiKey HQ: License keys delivered automatically`;

    // Update order with tags and note in single request
    await client.put({
      path: `orders/${shopifyOrderId}`,
      data: {
        order: {
          tags: tags.join(', '),
          note: newNote
        }
      }
    });

    console.log(`✅ Added DigiKey note and tag to order ${orderNum}`);
  } catch (error) {
    console.error(`⚠️ Failed to add note/tag to order ${orderNum}:`, error.message);
    if (error.response?.body) {
      console.error('Shopify error details:', JSON.stringify(error.response.body, null, 2));
    }
    // Don't throw - this is not critical enough to fail the whole order
  }
}

async function fulfillShopifyOrder(shopDomain, accessToken, shopifyOrderId, lineItemId) {
  try {
    // Don't try to fulfill manual orders
    if (!shopifyOrderId || shopifyOrderId.startsWith('MANUAL-')) {
      console.log('Skipping fulfillment for manual order:', shopifyOrderId);
      return { success: false, reason: 'manual_order' };
    }

    const client = new shopify.clients.Rest({
      session: { shop: shopDomain, accessToken }
    });

    // Debug: Get the full order details first to see fulfillment status
    console.log(`🔍 Fetching order details for ${shopifyOrderId}...`);
    const orderResponse = await client.get({
      path: `orders/${shopifyOrderId}`
    });
    const order = orderResponse.body.order;
    console.log(`🔍 Order fulfillment_status: ${order.fulfillment_status}`);
    console.log(`🔍 Order financial_status: ${order.financial_status}`);
    console.log(`🔍 Order requires_shipping: ${order.line_items?.[0]?.requires_shipping}`);

    // Step 1: Get fulfillment orders for this order
    const fulfillmentOrdersResponse = await client.get({
      path: `orders/${shopifyOrderId}/fulfillment_orders`
    });

    const fulfillmentOrders = fulfillmentOrdersResponse.body.fulfillment_orders || [];

    console.log(`📦 Found ${fulfillmentOrders.length} fulfillment orders for order ${shopifyOrderId}`);
    if (fulfillmentOrders.length > 0) {
      console.log('📦 Fulfillment orders:', JSON.stringify(fulfillmentOrders, null, 2));
    }

    if (fulfillmentOrders.length === 0) {
      console.log('❌ No fulfillment orders found for order:', shopifyOrderId);
      console.log('💡 Order likely has no shipping address (common for digital products)');
      console.log('💡 Skipping fulfillment for digital product - licenses already delivered via email');

      // For digital products without shipping, we don't need to create a Shopify fulfillment
      // The order is considered "fulfilled" once the license keys are delivered via email
      // Shopify's fulfillment API is primarily for tracking physical shipments
      return { success: true, method: 'digital_no_fulfillment', reason: 'Digital product - no shipping required' };
    }

    // Find the fulfillment order that contains our line item
    let targetFulfillmentOrder = null;
    for (const fo of fulfillmentOrders) {
      const lineItemIds = fo.line_items?.map(li => li.line_item_id) || [];
      if (lineItemIds.includes(parseInt(lineItemId))) {
        targetFulfillmentOrder = fo;
        break;
      }
    }

    // If not found, use the first open fulfillment order
    if (!targetFulfillmentOrder) {
      targetFulfillmentOrder = fulfillmentOrders.find(fo => fo.status === 'open');
    }

    if (!targetFulfillmentOrder) {
      console.log('No open fulfillment order found for order:', shopifyOrderId);
      return { success: false, reason: 'no_open_fulfillment_order' };
    }

    // Step 2: Create fulfillment using the new API
    const fulfillmentData = {
      fulfillment: {
        line_items_by_fulfillment_order: [
          {
            fulfillment_order_id: targetFulfillmentOrder.id,
            fulfillment_order_line_items: [
              {
                id: targetFulfillmentOrder.line_items.find(li => li.line_item_id === parseInt(lineItemId))?.id || targetFulfillmentOrder.line_items[0].id,
                quantity: 1
              }
            ]
          }
        ],
        notify_customer: false // We already sent our own email
      }
    };

    await client.post({
      path: 'fulfillments',
      data: fulfillmentData
    });

    console.log(`✅ Fulfilled Shopify order ${shopifyOrderId} line item ${lineItemId}`);
    return { success: true };

  } catch (error) {
    // Don't fail the entire order process if fulfillment fails
    console.error(`⚠️ Failed to fulfill Shopify order ${shopifyOrderId}:`, error.message);
    if (error.response?.body) {
      console.error('Shopify error details:', JSON.stringify(error.response.body, null, 2));
    }
    return { success: false, error: error.message };
  }
}

export async function processOrder(shopDomain, orderData) {
  const connection = await db.getConnection();
  let shopId = null; // Declare outside try block so it's accessible in catch

  try {
    await connection.beginTransaction();

    const [shops] = await connection.execute(
      'SELECT id, access_token FROM shops WHERE shop_domain = ?',
      [shopDomain]
    );

    if (shops.length === 0) {
      throw new Error(`Shop not found: ${shopDomain}`);
    }

    shopId = shops[0].id;
    const accessToken = shops[0].access_token;

    // Extract shop name from domain (e.g., "mystore" from "mystore.myshopify.com")
    const shopName = shopDomain.replace('.myshopify.com', '').replace('-', ' ');

    // Check if shop can process more orders based on their plan
    const orderLimitCheck = await canProcessOrder(shopId, shopDomain);
    if (!orderLimitCheck.allowed) {
      await connection.rollback();
      const orderNum = orderData.name || orderData.order_number || `#${orderData.id}`;
      console.warn(`⚠️ Order ${orderNum} rejected: Monthly limit (${orderLimitCheck.limit}) reached`);
      throw new Error(`Monthly order limit of ${orderLimitCheck.limit} orders has been reached. Please upgrade your plan to process more orders.`);
    }

    // Check if order already exists (prevents duplicate processing from webhook retries)
    const [existingOrders] = await connection.execute(
      'SELECT id FROM orders WHERE shop_id = ? AND shopify_order_id = ?',
      [shopId, orderData.id.toString()]
    );

    if (existingOrders.length > 0) {
      await connection.commit();
      const orderNum = orderData.name || orderData.order_number || `#${orderData.id}`;
      console.log(`⚠️ Order ${orderNum} already processed, skipping duplicate webhook`);
      return { success: true, orderId: existingOrders[0].id, duplicate: true };
    }

    // Get shop settings for this order
    const settings = await getShopSettings(shopId);

    // Extract customer email from various possible locations in Shopify webhook
    // NOTE: Email will be null until Shopify approves email access for webhooks
    // Once approved, the email should appear in orderData.email or orderData.contact_email
    const customerEmail = orderData.email ||
                         orderData.contact_email ||
                         orderData.customer?.email ||
                         null;

    // Extract customer name with fallbacks to billing/shipping address
    const customerFirstName = orderData.customer?.first_name ||
                             orderData.billing_address?.first_name ||
                             orderData.shipping_address?.first_name ||
                             null;

    const customerLastName = orderData.customer?.last_name ||
                            orderData.billing_address?.last_name ||
                            orderData.shipping_address?.last_name ||
                            null;

    const [orderResult] = await connection.execute(
      `INSERT INTO orders (shop_id, shopify_order_id, order_number, customer_email,
        customer_first_name, customer_last_name, order_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        shopId,
        orderData.id.toString(),
        orderData.name || orderData.order_number || `#${orderData.id}`,
        customerEmail,
        customerFirstName,
        customerLastName,
        orderData.financial_status ?? null
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
          email: customerEmail,
          firstName: customerFirstName || 'Customer',
          lastName: customerLastName || '',
          orderNumber: orderData.name || orderData.order_number || `#${orderData.id}`,
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
          [orderId, orderItemId, customerEmail, JSON.stringify(licenses.map(l => l.license_key)), 'sent']
        );

        await connection.execute(
          `UPDATE order_items SET email_sent = TRUE, email_sent_at = NOW() WHERE id = ?`,
          [orderItemId]
        );

        // Mark Shopify order as fulfilled after successful email delivery
        await fulfillShopifyOrder(shopDomain, accessToken, orderData.id?.toString(), lineItem.id?.toString());

        await checkInventoryAlerts(connection, dbProductId, shopId);

        // Send notification if uniqueness caused partial allocation
        if (uniquenessIssue && settings.notify_on_uniqueness_issue && settings.notification_email) {
          const orderNum = orderData.name || orderData.order_number || `#${orderData.id}`;
          await sendNotificationEmail({
            to: settings.notification_email,
            subject: `License Uniqueness Issue - Order ${orderNum}`,
            message: `Order ${orderNum} requested ${quantity} licenses for "${lineItem.title}" but only ${licenses.length} unique licenses were available.`
          });
        }
      } else {
        // No licenses available
        console.warn(`⚠️ No licenses available for product ${lineItem.title}`);

        // Handle out of stock behavior
        if (settings.out_of_stock_behavior === 'send_placeholder') {
          // Send email with placeholder
          await sendLicenseEmail({
            email: customerEmail,
            firstName: customerFirstName || 'Customer',
            lastName: customerLastName || '',
            orderNumber: orderData.name || orderData.order_number || `#${orderData.id}`,
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
            [orderId, orderItemId, customerEmail, JSON.stringify([]), 'sent_placeholder']
          );

          await connection.execute(
            `UPDATE order_items SET email_sent = TRUE, email_sent_at = NOW() WHERE id = ?`,
            [orderItemId]
          );

          // Mark Shopify order as fulfilled even with placeholder email
          await fulfillShopifyOrder(shopDomain, accessToken, orderData.id?.toString(), lineItem.id?.toString());
        }
        // else: no_email - don't send anything

        // Send notification about out of stock
        if (settings.notify_on_out_of_stock && settings.notification_email) {
          const orderNum = orderData.name || orderData.order_number || `#${orderData.id}`;
          await sendNotificationEmail({
            to: settings.notification_email,
            subject: `Out of Stock Alert - Order ${orderNum}`,
            message: `Order ${orderNum} could not be fulfilled for "${lineItem.title}" (Quantity: ${quantity}). No licenses available in the database.`
          });
        }
      }
    }

    await connection.commit();
    const orderNum = orderData.name || orderData.order_number || `#${orderData.id}`;
    console.log(`✅ Order ${orderNum} processed successfully`);

    // Add timeline note and tag to Shopify order
    await addOrderTimelineAndTag(shopDomain, accessToken, orderData.id?.toString(), orderNum);

    return { success: true, orderId };

  } catch (error) {
    await connection.rollback();

    // Handle duplicate entry error gracefully (from concurrent webhook deliveries)
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage?.includes('unique_shopify_order')) {
      const orderNum = orderData.name || orderData.order_number || `#${orderData.id}`;
      console.log(`⚠️ Duplicate webhook detected for order ${orderNum} - already processed by concurrent request`);

      // Fetch the existing order ID
      const [existingOrders] = await connection.execute(
        'SELECT id FROM orders WHERE shop_id = ? AND shopify_order_id = ?',
        [shopId, orderData.id.toString()]
      );

      return { success: true, orderId: existingOrders[0]?.id, duplicate: true };
    }

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
              o.order_number, o.shopify_order_id, p.product_name, p.id as product_id, p.shop_id
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

        // Mark Shopify order as fulfilled after manual allocation email delivery
        if (item.shopify_order_id && item.shopify_line_item_id) {
          await fulfillShopifyOrder(shopDomain, accessToken, item.shopify_order_id, item.shopify_line_item_id);
        }

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