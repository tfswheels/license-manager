-- Fix inventory_alerts table schema to match code expectations
-- The RESET_DATABASE.sql had an outdated schema

-- Drop the old table structure
DROP TABLE IF EXISTS inventory_alerts;

-- Recreate with correct schema matching 001_initial_schema.sql
CREATE TABLE inventory_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    available_count INT NOT NULL,
    threshold INT NOT NULL,
    alert_sent BOOLEAN DEFAULT FALSE,
    alert_sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_alert (product_id, alert_sent)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
