-- QA Demo Store – v1 → v2 migration
-- Run this ONLY if you already deployed the original schema and want to
-- preserve existing products / orders. If you can drop and re-create
-- everything, just run schema.sql + seed.sql instead.

SET NAMES utf8mb4;

-- 1) Add new columns to users
ALTER TABLE users
    ADD COLUMN email VARCHAR(160) NOT NULL DEFAULT '' AFTER username,
    ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT '' AFTER email,
    ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER locked;

-- 2) Backfill demo users with bcrypt("secret_sauce") and emails
UPDATE users SET
    email = CONCAT(username, '@demo.test'),
    password_hash = '$2b$10$QGBi/pmpBPJgEwTikn7O/.2JX1KdOhOWJuWbUdtDjM6qRFHsKPqs6'
WHERE password_hash = '' OR password_hash IS NULL;

-- 3) Drop the legacy plaintext column (only if it still exists)
ALTER TABLE users DROP COLUMN password;

-- 4) Add unique constraint on email
ALTER TABLE users ADD UNIQUE KEY uniq_email (email);

-- 5) Create auth_tokens table
CREATE TABLE IF NOT EXISTS auth_tokens (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED NOT NULL,
    token      CHAR(64)     NOT NULL,
    expires_at DATETIME     NOT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uniq_token (token),
    KEY idx_tokens_user (user_id),
    KEY idx_tokens_expires (expires_at),
    CONSTRAINT fk_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
