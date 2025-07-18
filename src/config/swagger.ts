import { config } from "./config";

export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Crypto Checkout Simulator API",
    version: "1.0.0",
    description:
      "A lightweight backend service that simulates crypto checkout for event tickets using Coinbase Commerce integration",
    contact: {
      name: "API Support",
      email: "support@example.com",
    },
  },
  servers: [
    {
      url: config.app.baseUrl,
      description:
        config.nodeEnv === "production"
          ? "Production server"
          : "Development server",
    },
  ],
  paths: {
    "/": {
      get: {
        summary: "API Information",
        description: "Returns basic API information and available endpoints",
        tags: ["Info"],
        responses: {
          "200": {
            description: "API information",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Crypto Checkout Simulator API",
                    },
                    version: {
                      type: "string",
                      example: "1.0.0",
                    },
                    endpoints: {
                      type: "object",
                      properties: {
                        checkout: {
                          type: "string",
                          example: "POST /api/checkout",
                        },
                        webhook: {
                          type: "string",
                          example: "POST /api/webhook",
                        },
                        health: {
                          type: "string",
                          example: "GET /api/health",
                        },
                        docs: {
                          type: "string",
                          example: "GET /api-docs",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/health": {
      get: {
        summary: "Health check endpoint",
        description:
          "Returns API health status, uptime, memory usage, and transaction statistics",
        tags: ["Health"],
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/HealthResponse",
                },
                examples: {
                  healthy: {
                    summary: "Healthy service",
                    value: {
                      status: "healthy",
                      timestamp: "2024-01-01T12:00:00.000Z",
                      uptime: 3600.5,
                      memory: {
                        rss: 45678592,
                        heapTotal: 16777216,
                        heapUsed: 12345678,
                        external: 1234567,
                      },
                      transactions: {
                        total: 150,
                        pending: 5,
                        completed: 140,
                        failed: 5,
                      },
                    },
                  },
                },
              },
            },
          },
          "500": {
            description: "Service is unhealthy (database connection failed)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                      example: "unhealthy",
                    },
                    error: {
                      type: "string",
                      example: "Database connection failed",
                    },
                  },
                },
                examples: {
                  unhealthy: {
                    summary: "Unhealthy service",
                    value: {
                      status: "unhealthy",
                      error: "Database connection failed",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/checkout": {
      post: {
        summary: "Create a new crypto checkout session",
        description:
          "Creates a new payment session through Coinbase Commerce (mocked) and returns a hosted payment URL",
        tags: ["Checkout"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CheckoutRequest",
              },
              examples: {
                event_ticket: {
                  summary: "Event Ticket Purchase",
                  value: {
                    amount: 99.99,
                    email: "customer@example.com",
                  },
                },
                premium_ticket: {
                  summary: "Premium Ticket",
                  value: {
                    amount: 299.0,
                    email: "premium@example.com",
                  },
                },
                student_discount: {
                  summary: "Student Discount Ticket",
                  value: {
                    amount: 49.99,
                    email: "student@university.edu",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Checkout session created successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CheckoutResponse",
                },
                examples: {
                  success: {
                    summary: "Successful checkout creation",
                    value: {
                      success: true,
                      data: {
                        payment_url:
                          "https://superai.coinbase.com/pay/CHG-ABC123",
                        checkout_id: "550e8400-e29b-41d4-a716-446655440000",
                        expires_at: "2024-01-01T12:30:00.000Z",
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid request data",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
                examples: {
                  invalid_amount: {
                    summary: "Invalid amount",
                    value: {
                      success: false,
                      error:
                        "Invalid request: amount must be a positive number",
                    },
                  },
                  invalid_email: {
                    summary: "Invalid email",
                    value: {
                      success: false,
                      error:
                        "Invalid request: email must be a valid email address",
                    },
                  },
                  missing_fields: {
                    summary: "Missing required fields",
                    value: {
                      success: false,
                      error: "Invalid request: amount is required",
                    },
                  },
                },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
                examples: {
                  server_error: {
                    summary: "Server error",
                    value: {
                      success: false,
                      error: "Internal server error",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/webhook": {
      post: {
        summary: "Receive Coinbase Commerce webhook",
        description:
          "Processes incoming webhook notifications from Coinbase Commerce to update transaction status",
        tags: ["Webhook"],
        security: [
          {
            WebhookSignature: [],
          },
        ],
        parameters: [
          {
            in: "header",
            name: "X-CC-Webhook-Signature",
            required: true,
            schema: {
              type: "string",
              example: "sha256=abc123def456...",
            },
            description: "HMAC signature for webhook verification",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/WebhookPayload",
              },
              examples: {
                charge_created: {
                  summary: "Charge Created Event",
                  value: {
                    id: "webhook-event-123",
                    type: "charge:created",
                    created_at: "2024-01-01T12:00:00.000Z",
                    data: {
                      id: "charge-abc-123",
                      code: "CHG-ABC123",
                      name: "Event Ticket Purchase",
                      description: "Premium ticket for Tech Conference 2024",
                      pricing: {
                        local: {
                          amount: "99.99",
                          currency: "USD",
                        },
                        bitcoin: {
                          amount: "0.0023",
                          currency: "BTC",
                        },
                      },
                      metadata: {
                        email: "customer@example.com",
                        checkout_id: "550e8400-e29b-41d4-a716-446655440000",
                      },
                      timeline: [
                        {
                          time: "2024-01-01T12:00:00.000Z",
                          status: "NEW",
                        },
                      ],
                    },
                  },
                },
                charge_confirmed: {
                  summary: "Charge Confirmed Event",
                  value: {
                    id: "webhook-event-456",
                    type: "charge:confirmed",
                    created_at: "2024-01-01T12:15:00.000Z",
                    data: {
                      id: "charge-abc-123",
                      code: "CHG-ABC123",
                      name: "Event Ticket Purchase",
                      description: "Premium ticket for Tech Conference 2024",
                      pricing: {
                        local: {
                          amount: "99.99",
                          currency: "USD",
                        },
                        bitcoin: {
                          amount: "0.0023",
                          currency: "BTC",
                        },
                      },
                      metadata: {
                        email: "customer@example.com",
                        checkout_id: "550e8400-e29b-41d4-a716-446655440000",
                      },
                      timeline: [
                        {
                          time: "2024-01-01T12:00:00.000Z",
                          status: "NEW",
                        },
                        {
                          time: "2024-01-01T12:15:00.000Z",
                          status: "CONFIRMED",
                        },
                      ],
                    },
                  },
                },
                charge_failed: {
                  summary: "Charge Failed Event",
                  value: {
                    id: "webhook-event-789",
                    type: "charge:failed",
                    created_at: "2024-01-01T12:30:00.000Z",
                    data: {
                      id: "charge-xyz-789",
                      code: "CHG-XYZ789",
                      name: "Event Ticket Purchase",
                      description: "Standard ticket for Tech Conference 2024",
                      pricing: {
                        local: {
                          amount: "49.99",
                          currency: "USD",
                        },
                        bitcoin: {
                          amount: "0.0012",
                          currency: "BTC",
                        },
                      },
                      metadata: {
                        email: "user@example.com",
                        checkout_id: "660f9511-f30c-52e5-b827-557766551111",
                      },
                      timeline: [
                        {
                          time: "2024-01-01T12:20:00.000Z",
                          status: "NEW",
                        },
                        {
                          time: "2024-01-01T12:30:00.000Z",
                          status: "FAILED",
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Webhook processed successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid webhook payload",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Invalid payload",
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Invalid webhook signature",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Invalid signature",
                    },
                  },
                },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Internal server error",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/transactions": {
      get: {
        summary: "List transactions",
        description:
          "Retrieve a paginated list of transactions with optional filtering",
        tags: ["Transactions"],
        parameters: [
          {
            in: "query",
            name: "page",
            schema: {
              type: "integer",
              minimum: 1,
              default: 1,
            },
            description: "Page number for pagination",
          },
          {
            in: "query",
            name: "limit",
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 10,
            },
            description: "Number of transactions per page (max 100)",
          },
          {
            in: "query",
            name: "status",
            schema: {
              type: "string",
              enum: ["pending", "completed", "failed", "expired"],
            },
            description: "Filter by transaction status",
          },
          {
            in: "query",
            name: "email",
            schema: {
              type: "string",
              format: "email",
            },
            description: "Filter by customer email",
          },
        ],
        responses: {
          "200": {
            description: "Transactions retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    data: {
                      type: "object",
                      properties: {
                        transactions: {
                          type: "array",
                          items: {
                            $ref: "#/components/schemas/Transaction",
                          },
                        },
                        pagination: {
                          type: "object",
                          properties: {
                            page: { type: "integer", example: 1 },
                            limit: { type: "integer", example: 10 },
                            total: { type: "integer", example: 25 },
                            totalPages: { type: "integer", example: 3 },
                            hasNext: { type: "boolean", example: true },
                            hasPrev: { type: "boolean", example: false },
                          },
                        },
                      },
                    },
                  },
                },
                examples: {
                  success: {
                    summary: "Successful response",
                    value: {
                      success: true,
                      data: {
                        transactions: [
                          {
                            id: "550e8400-e29b-41d4-a716-446655440000",
                            checkout_id: "660f9511-f30c-52e5-b827-557766551111",
                            email: "customer@example.com",
                            amount: 99.99,
                            currency: "USD",
                            status: "completed",
                            coinbase_charge_id: "charge-abc-123",
                            coinbase_charge_code: "CHG-ABC123",
                            payment_url:
                              "https://superai.coinbase.com/pay/CHG-ABC123",
                            expires_at: "2024-01-01T12:30:00.000Z",
                            created_at: "2024-01-01T12:00:00.000Z",
                            updated_at: "2024-01-01T12:15:00.000Z",
                            confirmed_at: "2024-01-01T12:15:00.000Z",
                          },
                        ],
                        pagination: {
                          page: 1,
                          limit: 10,
                          total: 25,
                          totalPages: 3,
                          hasNext: true,
                          hasPrev: false,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid pagination parameters",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
    "/api/transactions/{id}": {
      get: {
        summary: "Get transaction by ID",
        description: "Retrieve a specific transaction by its ID",
        tags: ["Transactions"],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
            description: "Transaction ID",
          },
        ],
        responses: {
          "200": {
            description: "Transaction retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    data: {
                      $ref: "#/components/schemas/Transaction",
                    },
                  },
                },
              },
            },
          },
          "404": {
            description: "Transaction not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
    "/api/db-test": {
      get: {
        summary: "Test database connection",
        description:
          "Test the database connection and return connection details",
        tags: ["Debug"],
        responses: {
          "200": {
            description: "Database connection successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    message: {
                      type: "string",
                      example: "Database connection successful",
                    },
                    timestamp: {
                      type: "string",
                      format: "date-time",
                      example: "2024-01-01T12:00:00.000Z",
                    },
                    database: {
                      type: "object",
                      properties: {
                        current_time: {
                          type: "string",
                          format: "date-time",
                          example: "2024-01-01T12:00:00.000Z",
                        },
                        version: {
                          type: "string",
                          example: "PostgreSQL 14.18 on x86_64-pc-linux-gnu",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "500": {
            description: "Database connection failed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: false,
                    },
                    error: {
                      type: "string",
                      example: "Database connection failed",
                    },
                    details: {
                      type: "string",
                      example: "password authentication failed for user 'root'",
                    },
                    timestamp: {
                      type: "string",
                      format: "date-time",
                      example: "2024-01-01T12:00:00.000Z",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/db-status": {
      get: {
        summary: "Get database configuration status",
        description:
          "Return current database configuration and environment variables",
        tags: ["Debug"],
        responses: {
          "200": {
            description: "Database configuration retrieved",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    timestamp: {
                      type: "string",
                      format: "date-time",
                      example: "2024-01-01T12:00:00.000Z",
                    },
                    environment: {
                      type: "string",
                      example: "production",
                    },
                    database: {
                      type: "object",
                      properties: {
                        host: {
                          type: "string",
                          example:
                            "app-4742542c-6553-41df-8e96-48f33276c646-do-user-13926411-0.e.db.ondigitalocean.com",
                        },
                        user: {
                          type: "string",
                          example: "db",
                        },
                        database: {
                          type: "string",
                          example: "db",
                        },
                        port: {
                          type: "number",
                          example: 25060,
                        },
                        hasPassword: {
                          type: "boolean",
                          example: true,
                        },
                      },
                    },
                    env_vars: {
                      type: "object",
                      properties: {
                        DB_HOST: {
                          type: "string",
                          example:
                            "app-4742542c-6553-41df-8e96-48f33276c646-do-user-13926411-0.e.db.ondigitalocean.com",
                        },
                        DB_USER: {
                          type: "string",
                          example: "db",
                        },
                        DB_NAME: {
                          type: "string",
                          example: "db",
                        },
                        DB_PORT: {
                          type: "string",
                          example: "25060",
                        },
                        NODE_ENV: {
                          type: "string",
                          example: "production",
                        },
                        BASE_URL: {
                          type: "string",
                          example:
                            "https://superai-ta-p45qk.ondigitalocean.app",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "500": {
            description: "Failed to get database status",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Failed to get database status",
                    },
                    details: {
                      type: "string",
                      example: "Unknown error",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/db-migrate": {
      post: {
        summary: "Run database migrations",
        description: "Execute database migrations to create tables and indexes",
        tags: ["Debug"],
        responses: {
          "200": {
            description: "Database migration completed successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    message: {
                      type: "string",
                      example: "Database migration completed successfully",
                    },
                    timestamp: {
                      type: "string",
                      format: "date-time",
                      example: "2024-01-01T12:00:00.000Z",
                    },
                  },
                },
              },
            },
          },
          "500": {
            description: "Database migration failed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: false,
                    },
                    error: {
                      type: "string",
                      example: "Database migration failed",
                    },
                    details: {
                      type: "string",
                      example: "Unknown error",
                    },
                    timestamp: {
                      type: "string",
                      format: "date-time",
                      example: "2024-01-01T12:00:00.000Z",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      CheckoutRequest: {
        type: "object",
        required: ["amount", "email"],
        properties: {
          amount: {
            type: "number",
            format: "float",
            minimum: 0.01,
            example: 99.99,
            description: "Payment amount in USD",
          },
          email: {
            type: "string",
            format: "email",
            example: "customer@example.com",
            description: "Customer email address",
          },
        },
      },
      CheckoutResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          data: {
            type: "object",
            properties: {
              payment_url: {
                type: "string",
                format: "uri",
                example: "https://superai.coinbase.com/pay/CHG-ABC123",
                description: "Hosted payment URL for customer",
              },
              checkout_id: {
                type: "string",
                format: "uuid",
                example: "550e8400-e29b-41d4-a716-446655440000",
                description: "Unique checkout session identifier",
              },
              expires_at: {
                type: "string",
                format: "date-time",
                example: "2024-01-01T12:30:00.000Z",
                description: "Payment session expiration time",
              },
            },
          },
          error: {
            type: "string",
            example: "Invalid request: amount must be a positive number",
          },
        },
      },
      WebhookPayload: {
        type: "object",
        required: ["id", "type", "created_at", "data"],
        properties: {
          id: {
            type: "string",
            example: "webhook-event-123",
            description: "Unique webhook event identifier",
          },
          type: {
            type: "string",
            enum: ["charge:created", "charge:confirmed", "charge:failed"],
            example: "charge:confirmed",
            description: "Type of webhook event",
          },
          created_at: {
            type: "string",
            format: "date-time",
            example: "2024-01-01T12:00:00.000Z",
            description: "When the webhook event was created",
          },
          data: {
            type: "object",
            required: ["id", "code", "name", "metadata"],
            properties: {
              id: {
                type: "string",
                example: "charge-abc-123",
                description: "Coinbase charge identifier",
              },
              code: {
                type: "string",
                example: "CHG-ABC123",
                description: "Human-readable charge code",
              },
              name: {
                type: "string",
                example: "Event Ticket Purchase",
                description: "Payment description",
              },
              description: {
                type: "string",
                example: "Premium ticket for Tech Conference 2024",
                description: "Detailed payment description",
              },
              pricing: {
                type: "object",
                properties: {
                  local: {
                    type: "object",
                    properties: {
                      amount: { type: "string", example: "99.99" },
                      currency: { type: "string", example: "USD" },
                    },
                  },
                  bitcoin: {
                    type: "object",
                    properties: {
                      amount: { type: "string", example: "0.0023" },
                      currency: { type: "string", example: "BTC" },
                    },
                  },
                },
              },
              metadata: {
                type: "object",
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "customer@example.com",
                  },
                  checkout_id: {
                    type: "string",
                    format: "uuid",
                    example: "550e8400-e29b-41d4-a716-446655440000",
                  },
                },
              },
              timeline: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    time: {
                      type: "string",
                      format: "date-time",
                      example: "2024-01-01T12:00:00.000Z",
                    },
                    status: {
                      type: "string",
                      example: "PENDING",
                    },
                  },
                },
              },
            },
          },
        },
      },
      HealthResponse: {
        type: "object",
        properties: {
          status: {
            type: "string",
            example: "healthy",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2024-01-01T12:00:00.000Z",
          },
          uptime: {
            type: "number",
            example: 3600.5,
            description: "Server uptime in seconds",
          },
          memory: {
            type: "object",
            properties: {
              rss: { type: "number", example: 45678592 },
              heapTotal: { type: "number", example: 16777216 },
              heapUsed: { type: "number", example: 12345678 },
              external: { type: "number", example: 1234567 },
            },
          },
          transactions: {
            type: "object",
            properties: {
              total: { type: "number", example: 150 },
              pending: { type: "number", example: 5 },
              completed: { type: "number", example: 140 },
              failed: { type: "number", example: 5 },
            },
          },
        },
      },
      Transaction: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
            example: "550e8400-e29b-41d4-a716-446655440000",
            description: "Unique transaction identifier",
          },
          checkout_id: {
            type: "string",
            format: "uuid",
            example: "660f9511-f30c-52e5-b827-557766551111",
            description: "Unique checkout session identifier",
          },
          email: {
            type: "string",
            format: "email",
            example: "customer@example.com",
            description: "Customer email address",
          },
          amount: {
            type: "number",
            format: "float",
            example: 99.99,
            description: "Payment amount",
          },
          currency: {
            type: "string",
            example: "USD",
            description: "Payment currency",
          },
          status: {
            type: "string",
            enum: ["pending", "completed", "failed", "expired"],
            example: "completed",
            description: "Transaction status",
          },
          coinbase_charge_id: {
            type: "string",
            example: "charge-abc-123",
            description: "Coinbase charge identifier",
          },
          coinbase_charge_code: {
            type: "string",
            example: "CHG-ABC123",
            description: "Human-readable charge code",
          },
          payment_url: {
            type: "string",
            format: "uri",
            example: "https://superai.coinbase.com/pay/CHG-ABC123",
            description: "Hosted payment URL",
          },
          expires_at: {
            type: "string",
            format: "date-time",
            example: "2024-01-01T12:30:00.000Z",
            description: "Payment session expiration time",
          },
          created_at: {
            type: "string",
            format: "date-time",
            example: "2024-01-01T12:00:00.000Z",
            description: "Transaction creation time",
          },
          updated_at: {
            type: "string",
            format: "date-time",
            example: "2024-01-01T12:15:00.000Z",
            description: "Last update time",
          },
          confirmed_at: {
            type: "string",
            format: "date-time",
            example: "2024-01-01T12:15:00.000Z",
            description: "Payment confirmation time",
            nullable: true,
          },
        },
      },
      Error: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          error: {
            type: "string",
            example: "Invalid request: missing required field",
          },
        },
      },
    },
    securitySchemes: {
      WebhookSignature: {
        type: "apiKey",
        in: "header",
        name: "X-CC-Webhook-Signature",
        description: "Coinbase Commerce webhook signature for verification",
      },
    },
  },
};
