import swaggerJSDoc from "swagger-jsdoc";
import { config } from "./config";

const options: swaggerJSDoc.Options = {
  definition: {
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
        description: "Development server",
      },
    ],
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
                  example: "https://fake.coinbase.com/pay/CHG-ABC123",
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
  },
  apis: ["./src/routes/*.ts", "./src/server.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);
