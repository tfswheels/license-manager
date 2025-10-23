import db from '../config/database.js';

/**
 * Fetch shop email from Shopify API
 */
async function fetchShopEmail(shopDomain, accessToken) {
  try {
    const query = `
      query {
        shop {
          email
        }
      }
    `;

    const response = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      console.error('Failed to fetch shop email:', response.status);
      return null;
    }

    const result = await response.json();
    return result.data?.shop?.email || null;
  } catch (error) {
    console.error('Error fetching shop email:', error);
    return null;
  }
}

/**
 * Get settings for a shop (creates default if not exists)
 * @param {number} shopId - Shop ID
 * @returns {Promise<Object>} Settings object
 */
async function getShopSettings(shopId) {
  const [rows] = await db.query(
    'SELECT * FROM shop_settings WHERE shop_id = ?',
    [shopId]
  );

  if (rows.length === 0) {
    // Get shop info to fetch email
    const [shops] = await db.query(
      'SELECT shop_domain, access_token FROM shops WHERE id = ?',
      [shopId]
    );

    let defaultReplyTo = null;
    if (shops.length > 0 && shops[0].access_token) {
      // Fetch shop email from Shopify to pre-populate reply_to_email
      const shopEmail = await fetchShopEmail(shops[0].shop_domain, shops[0].access_token);
      if (shopEmail) {
        defaultReplyTo = shopEmail;
        console.log(`📧 Pre-populated reply-to email for shop ${shopId}: ${shopEmail}`);
      }
    }

    // Create default settings with shop email as reply_to and default placeholder
    const defaultPlaceholder = 'Your license keys will be sent separately once available.';
    await db.query(
      'INSERT INTO shop_settings (shop_id, reply_to_email, out_of_stock_placeholder) VALUES (?, ?, ?)',
      [shopId, defaultReplyTo, defaultPlaceholder]
    );

    // Fetch the newly created settings
    const [newRows] = await db.query(
      'SELECT * FROM shop_settings WHERE shop_id = ?',
      [shopId]
    );
    return newRows[0];
  }

  // Apply default placeholder if null
  const settings = rows[0];
  if (!settings.out_of_stock_placeholder) {
    settings.out_of_stock_placeholder = 'Your license keys will be sent separately once available.';
  }

  return settings;
}

/**
 * Update settings for a shop
 * @param {number} shopId - Shop ID
 * @param {Object} settings - Settings to update
 * @returns {Promise<Object>} Updated settings object
 */
async function updateShopSettings(shopId, settings) {
  const allowedFields = [
    'license_delivery_method',
    'out_of_stock_behavior',
    'out_of_stock_placeholder',
    'custom_sender_email',
    'custom_sender_name',
    'reply_to_email',
    'enforce_unique_licenses',
    'enforce_unique_per_order',
    'notification_email',
    'notify_on_out_of_stock',
    'notify_on_uniqueness_issue'
  ];

  // Filter out any fields that aren't in the allowed list
  const updates = {};
  for (const field of allowedFields) {
    if (settings.hasOwnProperty(field)) {
      updates[field] = settings[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new Error('No valid fields to update');
  }

  // Build the SET clause dynamically
  const setClause = Object.keys(updates)
    .map(key => `${key} = ?`)
    .join(', ');

  const values = [...Object.values(updates), shopId];

  await db.query(
    `UPDATE shop_settings SET ${setClause} WHERE shop_id = ?`,
    values
  );

  // Return updated settings
  return await getShopSettings(shopId);
}

/**
 * Reset settings to defaults for a shop
 * @param {number} shopId - Shop ID
 * @returns {Promise<Object>} Reset settings object
 */
async function resetShopSettings(shopId) {
  await db.query('DELETE FROM shop_settings WHERE shop_id = ?', [shopId]);
  await db.query('INSERT INTO shop_settings (shop_id) VALUES (?)', [shopId]);
  return await getShopSettings(shopId);
}

/**
 * Validate email address format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
  if (!email) return true; // Allow null/empty
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate settings before update
 * @param {Object} settings - Settings to validate
 * @throws {Error} If validation fails
 */
function validateSettings(settings) {
  // Validate license_delivery_method
  if (settings.license_delivery_method &&
      !['FIFO', 'LIFO'].includes(settings.license_delivery_method)) {
    throw new Error('license_delivery_method must be either FIFO or LIFO');
  }

  // Validate out_of_stock_behavior
  if (settings.out_of_stock_behavior &&
      !['no_email', 'send_placeholder'].includes(settings.out_of_stock_behavior)) {
    throw new Error('out_of_stock_behavior must be either no_email or send_placeholder');
  }

  // Validate email addresses
  if (settings.custom_sender_email && !isValidEmail(settings.custom_sender_email)) {
    throw new Error('custom_sender_email must be a valid email address');
  }

  if (settings.reply_to_email && !isValidEmail(settings.reply_to_email)) {
    throw new Error('reply_to_email must be a valid email address');
  }

  if (settings.notification_email && !isValidEmail(settings.notification_email)) {
    throw new Error('notification_email must be a valid email address');
  }

  // Validate booleans
  const booleanFields = [
    'enforce_unique_licenses',
    'enforce_unique_per_order',
    'notify_on_out_of_stock',
    'notify_on_uniqueness_issue'
  ];

  for (const field of booleanFields) {
    if (settings.hasOwnProperty(field) && typeof settings[field] !== 'boolean') {
      throw new Error(`${field} must be a boolean value`);
    }
  }
}

export {
  getShopSettings,
  updateShopSettings,
  resetShopSettings,
  validateSettings,
  isValidEmail
};
