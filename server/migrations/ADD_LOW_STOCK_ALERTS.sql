-- Add low stock alert settings to shop_settings table

ALTER TABLE shop_settings
ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 10 COMMENT 'Minimum available licenses before alert is sent',
ADD COLUMN IF NOT EXISTS notify_on_low_stock BOOLEAN DEFAULT TRUE COMMENT 'Send alert when licenses fall below threshold';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts ON shop_settings(notify_on_low_stock);
