-- Add price columns to products and order_items tables

-- Add price column to products table
ALTER TABLE products
ADD COLUMN price DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Product price from Shopify';

-- Add price column to order_items table to track price at time of order
ALTER TABLE order_items
ADD COLUMN price DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Price per unit at time of order';
