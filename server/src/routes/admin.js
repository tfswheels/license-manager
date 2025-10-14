// server/src/routes/admin.js
import express from 'express';
import db from '../config/database.js';
import { shopify } from '../config/shopify.js';
import Papa from 'papaparse';
import { manualAllocate } from '../services/orderService.js';

const router = express.Router();

// ==========================================
// SHOPS ENDPOINTS
// ==========================================

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

// Fetch ALL products from Shopify using GraphQL (fetches everything)
router.get('/shops/:shopId/shopify-products', async (req, res) => {
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

    // GraphQL query for fetching products with pagination
    const query = `
      query getProducts($first: Int!, $after: String) {
        products(first: $first, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              legacyResourceId
              title
              handle
              status
              vendor
              images(first: 1) {
                edges {
                  node {
                    url
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    legacyResourceId
                    sku
                  }
                }
              }
            }
          }
        }
      }
    `;

    let allProducts = [];
    let hasNextPage = true;
    let afterCursor = null;
    let pageCount = 0;

    // Fetch ALL pages
    while (hasNextPage) {
      pageCount++;
      
      const variables = {
        first: 250, // Maximum per page
        after: afterCursor
      };

      const response = await fetch(`https://${shop_domain}/admin/api/2024-01/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': access_token
        },
        body: JSON.stringify({ query, variables })
      });

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error('GraphQL query failed');
      }

      const productsData = result.data.products;
      const edges = productsData.edges;

      // Transform and add products
      for (const edge of edges) {
        const node = edge.node;
        allProducts.push({
          id: node.legacyResourceId,
          title: node.title,
          handle: node.handle,
          status: node.status,
          vendor: node.vendor,
          image: node.images.edges[0]?.node?.url || null,
          variants: node.variants.edges.map(v => ({
            id: v.node.legacyResourceId,
            sku: v.node.sku
          }))
        });
      }

      hasNextPage = productsData.pageInfo.hasNextPage;
      afterCursor = productsData.pageInfo.endCursor;

      console.log(`[Product Fetch] Page ${pageCount}, fetched ${edges.length} products, total: ${allProducts.length}`);

      // Safety limit
      if (allProducts.length > 20000) {
        console.warn('Product limit reached (20,000)');
        break;
      }
    }

    console.log(`[Product Fetch] Complete! Fetched ${allProducts.length} total products`);

    res.json({ 
      products: allProducts,
      total: allProducts.length
    });

  } catch (error) {
    console.error('Fetch Shopify products error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch products from Shopify',
      details: error.message 
    });
  }
});


// Add selected products to database
router.post('/shops/:shopId/add-products', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'No products selected' });
    }

    // Get shop details
    const [shops] = await db.execute(
      'SELECT shop_domain, access_token FROM shops WHERE id = ?',
      [shopId]
    );

    if (shops.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const { shop_domain, access_token } = shops[0];

    // Use GraphQL nodes query to fetch selected products
    const query = `
      query getProductDetails($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on Product {
            id
            legacyResourceId
            title
            handle
          }
        }
      }
    `;

    // Convert legacy IDs to global IDs
    const globalIds = productIds.map(id => `gid://shopify/Product/${id}`);

    const response = await fetch(`https://${shop_domain}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': access_token
      },
      body: JSON.stringify({ 
        query, 
        variables: { ids: globalIds } 
      })
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error('GraphQL query failed');
    }

    let addedCount = 0;

    for (const product of result.data.nodes) {
      if (!product) continue;

      try {
        await db.execute(
          `INSERT INTO products (shop_id, shopify_product_id, product_name, product_handle)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
           product_name = VALUES(product_name),
           product_handle = VALUES(product_handle)`,
          [shopId, product.legacyResourceId, product.title, product.handle]
        );

        addedCount++;
      } catch (error) {
        console.error(`Failed to add product ${product.legacyResourceId}:`, error);
      }
    }

    res.json({ 
      success: true, 
      added: addedCount,
      message: `Added ${addedCount} products successfully` 
    });

  } catch (error) {
    console.error('Add products error:', error);
    res.status(500).json({ error: 'Failed to add products' });
  }
});

// Sync products from Shopify (legacy endpoint - kept for backwards compatibility)
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

// ==========================================
// PRODUCTS ENDPOINTS
// ==========================================

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
    
    query += ' GROUP BY p.id ORDER BY p.created_at DESC';

    const [products] = await db.execute(query, params);
    res.json(products);

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Delete product from app (cascades to licenses)
router.delete('/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if product exists and count licenses
    const [products] = await db.execute(
      `SELECT p.*, COUNT(l.id) as license_count
       FROM products p
       LEFT JOIN licenses l ON p.id = l.product_id
       WHERE p.id = ?
       GROUP BY p.id`,
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const licenseCount = products[0].license_count;

    // Delete all licenses for this product
    await db.execute('DELETE FROM licenses WHERE product_id = ?', [productId]);

    // Delete the product
    await db.execute('DELETE FROM products WHERE id = ?', [productId]);

    res.json({ 
      success: true, 
      message: 'Product deleted',
      licensesDeleted: licenseCount
    });

  } catch (error) {
    console.error('Product delete error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ==========================================
// LICENSES ENDPOINTS
// ==========================================

// Parse CSV file
router.post('/licenses/parse-csv', async (req, res) => {
  try {
    const { csvContent } = req.body;

    if (!csvContent) {
      return res.status(400).json({ error: 'No CSV content provided' });
    }

    const parsed = Papa.parse(csvContent, {
      header: false,
      skipEmptyLines: true
    });

    // Extract first column (license keys)
    const licenses = parsed.data
      .map(row => row[0])
      .filter(key => key && key.trim().length > 0)
      .map(key => key.trim());

    res.json({ 
      licenses,
      count: licenses.length 
    });

  } catch (error) {
    console.error('CSV parse error:', error);
    res.status(500).json({ error: 'Failed to parse CSV' });
  }
});

// Upload licenses for a product
router.post('/products/:productId/licenses/upload', async (req, res) => {
  try {
    const { productId } = req.params;
    const { licenses } = req.body;

    if (!licenses || !Array.isArray(licenses) || licenses.length === 0) {
      return res.status(400).json({ error: 'No licenses provided' });
    }

    // Insert licenses
    const values = licenses.map(key => [productId, key]);
    const placeholders = values.map(() => '(?, ?)').join(', ');

    await db.execute(
      `INSERT INTO licenses (product_id, license_key) VALUES ${placeholders}`,
      values.flat()
    );

    res.json({ 
      success: true, 
      uploaded: licenses.length,
      message: `Uploaded ${licenses.length} licenses` 
    });

  } catch (error) {
    console.error('License upload error:', error);
    res.status(500).json({ error: 'Failed to upload licenses' });
  }
});

// Get licenses for a product
router.get('/products/:productId/licenses', async (req, res) => {
  try {
    const { productId } = req.params;
    const { allocated } = req.query;

    let query = 'SELECT * FROM licenses WHERE product_id = ?';
    const params = [productId];

    if (allocated !== null && allocated !== undefined) {
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

// ==========================================
// ORDERS ENDPOINTS
// ==========================================

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

// ==========================================
// STATS ENDPOINTS
// ==========================================

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