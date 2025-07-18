-- PostgreSQL schema for crypto checkout application

-- Transactions table to store all payment transactions
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(36) PRIMARY KEY,
    checkout_id VARCHAR(36) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'expired')),

    -- Coinbase Commerce integration fields
    coinbase_charge_id VARCHAR(255),
    coinbase_charge_code VARCHAR(255),
    payment_url TEXT,
    expires_at TIMESTAMP,
    confirmed_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transactions_email ON transactions(email);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_coinbase_charge_id ON transactions(coinbase_charge_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_status_created ON transactions(status, created_at);

-- Webhook events table to track all incoming webhooks for audit/debugging
CREATE TABLE IF NOT EXISTS webhook_events (
    id VARCHAR(36) PRIMARY KEY,
    webhook_id VARCHAR(255) NOT NULL UNIQUE,
    webhook_type VARCHAR(50) NOT NULL,
    coinbase_charge_id VARCHAR(255),
    processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payload JSONB
);

-- Create indexes for webhook_events
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(webhook_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_charge_id ON webhook_events(coinbase_charge_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at ON webhook_events(processed_at);

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
    CURRENT_TIMESTAMP + INTERVAL '15 minutes',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;