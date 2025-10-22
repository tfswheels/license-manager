-- Migration 007: GDPR Compliance Requests Table
-- This table stores audit logs for all GDPR-related webhook requests

CREATE TABLE IF NOT EXISTS gdpr_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shop_domain VARCHAR(255) NOT NULL,
  request_type ENUM('data_request', 'customer_redact', 'shop_redact') NOT NULL,
  customer_id BIGINT NULL,
  customer_email VARCHAR(255) NULL,
  request_data JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_shop_domain (shop_domain),
  INDEX idx_customer_id (customer_id),
  INDEX idx_customer_email (customer_email),
  INDEX idx_request_type (request_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
