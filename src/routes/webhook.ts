import { Request, Response, Router } from "express";
import { CoinbaseService } from "../services/coinbaseService";
import { TransactionService } from "../services/transactionService";
import { WebhookPayload } from "../types";
import { logger } from "../utils/logger";
import { webhookSchema } from "../utils/validation";

const router = Router();
const coinbaseService = new CoinbaseService();
const transactionService = new TransactionService();

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
