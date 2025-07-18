import { Request, Response, Router } from "express";
import { CoinbaseService } from "../services/coinbaseService";
import { TransactionService } from "../services/transactionService";
import { CheckoutRequest, CheckoutResponse } from "../types";
import { logger } from "../utils/logger";
import { checkoutSchema } from "../utils/validation";

const router = Router();
const coinbaseService = new CoinbaseService();
const transactionService = new TransactionService();

router.post("/checkout", async (req: Request, res: Response) => {
  try {
    const { error, value } = checkoutSchema.validate(req.body);
    if (error) {
      logger.warn("Invalid checkout request", {
        error: error.details,
        body: req.body,
      });
      return res.status(400).json({
        success: false,
        error: "Invalid request: " + error.details[0].message,
      } as CheckoutResponse);
    }

    const request: CheckoutRequest = value;

    const coinbaseCharge = await coinbaseService.createCharge(request);

    const transaction = await transactionService.createTransaction(
      request,
      coinbaseCharge
    );

    logger.info("Checkout session created", {
      checkoutId: transaction.checkout_id,
      email: request.email,
      amount: request.amount,
    });

    const response: CheckoutResponse = {
      success: true,
      data: {
        payment_url: coinbaseCharge.hosted_url,
        checkout_id: transaction.checkout_id,
        expires_at: coinbaseCharge.expires_at,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error("Checkout failed", { error, body: req.body });
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as CheckoutResponse);
  }
});

export default router;
