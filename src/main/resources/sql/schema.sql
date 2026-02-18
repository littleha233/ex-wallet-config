-- Unified DDL for all tables used in this project.
-- Execute manually when needed:
--   mysql -h localhost -P 3306 -uroot -p'YOUR_PASSWORD' springdemo < src/main/resources/sql/schema.sql

CREATE TABLE IF NOT EXISTS note (
    id BIGINT NOT NULL AUTO_INCREMENT,
    title VARCHAR(255),
    content VARCHAR(255),
    created_at DATETIME(6),
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS eth_wallet (
    id BIGINT NOT NULL AUTO_INCREMENT,
    uid BIGINT,
    address VARCHAR(42) NOT NULL,
    private_key VARCHAR(66) NOT NULL,
    public_key VARCHAR(132) NOT NULL,
    create_time DATETIME(6),
    PRIMARY KEY (id),
    INDEX idx_eth_wallet_uid (uid),
    INDEX idx_eth_wallet_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS eth_withdrawal (
    id BIGINT NOT NULL AUTO_INCREMENT,
    uid BIGINT NOT NULL,
    from_wallet_id BIGINT NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    amount_wei VARCHAR(78) NOT NULL,
    nonce_value VARCHAR(78) NOT NULL,
    gas_limit VARCHAR(78) NOT NULL,
    max_priority_fee_per_gas VARCHAR(78) NOT NULL,
    max_fee_per_gas VARCHAR(78) NOT NULL,
    signed_raw_tx TEXT,
    tx_hash VARCHAR(66),
    status VARCHAR(32) NOT NULL,
    error_message VARCHAR(1000),
    create_time DATETIME(6),
    PRIMARY KEY (id),
    INDEX idx_eth_withdrawal_uid (uid),
    INDEX idx_eth_withdrawal_tx_hash (tx_hash),
    INDEX idx_eth_withdrawal_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE IF NOT EXISTS coin_chain_config (
    id BIGINT NOT NULL AUTO_INCREMENT,
    coin_id BIGINT NOT NULL,
    chain_code VARCHAR(32) NOT NULL,
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
