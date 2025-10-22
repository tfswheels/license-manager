-- Migration: Add reply_to_email to shop_settings
-- Description: Support reply-to addresses for SaaS email delivery

ALTER TABLE shop_settings
ADD COLUMN reply_to_email VARCHAR(255) DEFAULT NULL COMMENT 'Email address for customer replies' AFTER custom_sender_name;
