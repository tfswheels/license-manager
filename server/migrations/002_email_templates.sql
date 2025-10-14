-- Email Templates Migration
-- Run this migration to add email template support

-- Create email_templates table
CREATE TABLE email_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shop_id INT NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    email_subject VARCHAR(500) NOT NULL,
    email_html_template TEXT NOT NULL,
    email_text_template TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    INDEX idx_shop_default (shop_id, is_default),
    INDEX idx_shop_id (shop_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add email_template_id to products table
ALTER TABLE products 
ADD COLUMN email_template_id INT NULL,
ADD FOREIGN KEY (email_template_id) REFERENCES email_templates(id) ON DELETE SET NULL,
ADD INDEX idx_template_id (email_template_id);