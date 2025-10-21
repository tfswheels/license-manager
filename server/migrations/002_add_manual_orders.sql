-- Add order_type column to orders table
ALTER TABLE orders 
ADD COLUMN order_type ENUM('shopify', 'manual') DEFAULT 'shopify' NOT NULL
AFTER order_status;

-- Add index for faster filtering by order type
ALTER TABLE orders
ADD INDEX idx_order_type (order_type);

-- Update delivery_status in email_logs for future delivery tracking
ALTER TABLE email_logs
ADD COLUMN delivery_status ENUM('pending', 'delivered', 'bounced', 'dropped', 'spam') DEFAULT 'pending'
AFTER email_status;

ALTER TABLE email_logs
ADD COLUMN delivery_updated_at TIMESTAMP NULL
AFTER delivery_status;

-- Add index for email log queries
ALTER TABLE email_logs
ADD INDEX idx_delivery_status (delivery_status);