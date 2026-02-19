CREATE TABLE IF NOT EXISTS coin (
    id BIGINT NOT NULL AUTO_INCREMENT,
    coin_id INT NOT NULL,
    symbol VARCHAR(32) NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    coin_precision INT NOT NULL,
    icon_url VARCHAR(512),
    enabled BIT(1) NOT NULL DEFAULT b'1',
    create_time DATETIME(6),
    update_time DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_coin_coin_id (coin_id),
    INDEX idx_coin_symbol (symbol),
    INDEX idx_coin_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS blockchain_config (
    id BIGINT NOT NULL AUTO_INCREMENT,
    blockchain_id INT NOT NULL,
    chain_code VARCHAR(32) NOT NULL,
    chain_name VARCHAR(128) NOT NULL,
    enabled BIT(1) NOT NULL DEFAULT b'1',
    create_time DATETIME(6),
    update_time DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_blockchain_config_blockchain_id (blockchain_id),
    UNIQUE KEY uk_blockchain_config_chain_code (chain_code),
    INDEX idx_blockchain_config_blockchain_id (blockchain_id),
    INDEX idx_blockchain_config_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coin_chain_config (
    id BIGINT NOT NULL AUTO_INCREMENT,
    coin_id BIGINT NOT NULL,
    chain_code VARCHAR(32) NOT NULL,
    chain_name VARCHAR(128) NOT NULL,
    rpc_url VARCHAR(512) NOT NULL,
    collection_address VARCHAR(128) NOT NULL,
    withdraw_address VARCHAR(128) NOT NULL,
    min_withdraw_amount DECIMAL(38,18) NOT NULL,
    withdraw_precision INT NOT NULL,
    min_deposit_amount DECIMAL(38,18) NOT NULL,
    deposit_precision INT NOT NULL,
    extra_json VARCHAR(4000) NOT NULL DEFAULT '{}',
    enabled BIT(1) NOT NULL DEFAULT b'1',
    create_time DATETIME(6),
    update_time DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_coin_chain_config_coin_chain (coin_id, chain_code),
    INDEX idx_coin_chain_config_coin_id (coin_id),
    INDEX idx_coin_chain_config_chain_code (chain_code),
    INDEX idx_coin_chain_config_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO blockchain_config (blockchain_id, chain_code, chain_name, enabled, create_time, update_time)
VALUES
    (0, 'ETH', 'Ethereum', b'1', NOW(6), NOW(6)),
    (1, 'BSC', 'Binance Smart Chain', b'1', NOW(6), NOW(6)),
    (2, 'SOL', 'Solana', b'1', NOW(6), NOW(6));
