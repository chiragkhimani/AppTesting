-- QA Demo Store – v5 migration
-- Persists subtotal, shipping, and tax on orders (total = grand total).
-- Safe to re-run.

SET NAMES utf8mb4;

SET @has_subtotal := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'orders'
      AND COLUMN_NAME = 'subtotal'
);

SET @sql := IF(
    @has_subtotal = 0,
    "ALTER TABLE orders
        ADD COLUMN subtotal DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER phone,
        ADD COLUMN shipping DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER subtotal,
        ADD COLUMN tax DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER shipping",
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Legacy rows: previous `total` was item subtotal only (no tax/shipping charged).
UPDATE orders
SET subtotal = total,
    shipping = 0,
    tax = 0
WHERE subtotal = 0 AND shipping = 0 AND tax = 0 AND total > 0;
