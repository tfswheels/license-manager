-- Migration 008: Shopify App Subscriptions Table
-- Stores billing subscription information for each shop

CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shop_id INT NOT NULL,
  subscription_id VARCHAR(255) UNIQUE NOT NULL,
  plan_name VARCHAR(100) NOT NULL,
  plan_key VARCHAR(50) NOT NULL,
  status ENUM('ACTIVE', 'CANCELLED', 'DECLINED', 'EXPIRED', 'FROZEN', 'PENDING') DEFAULT 'PENDING',
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  interval_type VARCHAR(50) NULL,
  trial_days INT DEFAULT 0,
  current_period_end DATETIME NULL,
  is_test BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,

  INDEX idx_shop_id (shop_id),
  INDEX idx_subscription_id (subscription_id),
  INDEX idx_status (status),
  INDEX idx_plan_key (plan_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
