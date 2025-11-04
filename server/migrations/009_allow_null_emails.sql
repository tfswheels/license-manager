-- Migration: Allow NULL values for customer_email fields
-- This fixes webhook orders that don't have customer email addresses

-- Allow NULL in orders.customer_email
ALTER TABLE orders
MODIFY COLUMN customer_email VARCHAR(255) NULL;

-- Allow NULL in email_logs.customer_email
ALTER TABLE email_logs
MODIFY COLUMN customer_email VARCHAR(255) NULL;
