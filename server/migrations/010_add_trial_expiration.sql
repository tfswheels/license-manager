-- Migration: Add trial expiration tracking to shops table
-- This allows us to track when the 7-day free trial expires instead of counting orders

ALTER TABLE shops
ADD COLUMN trial_expires_at TIMESTAMP NULL COMMENT 'Date when the free trial expires',
ADD INDEX idx_trial_expires (trial_expires_at);

-- Set trial expiration for existing shops (7 days from installation)
UPDATE shops
SET trial_expires_at = DATE_ADD(installed_at, INTERVAL 7 DAY)
WHERE trial_expires_at IS NULL;
