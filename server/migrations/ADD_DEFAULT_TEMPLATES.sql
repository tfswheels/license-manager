-- Add default email templates for existing shops that don't have one
-- Run this to fix "No default template found" errors

-- This will insert a default template for each shop that doesn't already have one

INSERT INTO email_templates (shop_id, template_name, email_subject, email_html_template, email_text_template, is_default)
SELECT
  s.id,
  'Default License Email',
  'Your License Key for {{product_name}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #4CAF50;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    .content {
      background-color: #f9f9f9;
      padding: 30px;
      border: 1px solid #ddd;
    }
    .license-key {
      background-color: #fff;
      border: 2px solid #4CAF50;
      padding: 15px;
      margin: 20px 0;
      font-family: ''Courier New'', monospace;
      font-size: 16px;
      font-weight: bold;
      text-align: center;
      border-radius: 5px;
    }
    .footer {
      background-color: #f1f1f1;
      padding: 15px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-radius: 0 0 5px 5px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Your License Key</h1>
  </div>
  <div class="content">
    <p>Hi {{customer_name}},</p>
    <p>Thank you for your purchase of <strong>{{product_name}}</strong>!</p>
    <p>Here is your license key:</p>
    <div class="license-key">
      {{license_key}}
    </div>
    <p><strong>Order Details:</strong></p>
    <ul>
      <li>Order Number: {{order_number}}</li>
      <li>Order Date: {{order_date}}</li>
    </ul>
    <p>If you have any questions, please reply to this email.</p>
    <p>Best regards,<br>{{shop_name}}</p>
  </div>
  <div class="footer">
    <p>This is an automated email. Please do not reply to this message.</p>
  </div>
</body>
</html>',
  'Hi {{customer_name}},

Thank you for your purchase of {{product_name}}!

Here is your license key:

{{license_key}}

Order Details:
- Order Number: {{order_number}}
- Order Date: {{order_date}}

If you have any questions, please reply to this email.

Best regards,
{{shop_name}}',
  TRUE
FROM shops s
LEFT JOIN email_templates t ON s.id = t.shop_id AND t.is_default = TRUE
WHERE t.id IS NULL;

-- Verify the templates were created
SELECT
  s.id AS shop_id,
  s.shop_domain,
  t.template_name,
  t.is_default,
  t.created_at
FROM shops s
LEFT JOIN email_templates t ON s.id = t.shop_id AND t.is_default = TRUE
ORDER BY s.id;
