// server/src/routes/admin.js
import express from 'express';
import db from '../config/database.js';
import { shopify } from '../config/shopify.js';
import Papa from 'papaparse';
import { manualAllocate } from '../services/orderService.js';

const router = express.Router();

// Get all shops
router.get('/shops', async (req, res) => {
  try {
    const [shops] = await db.execute(
      'SELECT id, shop_domain, installed_at FROM shops ORDER BY installed_at DESC'
    );
    res.json(shops);
  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
});

// Sync products from Shopify
router.post('/shops/:shopId/sync-products', async (req, res) => {
  try {
    const { shopId } = req.params;

    // Get shop details
    const [shops] = await db.execute(
      'SELECT shop_domain, access_token FROM shops WHERE id = ?',
      [shopId]
    );

    if (shops.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const { shop_domain, access_token } = shops[0];

    // Fetch products from Shopify
    const client = new shopify.clients.Rest({ 
      session: { shop: shop_domain, accessToken: access_token } 
    });

    const response = await client.get({ path: 'products' });
    const products = response.body.products;

    // Insert or update products
    for (const product of products) {
      await db.execute(
        `INSERT INTO products (shop_id, shopify_product_id, product_name, product_handle)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         product_name = VALUES(product_name),
         product_handle = VALUES(product_handle)`,
        [shopId, product.id.toString(), product.title, product.handle]
      );
    }

    res.json({ 
      success: true, 
      synced: products.length,
      message: `Synced ${products.length} products` 
    });

  } catch (error) {
    console.error('Product sync error:', error);
    res.status(500).json({ error: 'Failed to sync products' });
  }
});

// Get all products
router.get('/products', async (req, res) => {
  try {
    const { shopId } = req.query;
    
    let query = `
      SELECT p.*, s.shop_domain,
        COUNT(l.id) as total_licenses,
        SUM(CASE WHEN l.allocated = FALSE THEN 1 ELSE 0 END) as available_licenses
      FROM products p
      JOIN shops s ON p.shop_id = s.id
      LEFT JOIN licenses l ON p.id = l.product_id
    `;
    
    const params = [];
    if (shopId) {
      query += ' WHERE p.shop_id = ?';
      params.push(shopId);
    }
    
    query += ' GROUP BY p.id ORDER BY p.product_name';

    const [products] = await db.execute(query, params);
    res.json(products);

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Upload licenses for a product
router.post('/products/:productId/licenses/upload', async (req, res) => {
  try {
    const { productId } = req.params;
    const { licenses } = req.body; // Array of license keys

    if (!Array.isArray(licenses) || licenses.length === 0) {
      return res.status(400).json({ error: 'No licenses provided' });
    }

    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Insert licenses
      const values = licenses.map(key => [productId, key]);
      await connection.query(
        'INSERT INTO licenses (product_id, license_key) VALUES ?',
        [values]
      );

      await connection.commit();

      res.json({ 
        success: true, 
        uploaded: licenses.length,
        message: `Uploaded ${licenses.length} licenses` 
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('License upload error:', error);
    res.status(500).json({ error: 'Failed to upload licenses' });
  }
});

// Parse CSV and return licenses
router.post('/licenses/parse-csv', async (req, res) => {
  try {
    const { csvContent } = req.body;

    const parsed = Papa.parse(csvContent, {
      header: false,
      skipEmptyLines: true
    });

    // Extract license keys (assume first column)
    const licenses = parsed.data
      .map(row => row[0])
      .filter(key => key && key.trim().length > 0);

    res.json({ licenses });

  } catch (error) {
    console.error('CSV parse error:', error);
    res.status(500).json({ error: 'Failed to parse CSV' });
  }
});

// Get licenses for a product
router.get('/products/:productId/licenses', async (req, res) => {
  try {
    const { productId } = req.params;
    const { allocated } = req.query;

    let query = 'SELECT * FROM licenses WHERE product_id = ?';
    const params = [productId];

    if (allocated !== undefined) {
      query += ' AND allocated = ?';
      params.push(allocated === 'true');
    }

    query += ' ORDER BY id DESC LIMIT 1000';

    const [licenses] = await db.execute(query, params);
    res.json(licenses);

  } catch (error) {
    console.error('Error fetching licenses:', error);
    res.status(500).json({ error: 'Failed to fetch licenses' });
  }
});

// Delete license
router.delete('/licenses/:licenseId', async (req, res) => {
  try {
    const { licenseId } = req.params;

    // Check if license is allocated
    const [licenses] = await db.execute(
      'SELECT allocated FROM licenses WHERE id = ?',
      [licenseId]
    );

    if (licenses.length === 0) {
      return res.status(404).json({ error: 'License not found' });
    }

    if (licenses[0].allocated) {
      return res.status(400).json({ 
        error: 'Cannot delete allocated license. Release it first.' 
      });
    }

    await db.execute('DELETE FROM licenses WHERE id = ?', [licenseId]);

    res.json({ success: true, message: 'License deleted' });

  } catch (error) {
    console.error('License delete error:', error);
    res.status(500).json({ error: 'Failed to delete license' });
  }
});

// Release license (make it available again)
router.post('/licenses/:licenseId/release', async (req, res) => {
  try {
    const { licenseId } = req.params;

    await db.execute(
      `UPDATE licenses 
       SET allocated = FALSE, order_id = NULL, allocated_at = NULL 
       WHERE id = ?`,
      [licenseId]
    );

    res.json({ success: true, message: 'License released' });

  } catch (error) {
    console.error('License release error:', error);
    res.status(500).json({ error: 'Failed to release license' });
  }
});

// Get orders
router.get('/orders', async (req, res) => {
  try {
    const { shopId, limit = 100 } = req.query;

    let query = `
      SELECT o.*, s.shop_domain,
        COUNT(DISTINCT oi.id) as item_count,
        SUM(oi.licenses_allocated) as total_licenses_allocated
      FROM orders o
      JOIN shops s ON o.shop_id = s.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `;

    const params = [];
    if (shopId) {
      query += ' WHERE o.shop_id = ?';
      params.push(shopId);
    }

    query += ` GROUP BY o.id ORDER BY o.created_at DESC LIMIT ${parseInt(limit)}`;

    const [orders] = await db.execute(query, params);
    res.json(orders);

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get order details
router.get('/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const [orders] = await db.execute(
      `SELECT o.*, s.shop_domain 
       FROM orders o 
       JOIN shops s ON o.shop_id = s.id 
       WHERE o.id = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const [orderItems] = await db.execute(
      `SELECT oi.*, p.product_name, p.shopify_product_id
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    // Get allocated licenses for each item
    for (const item of orderItems) {
      const [licenses] = await db.execute(
        `SELECT license_key FROM licenses WHERE order_id = ? AND product_id = ?`,
        [orderId, item.product_id]
      );
      item.allocated_licenses = licenses.map(l => l.license_key);
    }

    res.json({
      order: orders[0],
      items: orderItems
    });

  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

// Manually allocate licenses to an order
router.post('/orders/:orderId/allocate', async (req, res) => {
  try {
    const { orderId } = req.params;
    await manualAllocate(orderId);
    res.json({ success: true, message: 'Licenses allocated successfully' });
  } catch (error) {
    console.error('Manual allocation error:', error);
    res.status(500).json({ error: 'Failed to allocate licenses' });
  }
});

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const { shopId } = req.query;

    const shopFilter = shopId ? `WHERE shop_id = ${parseInt(shopId)}` : '';

    const [totalOrders] = await db.execute(
      `SELECT COUNT(*) as count FROM orders ${shopFilter}`
    );

    const [totalLicenses] = await db.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN allocated = FALSE THEN 1 ELSE 0 END) as available
       FROM licenses l
       JOIN products p ON l.product_id = p.id
       ${shopFilter.replace('shop_id', 'p.shop_id')}`
    );

    const [totalProducts] = await db.execute(
      `SELECT COUNT(*) as count FROM products ${shopFilter}`
    );

    res.json({
      totalOrders: totalOrders[0].count,
      totalLicenses: totalLicenses[0].total || 0,
      availableLicenses: totalLicenses[0].available || 0,
      totalProducts: totalProducts[0].count
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;