-- ============================================
-- COMPLETE DATABASE RESET FOR DIGIKEY HQ
-- This script drops all tables and recreates them
-- Run this for a fresh start
-- ============================================

-- Drop all tables in correct order (respecting foreign keys)
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS gdpr_requests;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS inventory_alerts;
DROP TABLE IF EXISTS email_logs;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS licenses;
DROP TABLE IF EXISTS template_assignment_rules;
DROP TABLE IF EXISTS shop_settings;
DROP TABLE IF EXISTS email_templates;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS shops;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- TABLE 1: shops
-- ============================================
CREATE TABLE shops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shop_domain VARCHAR(255) NOT NULL UNIQUE,
  access_token VARCHAR(255) NOT NULL,
  scopes TEXT,
  installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  template_rule_exclusion_tag VARCHAR(255) DEFAULT NULL COMMENT 'Products with this tag bypass all template assignment rules',
  last_rule_application TIMESTAMP NULL COMMENT 'Timestamp of last automatic rule application',
  INDEX idx_shop_domain (shop_domain)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE 2: products
-- ============================================
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shop_id INT NOT NULL,
  shopify_product_id VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_handle VARCHAR(255),
  tags TEXT COMMENT 'Comma-separated product tags from Shopify',
  vendor VARCHAR(255) COMMENT 'Product vendor/manufacturer',
  price DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Product price',
  email_template_id INT DEFAULT NULL COMMENT 'Specific template for this product, NULL = use default',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  UNIQUE KEY unique_product_per_shop (shop_id, shopify_product_id),
  INDEX idx_shop_product (shop_id, shopify_product_id),
  INDEX idx_tags (tags(255)),
  INDEX idx_vendor (vendor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE 3: email_templates
-- ============================================
CREATE TABLE email_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shop_id INT NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  email_subject TEXT NOT NULL,
  email_html_template TEXT NOT NULL,
  email_text_template TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  INDEX idx_shop_default (shop_id, is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key to products table
ALTER TABLE products
ADD CONSTRAINT fk_email_template
FOREIGN KEY (email_template_id) REFERENCES email_templates(id) ON DELETE SET NULL;

-- ============================================
-- TABLE 4: licenses
-- ============================================
CREATE TABLE licenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  license_key TEXT NOT NULL,
  allocated BOOLEAN DEFAULT FALSE,
  order_id INT DEFAULT NULL,
  allocated_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_allocated (product_id, allocated),
  INDEX idx_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE 5: orders
-- ============================================
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shop_id INT NOT NULL,
  shopify_order_id VARCHAR(255) NOT NULL,
  order_number VARCHAR(255),
  customer_email VARCHAR(255) NOT NULL,
  customer_first_name VARCHAR(255),
  customer_last_name VARCHAR(255),
  order_status VARCHAR(50),
  order_type VARCHAR(50) DEFAULT 'shopify' COMMENT 'shopify or manual',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  UNIQUE KEY unique_shopify_order (shop_id, shopify_order_id),
  INDEX idx_shop_order (shop_id, shopify_order_id),
  INDEX idx_customer_email (customer_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE 6: order_items
-- ============================================
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  shopify_line_item_id VARCHAR(255),
  quantity INT NOT NULL,
  price DECIMAL(10, 2) DEFAULT 0.00,
  licenses_allocated INT DEFAULT 0,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_order (order_id),
  INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE 7: email_logs
-- ============================================
CREATE TABLE email_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  order_item_id INT,
  customer_email VARCHAR(255) NOT NULL,
  licenses_sent TEXT,
  email_status VARCHAR(50),
  delivery_status VARCHAR(50) DEFAULT 'pending',
  delivery_updated_at TIMESTAMP NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE SET NULL,
  INDEX idx_order (order_id),
  INDEX idx_customer_email (customer_email),
  INDEX idx_delivery_status (delivery_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE 8: inventory_alerts
-- ============================================
CREATE TABLE inventory_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  alert_threshold INT DEFAULT 10,
  last_alert_sent TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE 9: template_assignment_rules
-- ============================================
CREATE TABLE template_assignment_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shop_id INT NOT NULL,
  template_id INT NOT NULL,
  rule_name VARCHAR(255) NOT NULL,
  rule_type ENUM('tag', 'vendor', 'price', 'collection') NOT NULL,
  rule_value TEXT NOT NULL COMMENT 'Tag name, vendor name, price range (min-max), or collection ID',
  priority INT DEFAULT 0 COMMENT 'Higher priority rules apply first',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE CASCADE,
  INDEX idx_shop_active (shop_id, is_active),
  INDEX idx_rule_type (rule_type),
  INDEX idx_priority (priority DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE 10: shop_settings
-- ============================================
CREATE TABLE shop_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shop_id INT NOT NULL UNIQUE,

  -- License Delivery Settings
  license_delivery_method ENUM('FIFO', 'LIFO') DEFAULT 'FIFO',
  enforce_unique_licenses BOOLEAN DEFAULT FALSE COMMENT 'Prevent duplicate licenses across all orders',
  enforce_unique_per_order BOOLEAN DEFAULT FALSE COMMENT 'Prevent duplicate licenses within same order',

  -- Out of Stock Settings
  out_of_stock_behavior ENUM('no_email', 'send_placeholder') DEFAULT 'no_email',
  out_of_stock_placeholder TEXT COMMENT 'Default: Your license keys will be sent separately once available.',

  -- Email Settings (SaaS Multi-tenant)
  custom_sender_email VARCHAR(255) DEFAULT NULL COMMENT 'Custom from email (requires domain verification)',
  custom_sender_name VARCHAR(255) DEFAULT NULL COMMENT 'Custom from name',
  reply_to_email VARCHAR(255) DEFAULT NULL COMMENT 'Reply-to email address (auto-populated with shop email)',

  -- Notification Settings
  notification_email VARCHAR(255) DEFAULT NULL COMMENT 'Admin email for notifications',
  notify_on_out_of_stock BOOLEAN DEFAULT FALSE,
  notify_on_uniqueness_issue BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE 11: subscriptions (Shopify Billing)
-- ============================================
CREATE TABLE subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shop_id INT NOT NULL,
  shopify_subscription_id VARCHAR(255) UNIQUE,
  plan ENUM('FREE', 'BASIC', 'PRO', 'ENTERPRISE') NOT NULL DEFAULT 'FREE',
  status ENUM('active', 'cancelled', 'expired', 'trial') NOT NULL DEFAULT 'trial',
  price DECIMAL(10, 2) DEFAULT 0.00,
  trial_days INT DEFAULT 0,
  current_period_start TIMESTAMP NULL,
  current_period_end TIMESTAMP NULL,
  cancelled_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  INDEX idx_shop_status (shop_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE 12: gdpr_requests (GDPR Compliance)
-- ============================================
CREATE TABLE gdpr_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shop_domain VARCHAR(255) NOT NULL,
  request_type ENUM('data_request', 'customer_redact', 'shop_redact') NOT NULL,
  customer_id VARCHAR(255),
  customer_email VARCHAR(255),
  request_data JSON COMMENT 'Full webhook payload',
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_shop (shop_domain),
  INDEX idx_request_type (request_type),
  INDEX idx_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'Database reset complete! All tables created successfully.' AS status;
SELECT 'Run this to verify all tables exist:' AS next_step;
SELECT 'SHOW TABLES;' AS command;
