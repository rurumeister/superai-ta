import { Request, Response, Router } from "express";
import { CoinbaseService } from "../services/coinbaseService";
import { TransactionService } from "../services/transactionService";
import { WebhookPayload } from "../types";
import { logger } from "../utils/logger";
import { webhookSchema } from "../utils/validation";

const router = Router();
const coinbaseService = new CoinbaseService();
const transactionService = new TransactionService();

/**
 * @swagger
 * /api/webhook:
 *   post:
 *     summary: Receive Coinbase Commerce webhook
 *     description: Processes incoming webhook notifications from Coinbase Commerce to update transaction status
 *     tags: [Webhook]
 *     security:
 *       - WebhookSignature: []
 *     parameters:
 *       - in: header
 *         name: X-CC-Webhook-Signature
 *         required: true
 *         schema:
 *           type: string
 *           example: "sha256=abc123def456..."
 *         description: HMAC signature for webhook verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WebhookPayload'
 *           examples:
 *             charge_created:
 *               summary: Charge Created Event
 *               value:
 *                 id: "webhook-event-123"
 *                 type: "charge:created"
 *                 created_at: "2024-01-01T12:00:00.000Z"
 *                 data:
 *                   id: "charge-abc-123"
 *                   code: "CHG-ABC123"
 *                   name: "Event Ticket Purchase"
 *                   description: "Premium ticket for Tech Conference 2024"
 *                   pricing:
 *                     local:
 *                       amount: "99.99"
 *                       currency: "USD"
 *                     bitcoin:
 *                       amount: "0.0023"
 *                       currency: "BTC"
 *                   metadata:
 *                     email: "customer@example.com"
 *                     checkout_id: "550e8400-e29b-41d4-a716-446655440000"
 *                   timeline:
 *                     - time: "2024-01-01T12:00:00.000Z"
 *                       status: "NEW"
 *             charge_confirmed:
 *               summary: Charge Confirmed Event
 *               value:
 *                 id: "webhook-event-456"
 *                 type: "charge:confirmed"
 *                 created_at: "2024-01-01T12:15:00.000Z"
 *                 data:
 *                   id: "charge-abc-123"
 *                   code: "CHG-ABC123"
 *                   name: "Event Ticket Purchase"
 *                   description: "Premium ticket for Tech Conference 2024"
 *                   pricing:
 *                     local:
 *                       amount: "99.99"
 *                       currency: "USD"
 *                     bitcoin:
 *                       amount: "0.0023"
 *                       currency: "BTC"
 *                   metadata:
 *                     email: "customer@example.com"
 *                     checkout_id: "550e8400-e29b-41d4-a716-446655440000"
 *                   timeline:
 *                     - time: "2024-01-01T12:00:00.000Z"
 *                       status: "NEW"
 *                     - time: "2024-01-01T12:15:00.000Z"
 *                       status: "CONFIRMED"
 *             charge_failed:
 *               summary: Charge Failed Event
 *               value:
 *                 id: "webhook-event-789"
 *                 type: "charge:failed"
 *                 created_at: "2024-01-01T12:30:00.000Z"
 *                 data:
 *                   id: "charge-xyz-789"
 *                   code: "CHG-XYZ789"
 *                   name: "Event Ticket Purchase"
 *                   description: "Standard ticket for Tech Conference 2024"
 *                   pricing:
 *                     local:
 *                       amount: "49.99"
 *                       currency: "USD"
 *                     bitcoin:
 *                       amount: "0.0012"
 *                       currency: "BTC"
 *                   metadata:
 *                     email: "user@example.com"
 *                     checkout_id: "660f9511-f30c-52e5-b827-557766551111"
 *                   timeline:
 *                     - time: "2024-01-01T12:20:00.000Z"
 *                       status: "NEW"
 *                     - time: "2024-01-01T12:30:00.000Z"
 *                       status: "FAILED"
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid webhook payload
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid payload"
 *       401:
 *         description: Invalid webhook signature
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid signature"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */

router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-cc-webhook-signature"] as string;
    const rawBody = JSON.stringify(req.body);

    if (!coinbaseService.validateWebhookSignature(rawBody, signature)) {
      logger.warn("Invalid webhook signature", {
        signature: signature?.substring(0, 20),
      });
      return res.status(401).json({ error: "Invalid signature" });
    }

    const { error, value } = webhookSchema.validate(req.body);
    if (error) {
      logger.warn("Invalid webhook payload", {
        error: error.details,
        body: req.body,
      });
      return res.status(400).json({ error: "Invalid payload" });
    }

    const payload: WebhookPayload = value;

    await processWebhook(payload);

    logger.info("Webhook processed successfully", {
      type: payload.type,
      chargeId: payload.data.id,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error("Webhook processing failed", { error, body: req.body });
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Processes the webhook based on the type
 * @param payload - The payload of the webhook
 */
async function processWebhook(payload: WebhookPayload) {
  const { type, data } = payload;

  switch (type) {
    case "charge:created":
      logger.info("Charge created webhook received", { chargeId: data.id });
      // Transaction already exists from checkout endpoint
      break;

    case "charge:confirmed":
      logger.info("Charge confirmed webhook received", { chargeId: data.id });
      await transactionService.updateTransactionStatus(
        data.id,
        "completed",
        new Date()
      );
      break;

    case "charge:failed":
      logger.info("Charge failed webhook received", { chargeId: data.id });
      await transactionService.updateTransactionStatus(data.id, "failed");
      break;

    default:
      logger.warn("Unknown webhook type", { type, chargeId: data.id });
  }
}

export default router;
