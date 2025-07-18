import { v4 as uuidv4 } from "uuid";
import { CheckoutRequest } from "../types";
import { logger } from "../utils/logger";

export class CoinbaseService {
  /**
   * Mock implementation of Coinbase Commerce API. In production, this would make actual API calls to Coinbase
   * @param request - The request object containing the checkout details
   * @returns The charge details
   */
  async createCharge(request: CheckoutRequest): Promise<{
    id: string;
    code: string;
    hosted_url: string;
    expires_at: string;
  }> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const chargeId = uuidv4();
      const chargeCode = `CHG-${Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase()}`;
      const hostedUrl = `https://superai.coinbase.com/pay/${chargeCode}`;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

      logger.info("Mock Coinbase charge created", {
        chargeId,
        chargeCode,
        amount: request.amount,
        email: request.email,
      });

      return {
        id: chargeId,
        code: chargeCode,
        hosted_url: hostedUrl,
        expires_at: expiresAt,
      };
    } catch (error) {
      logger.error("Failed to create Coinbase charge", { error, request });
      throw new Error("Failed to create payment session");
    }
  }

  /**
   * Mock webhook signature validation. In production, this would verify the webhook signature using Coinbase's secret
   * @param payload - The payload of the webhook
   * @param signature - The signature of the webhook
   * @returns true if the signature is valid, false otherwise
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    logger.debug("Validating webhook signature", {
      payloadLength: payload.length,
      signature: signature?.substring(0, 20) + "...",
    });

    return !!(signature && signature.startsWith("sha256="));
  }
}
