-- Migration: Shop Settings Table
-- Description: Adds comprehensive settings management for each shop

CREATE TABLE IF NOT EXISTS shop_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shop_id INT NOT NULL UNIQUE,

  -- License Delivery Method
  license_delivery_method ENUM('FIFO', 'LIFO') DEFAULT 'FIFO' COMMENT 'First In First Out or Last In First Out',

  -- Out of Stock Behavior
  out_of_stock_behavior ENUM('no_email', 'send_placeholder') DEFAULT 'no_email' COMMENT 'What to do when no licenses available',
  out_of_stock_placeholder VARCHAR(500) DEFAULT 'Please contact us for your license key' COMMENT 'Placeholder text when sending email with no licenses',

  -- Email Settings
  custom_sender_email VARCHAR(255) DEFAULT NULL COMMENT 'Custom sender email address for license emails',
  custom_sender_name VARCHAR(255) DEFAULT NULL COMMENT 'Custom sender name for license emails',

  -- License Uniqueness Settings
  enforce_unique_licenses BOOLEAN DEFAULT TRUE COMMENT 'Enforce all licenses are unique for a product',
  enforce_unique_per_order BOOLEAN DEFAULT TRUE COMMENT 'Enforce same order does not receive duplicate licenses',

  -- Notification Settings
  notification_email VARCHAR(255) DEFAULT NULL COMMENT 'Email to receive notifications about license allocation issues',
  notify_on_out_of_stock BOOLEAN DEFAULT TRUE COMMENT 'Send notification when order cannot get licenses (out of stock)',
  notify_on_uniqueness_issue BOOLEAN DEFAULT TRUE COMMENT 'Send notification when uniqueness constraint prevents full allocation',

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,

  INDEX idx_shop_id (shop_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create default settings for existing shops
INSERT INTO shop_settings (shop_id)
SELECT id FROM shops
WHERE id NOT IN (SELECT shop_id FROM shop_settings);
