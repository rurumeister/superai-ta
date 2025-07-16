# Crypto Checkout Simulator Backend

### Problem Statement: Crypto Payment Processing

This backend service simulates a crypto checkout portal for event tickets, designed to replace a legacy PHP system. The service handles payment session creation through Coinbase Commerce integration and processes incoming transaction webhooks.

The system addresses common challenges in crypto payment processing including transaction tracking, webhook validation, and maintaining payment state across asynchronous blockchain confirmations.

### Example Scenario

A user wants to purchase an event ticket for **$50**. The system:

- Creates a Coinbase Commerce payment session
- Returns a hosted payment URL (e.g., `https://commerce.coinbase.com/pay/abc123`)
- Processes webhook notifications as the transaction progresses through blockchain confirmations
- Updates transaction status from `pending` → `confirmed` → `completed`

## Task

Build a lightweight backend that:

- Accepts payment requests and creates mock Coinbase Commerce sessions
- Processes webhook notifications for transaction status updates
- Maintains transaction records in a relational database
- Provides proper validation and error handling
