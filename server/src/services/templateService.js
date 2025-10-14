// server/src/services/templateService.js
import db from '../config/database.js';

// Default template HTML
const DEFAULT_HTML_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      max-width: 600px; 
      margin: 0 auto; 
    }
    .container { padding: 30px 20px; }
    .header { 
      text-align: center; 
      padding-bottom: 20px; 
      border-bottom: 2px solid #4CAF50; 
      margin-bottom: 30px; 
    }
    .license-box { 
      background: #f5f5f5; 
      padding: 20px; 
      margin: 25px 0; 
      border-radius: 8px; 
      border-left: 4px solid #4CAF50; 
    }
    .license-key { 
      font-family: 'Courier New', monospace; 
      font-size: 15px; 
      margin: 8px 0; 
      padding: 10px;
      background: white;
      border-radius: 4px;
      word-break: break-all;
    }
    .footer { 
      margin-top: 40px; 
      padding-top: 20px; 
      border-top: 1px solid #ddd; 
      text-align: center; 
      font-size: 12px; 
      color: #666; 
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Thank You for Your Purchase!</h2>
    </div>
    
    <p>Hi {{first_name}},</p>
    
    <p>Your order <strong>#{{order_number}}</strong> has been confirmed.</p>
    
    <p><strong>Product:</strong> {{product_name}}</p>
    
    <div class="license-box">
      <strong>Your License Keys:</strong>
      {{license_keys}}
    </div>
    
    <p>Please save these license keys in a secure location. You'll need them to activate your product.</p>
    
    <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
    
    <p>Best regards,<br>The Team</p>
    
    <div class="footer">
      <p>This email was sent because you placed an order with us.</p>
    </div>
  </div>
</body>
</html>`;

// Default template text
const DEFAULT_TEXT_TEMPLATE = `Hi {{first_name}},

Thank you for your purchase! Your order #{{order_number}} has been confirmed.

Product: {{product_name}}

Your License Keys:
{{license_keys}}

Please save these license keys in a secure location. You'll need them to activate your product.

If you have any questions or need assistance, please don't hesitate to contact us.

Best regards,
The Team`;

// Create default template for a shop
export async function createDefaultTemplate(shopId) {
  try {
    const [result] = await db.execute(
      `INSERT INTO email_templates 
       (shop_id, template_name, is_default, email_subject, email_html_template, email_text_template)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        shopId,
        'Standard License Email',
        true,
        'Your License Keys - Order #{{order_number}}',
        DEFAULT_HTML_TEMPLATE,
        DEFAULT_TEXT_TEMPLATE
      ]
    );

    console.log(`✅ Created default email template for shop ${shopId}`);
    return result.insertId;
  } catch (error) {
    console.error('Error creating default template:', error);
    throw error;
  }
}

// Get template for a product (or default)
export async function getTemplateForProduct(productId) {
  try {
    // Try to get product's assigned template
    const [products] = await db.execute(
      `SELECT p.email_template_id, p.shop_id 
       FROM products p 
       WHERE p.id = ?`,
      [productId]
    );

    if (products.length === 0) {
      throw new Error(`Product ${productId} not found`);
    }

    const { email_template_id, shop_id } = products[0];

    // If product has assigned template, use it
    if (email_template_id) {
      const [templates] = await db.execute(
        'SELECT * FROM email_templates WHERE id = ?',
        [email_template_id]
      );
      
      if (templates.length > 0) {
        return templates[0];
      }
    }

    // Otherwise, get default template for shop
    const [defaultTemplates] = await db.execute(
      'SELECT * FROM email_templates WHERE shop_id = ? AND is_default = TRUE',
      [shop_id]
    );

    if (defaultTemplates.length === 0) {
      throw new Error(`No default template found for shop ${shop_id}`);
    }

    return defaultTemplates[0];
  } catch (error) {
    console.error('Error getting template for product:', error);
    throw error;
  }
}

// Render template with variables
export function renderTemplate(template, variables) {
  let rendered = template;

  // Replace all variables
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    rendered = rendered.replace(regex, value || '');
  }

  return rendered;
}

// Format license keys for email
export function formatLicenseKeys(licenses, isHtml = true) {
  if (isHtml) {
    return licenses.map((key, index) => 
      `<div class="license-key">${index + 1}. ${key}</div>`
    ).join('');
  } else {
    return licenses.map((key, index) => 
      `${index + 1}. ${key}`
    ).join('\n');
  }
}

// Validate template HTML
export function validateTemplate(html) {
  const errors = [];
  const warnings = [];

  // Check for basic HTML structure
  if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
    warnings.push('Template should include <!DOCTYPE html> and <html> tags');
  }

  // Check for required variable
  if (!html.includes('{{license_keys}}')) {
    warnings.push('Template does not include {{license_keys}} variable - customers will not receive their keys!');
  }

  // Check for dangerous scripts
  if (html.includes('<script')) {
    errors.push('Script tags are not allowed in email templates');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// Get all templates for a shop
export async function getShopTemplates(shopId) {
  try {
    const [templates] = await db.execute(
      `SELECT t.*, 
        (SELECT COUNT(*) FROM products WHERE email_template_id = t.id) as product_count
       FROM email_templates t 
       WHERE t.shop_id = ?
       ORDER BY t.is_default DESC, t.template_name ASC`,
      [shopId]
    );

    return templates;
  } catch (error) {
    console.error('Error getting shop templates:', error);
    throw error;
  }
}

// Set template as default
export async function setDefaultTemplate(templateId, shopId) {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Remove default flag from all templates for this shop
    await connection.execute(
      'UPDATE email_templates SET is_default = FALSE WHERE shop_id = ?',
      [shopId]
    );

    // Set new default
    await connection.execute(
      'UPDATE email_templates SET is_default = TRUE WHERE id = ? AND shop_id = ?',
      [templateId, shopId]
    );

    await connection.commit();
    console.log(`✅ Template ${templateId} set as default for shop ${shopId}`);
  } catch (error) {
    await connection.rollback();
    console.error('Error setting default template:', error);
    throw error;
  } finally {
    connection.release();
  }
}