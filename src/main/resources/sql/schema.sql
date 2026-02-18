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
