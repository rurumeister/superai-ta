# Crypto Checkout Simulator Backend

A lightweight crypto checkout backend simulator that handles payment session creation through Coinbase Commerce integration and processes incoming transaction webhooks. Built with Node.js, TypeScript, Express, and PostgreSQL.

## Features

- **Payment Session Creation**: Create Coinbase Commerce payment sessions
- **Webhook Processing**: Handle transaction status updates from Coinbase
- **Database Integration**: PostgreSQL with automatic migrations
- **Health Monitoring**: Comprehensive health checks and monitoring
- **API Documentation**: Swagger/OpenAPI documentation
- **Production Ready**: Dockerized and deployed on Digital Ocean

## Architecture

- **Backend**: Node.js + TypeScript + Express
- **Database**: PostgreSQL (production) / MySQL (development)
- **Payment**: Coinbase Commerce integration (mocked)
- **Deployment**: Digital Ocean App Platform
- **Containerization**: Docker with multi-stage builds

## API Endpoints

### Core Endpoints

- `POST /api/checkout` - Create payment session
- `POST /api/webhook` - Process Coinbase webhooks
- `GET /api/transactions` - List transactions
- `GET /api/health` - Health check

### Debug Endpoints

- `GET /api/db-test` - Test database connection
- `GET /api/db-status` - Database configuration info
- `POST /api/db-migrate` - Run database migrations

## 🛠️ Local Development

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- MySQL (for local development)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/rurumeister/superai-ta.git
cd superai-ta

# Install dependencies
npm install

# Start development environment
npm run dev
```

### Docker Development

```bash
# Build and start development environment
docker-compose -f docker-compose.dev.yml up --build

# Start production environment locally
docker-compose -f docker-compose.yml up --build
```

### Database Setup (Local)

```bash
# Run database migrations
npm run db:migrate

# The app will be available at http://localhost:3000
```

## 🌐 Production Deployment

### Digital Ocean App Platform

The application is deployed on Digital Ocean App Platform with automatic deployments from GitHub.

**Live URL**: https://superai-ta-p45qk.ondigitalocean.app

### Database Schema

The application uses PostgreSQL in production with the following tables:

#### `transactions`

- `id` (VARCHAR(36)) - Primary key
- `checkout_id` (VARCHAR(36)) - Unique checkout identifier
- `email` (VARCHAR(255)) - Customer email
- `amount` (DECIMAL(10,2)) - Payment amount
- `currency` (VARCHAR(10)) - Currency code (default: USD)
- `status` (VARCHAR(20)) - Transaction status (pending/completed/failed/expired)
- `coinbase_charge_id` (VARCHAR(255)) - Coinbase charge ID
- `coinbase_charge_code` (VARCHAR(255)) - Coinbase charge code
- `payment_url` (TEXT) - Payment URL
- `expires_at` (TIMESTAMP) - Payment expiration
- `confirmed_at` (TIMESTAMP) - Confirmation timestamp
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

#### `webhook_events`

- `id` (VARCHAR(36)) - Primary key
- `webhook_id` (VARCHAR(255)) - Unique webhook identifier
- `webhook_type` (VARCHAR(50)) - Webhook type
- `coinbase_charge_id` (VARCHAR(255)) - Associated charge ID
- `processed_at` (TIMESTAMP) - Processing timestamp
- `payload` (JSONB) - Webhook payload

## 🔧 Troubleshooting

### Database Connection Issues

If you see `"database": "disconnected"` in the health endpoint:

1. **Check database status**:

   ```bash
   curl https://your-app-url.ondigitalocean.app/api/db-status
   ```

2. **Test database connection**:

   ```bash
   curl https://your-app-url.ondigitalocean.app/api/db-test
   ```

3. **Run migrations manually** (if needed):
   ```bash
   # In Digital Ocean console
   node migrate-simple.js
   ```

### Common Issues

- **Missing DB_USER**: Ensure `DB_USER` environment variable is set
- **Migration failures**: Check if database tables exist
- **SSL connection issues**: Verify SSL configuration in database connection

## 📊 Monitoring

### Health Check

```bash
curl https://superai-ta-p45qk.ondigitalocean.app/api/health
```

### API Documentation

Visit: https://superai-ta-p45qk.ondigitalocean.app/api-docs

## 🧪 Testing

### Postman Collection

📋 **API Testing Collection**: [Download Postman Collection](https://dpyp-team.postman.co/workspace/My-Workspace~5fe7c70e-e871-40f5-87ba-e22bdedef8fe/collection/25982747-bdac5622-b766-420d-958a-8ba9c0841e9a?action=share&creator=25982747)

Import this collection into Postman to test all API endpoints with pre-configured requests.

### Test Payment Flow

1. **Create a checkout session**:

   ```bash
   curl -X POST https://superai-ta-p45qk.ondigitalocean.app/api/checkout \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","amount":99.99}'
   ```

2. **Check transactions**:

   ```bash
   curl https://superai-ta-p45qk.ondigitalocean.app/api/transactions
   ```

3. **Monitor health**:
   ```bash
   curl https://superai-ta-p45qk.ondigitalocean.app/api/health
   ```

## Project Structure

```
superai-ta/
├── src/
│   ├── config/          # Configuration files
│   ├── database/        # Database migrations and schemas
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── scripts/             # Utility scripts
├── .do/                 # Digital Ocean configuration
├── docker-compose.yml   # Production Docker setup
├── docker-compose.dev.yml # Development Docker setup
└── Dockerfile           # Multi-stage Docker build
```

## Deployment Workflow

1. **Code Changes**: Push to `main` branch
2. **Auto-Deploy**: Digital Ocean automatically deploys
3. **Database Migration**: Tables are created automatically
4. **Health Check**: App Platform waits for `/api/health` to return 200
5. **Live**: Application is available with zero downtime

## Development Notes

- **Local Development**: Uses MySQL for easier local setup
- **Production**: Uses PostgreSQL for better performance and features
- **Environment Detection**: Automatically switches database based on `NODE_ENV`
- **Error Handling**: Comprehensive error handling with detailed logging
- **Security**: Helmet.js for security headers, CORS configuration
