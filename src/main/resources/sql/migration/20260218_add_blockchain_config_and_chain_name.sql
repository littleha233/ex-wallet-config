-- Add blockchain_config table, add blockchain business ID, and add chain_name into coin_chain_config.

CREATE TABLE IF NOT EXISTS blockchain_config (
    id BIGINT NOT NULL AUTO_INCREMENT,
    blockchain_id INT NULL,
    chain_code VARCHAR(32) NOT NULL,
    chain_name VARCHAR(128) NOT NULL,
    enabled BIT(1) NOT NULL DEFAULT b'1',
    create_time DATETIME(6),
    update_time DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_blockchain_config_chain_code (chain_code),
    INDEX idx_blockchain_config_blockchain_id (blockchain_id),
    INDEX idx_blockchain_config_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @add_blockchain_id_column = (
    SELECT IF(
        EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'blockchain_config'
              AND column_name = 'blockchain_id'
        ),
        'SELECT 1',
        'ALTER TABLE blockchain_config ADD COLUMN blockchain_id INT NULL AFTER id'
    )
);
PREPARE stmt FROM @add_blockchain_id_column;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE blockchain_config
SET blockchain_id = CASE UPPER(chain_code)
    WHEN 'ETH' THEN 0
    WHEN 'BSC' THEN 1
    WHEN 'SOL' THEN 2
    ELSE blockchain_id
END
WHERE blockchain_id IS NULL;

UPDATE blockchain_config
SET blockchain_id = id + 100000
WHERE blockchain_id IS NULL;

ALTER TABLE blockchain_config
    MODIFY COLUMN blockchain_id INT NOT NULL;

SET @add_blockchain_id_uk = (
    SELECT IF(
        EXISTS (
            SELECT 1
            FROM information_schema.statistics
            WHERE table_schema = DATABASE()
              AND table_name = 'blockchain_config'
              AND index_name = 'uk_blockchain_config_blockchain_id'
        ),
        'SELECT 1',
        'ALTER TABLE blockchain_config ADD UNIQUE KEY uk_blockchain_config_blockchain_id (blockchain_id)'
    )
);
PREPARE stmt FROM @add_blockchain_id_uk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_chain_name = (
    SELECT IF(
        EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'coin_chain_config'
              AND column_name = 'chain_name'
        ),
        'SELECT 1',
        'ALTER TABLE coin_chain_config ADD COLUMN chain_name VARCHAR(128) NULL AFTER chain_code'
    )
);
PREPARE stmt FROM @add_chain_name;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE coin_chain_config
SET chain_name = chain_code
WHERE chain_name IS NULL OR TRIM(chain_name) = '';

ALTER TABLE coin_chain_config
    MODIFY COLUMN chain_name VARCHAR(128) NOT NULL;

INSERT IGNORE INTO blockchain_config (blockchain_id, chain_code, chain_name, enabled, create_time, update_time)
VALUES
    (0, 'ETH', 'Ethereum', b'1', NOW(6), NOW(6)),
    (1, 'BSC', 'Binance Smart Chain', b'1', NOW(6), NOW(6)),
    (2, 'SOL', 'Solana', b'1', NOW(6), NOW(6));

UPDATE coin_chain_config c
JOIN blockchain_config b
  ON UPPER(c.chain_code) = UPPER(b.chain_code)
SET c.chain_name = b.chain_name
WHERE c.chain_name IS NULL
   OR TRIM(c.chain_name) = ''
   OR UPPER(c.chain_name) = UPPER(c.chain_code);
