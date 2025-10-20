// server/src/routes/admin.js
import { sendLicenseEmail } from '../services/emailService.js';
import express from 'express';
import db from '../config/database.js';
import { shopify } from '../config/shopify.js';
import Papa from 'papaparse';
import { manualAllocate } from '../services/orderService.js';
import { 
  getShopTemplates, 
  setDefaultTemplate, 
  validateTemplate 
} from '../services/templateService.js';


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

// Fetch products from Shopify - UPDATED to include tags and price
router.get('/shops/:shopId/shopify-products', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { cursor } = req.query;

    const [shops] = await db.execute(
      'SELECT shop_domain, access_token FROM shops WHERE id = ?',
      [shopId]
    );

    if (shops.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const { shop_domain, access_token } = shops[0];

    // UPDATED: Added tags and priceRangeV2 to query
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
              tags
              priceRangeV2 {
                minVariantPrice {
                  amount
                }
              }
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

    const variables = {
      first: 250,
      after: cursor || null
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
      console.error('GraphQL errors:', result.errors);
      throw new Error('GraphQL query failed');
    }

    const productsData = result.data.products;
    const edges = productsData.edges;

    // UPDATED: Include tags and price in response
    const products = edges.map(edge => {
      const node = edge.node;
      return {
        id: node.legacyResourceId,
        title: node.title,
        handle: node.handle,
        status: node.status,
        vendor: node.vendor,
        tags: node.tags, // Array of tags
        price: parseFloat(node.priceRangeV2?.minVariantPrice?.amount || 0),
        image: node.images.edges[0]?.node?.url || null,
        variants: node.variants.edges.map(v => ({
          id: v.node.legacyResourceId,
          sku: v.node.sku
        }))
      };
    });

    console.log(`[Product Fetch] Returned ${products.length} products (cursor: ${cursor || 'initial'})`);

    res.json({ 
      products,
      hasMore: productsData.pageInfo.hasNextPage,
      nextCursor: productsData.pageInfo.endCursor,
      count: products.length
    });

  } catch (error) {
    console.error('Fetch Shopify products error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch products from Shopify',
      details: error.message 
    });
  }
});


// DIAGNOSTIC: Check shop authentication
router.get('/shops/:shopId/diagnose', async (req, res) => {
  try {
    const { shopId } = req.params;

    // Get shop from database
    const [shops] = await db.execute(
      'SELECT id, shop_domain, access_token, installed_at FROM shops WHERE id = ?',
      [shopId]
    );

    if (shops.length === 0) {
      return res.json({
        status: 'error',
        message: 'Shop not found in database',
        shopId
      });
    }

    const shop = shops[0];

    // Test Shopify API connection
    const testQuery = `
      query {
        shop {
          name
          email
        }
      }
    `;

    const response = await fetch(`https://${shop.shop_domain}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shop.access_token
      },
      body: JSON.stringify({ query: testQuery })
    });

    const responseData = await response.json();

    res.json({
      status: response.ok ? 'success' : 'error',
      httpStatus: response.status,
      shop: {
        id: shop.id,
        domain: shop.shop_domain,
        tokenPreview: shop.access_token?.substring(0, 20) + '...',
        installedAt: shop.installed_at
      },
      shopifyApiResponse: responseData,
      envCheck: {
        hasApiKey: !!process.env.SHOPIFY_API_KEY,
        hasApiSecret: !!process.env.SHOPIFY_API_SECRET,
        appUrl: process.env.APP_URL
      }
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack
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

    const [shops] = await db.execute(
      'SELECT shop_domain, access_token FROM shops WHERE id = ?',
      [shopId]
    );

    if (shops.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const { shop_domain, access_token } = shops[0];

    // UPDATED: Fetch tags, vendor, and price with GraphQL
    const query = `
      query getProductDetails($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on Product {
            id
            legacyResourceId
            title
            handle
            vendor
            tags
            priceRangeV2 {
              minVariantPrice {
                amount
              }
            }
          }
        }
      }
    `;

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
        // UPDATED: Save tags (as comma-separated string), vendor, and price
        const tagsString = Array.isArray(product.tags) ? product.tags.join(',') : '';
        const price = parseFloat(product.priceRangeV2?.minVariantPrice?.amount || 0);
        
        await db.execute(
          `INSERT INTO products 
           (shop_id, shopify_product_id, product_name, product_handle, tags, vendor, price)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
           product_name = VALUES(product_name),
           product_handle = VALUES(product_handle),
           tags = VALUES(tags),
           vendor = VALUES(vendor),
           price = VALUES(price)`,
          [
            shopId, 
            product.legacyResourceId, 
            product.title, 
            product.handle,
            tagsString,
            product.vendor || '',
            price
          ]
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
// TEMPLATE ENDPOINTS
// ==========================================

// Get all templates for a shop
router.get('/templates', async (req, res) => {
  try {
    const { shopId } = req.query;

    if (!shopId) {
      return res.status(400).json({ error: 'Shop ID required' });
    }

    const templates = await getShopTemplates(parseInt(shopId));
    res.json(templates);

  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get single template
router.get('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [templates] = await db.execute(
      'SELECT * FROM email_templates WHERE id = ?',
      [id]
    );

    if (templates.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(templates[0]);

  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Create new template
router.post('/templates', async (req, res) => {
  try {
    const {
      shopId,
      templateName,
      emailSubject,
      emailHtmlTemplate,
      emailTextTemplate,
      isDefault
    } = req.body;

    // Validate required fields
    if (!shopId || !templateName || !emailSubject || !emailHtmlTemplate || !emailTextTemplate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate HTML
    const validation = validateTemplate(emailHtmlTemplate);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Invalid template HTML', 
        details: validation.errors 
      });
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // If this should be default, unset other defaults
      if (isDefault) {
        await connection.execute(
          'UPDATE email_templates SET is_default = FALSE WHERE shop_id = ?',
          [shopId]
        );
      }

      const [result] = await connection.execute(
        `INSERT INTO email_templates 
         (shop_id, template_name, is_default, email_subject, email_html_template, email_text_template)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [shopId, templateName, isDefault || false, emailSubject, emailHtmlTemplate, emailTextTemplate]
      );

      await connection.commit();

      res.json({ 
        success: true, 
        templateId: result.insertId,
        validation 
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update template
router.put('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      templateName,
      emailSubject,
      emailHtmlTemplate,
      emailTextTemplate
    } = req.body;

    // Validate HTML
    const validation = validateTemplate(emailHtmlTemplate);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Invalid template HTML', 
        details: validation.errors 
      });
    }

    await db.execute(
      `UPDATE email_templates 
       SET template_name = ?, 
           email_subject = ?, 
           email_html_template = ?, 
           email_text_template = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [templateName, emailSubject, emailHtmlTemplate, emailTextTemplate, id]
    );

    res.json({ 
      success: true, 
      message: 'Template updated',
      validation 
    });

  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete template (with reassignment)
router.delete('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { reassignTemplateId } = req.body;

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Check if template is default
      const [template] = await connection.execute(
        'SELECT is_default, shop_id FROM email_templates WHERE id = ?',
        [id]
      );

      if (template.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Template not found' });
      }

      if (template[0].is_default) {
        await connection.rollback();
        return res.status(400).json({ 
          error: 'Cannot delete default template. Set another template as default first.' 
        });
      }

      // Reassign products to new template (or NULL for default)
      if (reassignTemplateId) {
        await connection.execute(
          'UPDATE products SET email_template_id = ? WHERE email_template_id = ?',
          [reassignTemplateId, id]
        );
      } else {
        await connection.execute(
          'UPDATE products SET email_template_id = NULL WHERE email_template_id = ?',
          [id]
        );
      }

      // Delete template
      await connection.execute('DELETE FROM email_templates WHERE id = ?', [id]);

      await connection.commit();

      res.json({ success: true, message: 'Template deleted' });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// Set template as default
router.post('/templates/:id/set-default', async (req, res) => {
  try {
    const { id } = req.params;

    // Get template's shop_id
    const [templates] = await db.execute(
      'SELECT shop_id FROM email_templates WHERE id = ?',
      [id]
    );

    if (templates.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await setDefaultTemplate(parseInt(id), templates[0].shop_id);

    res.json({ success: true, message: 'Template set as default' });

  } catch (error) {
    console.error('Error setting default template:', error);
    res.status(500).json({ error: 'Failed to set default template' });
  }
});

// Validate template (for preview/testing)
router.post('/templates/validate', async (req, res) => {
  try {
    const { emailHtmlTemplate } = req.body;

    if (!emailHtmlTemplate) {
      return res.status(400).json({ error: 'HTML template required' });
    }

    const validation = validateTemplate(emailHtmlTemplate);

    res.json(validation);

  } catch (error) {
    console.error('Error validating template:', error);
    res.status(500).json({ error: 'Failed to validate template' });
  }
});

// Assign template to product
router.put('/products/:productId/template', async (req, res) => {
  try {
    const { productId } = req.params;
    const { templateId } = req.body;

    // templateId can be null to use default
    await db.execute(
      'UPDATE products SET email_template_id = ? WHERE id = ?',
      [templateId || null, productId]
    );

    res.json({ success: true, message: 'Template assigned to product' });

  } catch (error) {
    console.error('Error assigning template:', error);
    res.status(500).json({ error: 'Failed to assign template' });
  }
});

// Bulk assign template to products
router.post('/products/bulk-assign-template', async (req, res) => {
  try {
    const { productIds, templateId } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'Product IDs required' });
    }

    const placeholders = productIds.map(() => '?').join(',');

    await db.execute(
      `UPDATE products SET email_template_id = ? WHERE id IN (${placeholders})`,
      [templateId || null, ...productIds]
    );

    res.json({ 
      success: true, 
      message: `Template assigned to ${productIds.length} products` 
    });

  } catch (error) {
    console.error('Error bulk assigning template:', error);
    res.status(500).json({ error: 'Failed to bulk assign template' });
  }
});

// Get products using a specific template
router.get('/templates/:id/products', async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await db.execute(
      `SELECT p.id, p.product_name, p.shopify_product_id
       FROM products p
       WHERE p.email_template_id = ?
       ORDER BY p.product_name ASC`,
      [id]
    );

    res.json(products);

  } catch (error) {
    console.error('Error fetching template products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
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

// Update order email address
router.put('/orders/:orderId/email', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address required' });
    }

    // Update the order email
    await db.execute(
      'UPDATE orders SET customer_email = ?, updated_at = NOW() WHERE id = ?',
      [email, orderId]
    );

    res.json({ success: true, message: 'Email updated successfully' });

  } catch (error) {
    console.error('Error updating order email:', error);
    res.status(500).json({ error: 'Failed to update email' });
  }
});

// Resend license email to customer
router.post('/orders/:orderId/resend', async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get order details
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

    const order = orders[0];

    // Get order items with licenses
    const [orderItems] = await db.execute(
      `SELECT oi.*, p.product_name, p.id as product_id
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ? AND oi.licenses_allocated > 0`,
      [orderId]
    );

    if (orderItems.length === 0) {
      return res.status(400).json({ 
        error: 'No licenses allocated for this order' 
      });
    }

    // Get all allocated licenses for this order
    for (const item of orderItems) {
      const [licenses] = await db.execute(
        `SELECT license_key FROM licenses 
         WHERE order_id = ? AND product_id = ?`,
        [orderId, item.product_id]
      );

      if (licenses.length > 0) {
        // Send email with allocated licenses
        await sendLicenseEmail({
          email: order.customer_email,
          firstName: order.customer_first_name || 'Customer',
          lastName: order.customer_last_name || '',
          orderNumber: order.order_number,
          productName: item.product_name,
          productId: item.product_id,
          licenses: licenses.map(l => l.license_key)
        });

        // Log the resend
        await db.execute(
          `INSERT INTO email_logs (order_id, order_item_id, customer_email, 
            licenses_sent, email_status)
           VALUES (?, ?, ?, ?, ?)`,
          [
            orderId, 
            item.id, 
            order.customer_email, 
            JSON.stringify(licenses.map(l => l.license_key)), 
            'resent'
          ]
        );
      }
    }

    res.json({ 
      success: true, 
      message: 'License email resent successfully' 
    });

  } catch (error) {
    console.error('Error resending email:', error);
    res.status(500).json({ error: 'Failed to resend email' });
  }
});

export default router;