-- Add default email templates for existing shops that don't have one
-- Run this to fix "No default template found" errors
-- Uses the clean, professional template design

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
      font-family: ''Courier New'', monospace;
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

    <p>Please save these license keys in a secure location. You''ll need them to activate your product.</p>

    <p>If you have any questions or need assistance, please don''t hesitate to contact us.</p>

    <p>Best regards,<br>{{shop_name}}</p>

    <div class="footer">
      <p>This email was sent because you placed an order with us.</p>
    </div>
  </div>
</body>
</html>',
  'Hi {{first_name}},

Thank you for your purchase!

Your order #{{order_number}} has been confirmed.

Product: {{product_name}}

Your License Keys:
{{license_keys}}

Please save these license keys in a secure location. You''ll need them to activate your product.

If you have any questions or need assistance, please don''t hesitate to contact us.

Best regards,
{{shop_name}}

---
This email was sent because you placed an order with us.',
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
