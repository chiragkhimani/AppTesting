-- QA Demo Store – v2 → v3 migration
-- Run this ONLY if you previously deployed v2 and want to preserve existing
-- products / users. If you can drop & recreate, run schema.sql + seed.sql.
--
-- v3 changes the `orders` table:
--   * first_name / last_name -> full_name
--   * zipcode -> pincode
--   * adds: state, phone

SET NAMES utf8mb4;

-- 1) Add new columns
ALTER TABLE orders
    ADD COLUMN full_name VARCHAR(120) NOT NULL DEFAULT '' AFTER user_id,
    ADD COLUMN state     VARCHAR(80)  NOT NULL DEFAULT '' AFTER city,
    ADD COLUMN pincode   VARCHAR(20)  NOT NULL DEFAULT '' AFTER state,
    ADD COLUMN phone     VARCHAR(30)  NOT NULL DEFAULT '' AFTER pincode;

-- 2) Backfill from old columns (if they still exist)
UPDATE orders SET
    full_name = TRIM(CONCAT(COALESCE(first_name,''), ' ', COALESCE(last_name,''))),
    pincode   = COALESCE(zipcode, '')
WHERE full_name = '' OR pincode = '';

-- 3) Drop legacy columns
ALTER TABLE orders
    DROP COLUMN first_name,
    DROP COLUMN last_name,
    DROP COLUMN zipcode;

-- 4) Tighten NOT NULL with sane defaults for any future rows
ALTER TABLE orders
    MODIFY full_name VARCHAR(120) NOT NULL,
    MODIFY state     VARCHAR(80)  NOT NULL,
    MODIFY pincode   VARCHAR(20)  NOT NULL,
    MODIFY phone     VARCHAR(30)  NOT NULL;
