CREATE DATABASE IF NOT EXISTS crypto_checkout;
USE crypto_checkout;

-- Transactions table to store all payment transactions
CREATE TABLE transactions (
    id VARCHAR(36) PRIMARY KEY,
    checkout_id VARCHAR(36) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    status ENUM('pending', 'completed', 'failed', 'expired') NOT NULL DEFAULT 'pending',

    -- Coinbase Commerce integration fields
    coinbase_charge_id VARCHAR(255),
    coinbase_charge_code VARCHAR(255),
    payment_url TEXT,
    expires_at DATETIME,
    confirmed_at DATETIME,

    -- Timestamps
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes for performance
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_coinbase_charge_id (coinbase_charge_id),
    INDEX idx_created_at (created_at),
    INDEX idx_status_created (status, created_at)
);

-- Webhook events table to track all incoming webhooks for audit/debugging
CREATE TABLE webhook_events (
    id VARCHAR(36) PRIMARY KEY,
    webhook_id VARCHAR(255) NOT NULL,
    webhook_type VARCHAR(50) NOT NULL,
    coinbase_charge_id VARCHAR(255),
    processed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payload JSON,

    -- Prevent duplicate webhook processing
    UNIQUE KEY unique_webhook (webhook_id),
    INDEX idx_webhook_type (webhook_type),
    INDEX idx_charge_id (coinbase_charge_id),
    INDEX idx_processed_at (processed_at)
);

-- Sample data for testing
INSERT INTO transactions (
    id, checkout_id, email, amount, currency, status,
    coinbase_charge_id, coinbase_charge_code, payment_url,
    expires_at, created_at, updated_at
) VALUES (
    'test-transaction-1',
    'test-checkout-1',
    'test@example.com',
    99.99,
    'USD',
    'completed',
    'test-charge-1',
    'CHG-TEST123',
    'https://superai.coinbase.com/pay/CHG-TEST123',
    DATE_ADD(NOW(), INTERVAL 15 MINUTE),
    NOW(),
    NOW()
);
