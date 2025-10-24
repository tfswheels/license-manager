-- Update existing default email templates to the new clean design
-- This REPLACES all existing default templates with the new design

UPDATE email_templates
SET
  template_name = 'Default License Email',
  email_subject = 'Your License Key for {{product_name}}',
  email_html_template = '<!DOCTYPE html>
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
  email_text_template = 'Hi {{first_name}},

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
This email was sent because you placed an order with us.'
WHERE is_default = TRUE;

-- Verify the update
SELECT
  id,
  shop_id,
  template_name,
  is_default,
  LEFT(email_subject, 50) AS subject_preview,
  updated_at
FROM email_templates
WHERE is_default = TRUE
ORDER BY shop_id;
