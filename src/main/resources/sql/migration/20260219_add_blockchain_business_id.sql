-- Add blockchain business ID (blockchain_id) into blockchain_config.

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
