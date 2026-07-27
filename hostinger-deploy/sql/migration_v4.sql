-- QA Demo Store – v4 migration
-- Adds order status for cancel-order support.
-- Safe to re-run: skips adding the column if it already exists.

SET NAMES utf8mb4;

-- Add status column (pending | cancelled) if missing
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'orders'
      AND COLUMN_NAME = 'status'
);

SET @sql := IF(
    @col_exists = 0,
    "ALTER TABLE orders ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending' AFTER total",
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE orders SET status = 'pending' WHERE status IS NULL OR status = '';
