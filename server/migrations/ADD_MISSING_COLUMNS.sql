-- Add missing columns to shops table
-- These were missing from RESET_DATABASE.sql
-- Note: If you get "Duplicate column" errors, that means the columns already exist (safe to ignore)

ALTER TABLE shops
ADD COLUMN template_rule_exclusion_tag VARCHAR(255) DEFAULT NULL COMMENT 'Products with this tag bypass all template assignment rules';

ALTER TABLE shops
ADD COLUMN last_rule_application TIMESTAMP NULL COMMENT 'Timestamp of last automatic rule application';
