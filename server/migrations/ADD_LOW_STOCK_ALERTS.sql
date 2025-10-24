-- Add low stock alert settings to shop_settings table

ALTER TABLE shop_settings
ADD COLUMN low_stock_threshold INT DEFAULT 10 COMMENT 'Minimum available licenses before alert is sent',
ADD COLUMN notify_on_low_stock BOOLEAN DEFAULT TRUE COMMENT 'Send alert when licenses fall below threshold';
