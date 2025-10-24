-- Migration: Template Assignment Rules
-- Description: Add support for automatic template assignment based on product attributes
-- Date: 2025-10-16

-- Create template assignment rules table
CREATE TABLE IF NOT EXISTS template_assignment_rules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  shop_id INT NOT NULL,
  template_id INT NOT NULL,
  rule_name VARCHAR(255) NOT NULL,
  rule_type ENUM('tag', 'collection', 'price_range', 'vendor') NOT NULL,
  rule_value TEXT NOT NULL,
  priority INT NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE CASCADE,

  INDEX idx_shop_active (shop_id, is_active),
  INDEX idx_priority (priority),
  INDEX idx_rule_type (rule_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add exclusion_tag to shops table
ALTER TABLE shops
ADD COLUMN template_rule_exclusion_tag VARCHAR(255) DEFAULT NULL COMMENT 'Products with this tag bypass all template assignment rules',
ADD COLUMN last_rule_application TIMESTAMP NULL COMMENT 'Timestamp of last automatic rule application';

-- Add index for faster product queries
ALTER TABLE products
ADD INDEX idx_shopify_product_id (shopify_product_id);