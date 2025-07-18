import { Request, Response, Router } from "express";
import { CoinbaseService } from "../services/coinbaseService";
import { TransactionService } from "../services/transactionService";
import { CheckoutRequest, CheckoutResponse } from "../types";
import { logger } from "../utils/logger";
import { checkoutSchema } from "../utils/validation";

const router = Router();
const coinbaseService = new CoinbaseService();
const transactionService = new TransactionService();

/**
 * @swagger
 * /api/checkout:
 *   post:
 *     summary: Create a new crypto checkout session
 *     description: Creates a new payment session through Coinbase Commerce (mocked) and returns a hosted payment URL
 *     tags: [Checkout]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckoutRequest'
 *           examples:
 *             event_ticket:
 *               summary: Event Ticket Purchase
 *               value:
 *                 amount: 99.99
 *                 email: "customer@example.com"
 *             premium_ticket:
 *               summary: Premium Ticket
 *               value:
 *                 amount: 299.00
 *                 email: "premium@example.com"
 *             student_discount:
 *               summary: Student Discount Ticket
 *               value:
 *                 amount: 49.99
 *                 email: "student@university.edu"
 *     responses:
 *       200:
 *         description: Checkout session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckoutResponse'
 *             examples:
 *               success:
 *                 summary: Successful checkout creation
 *                 value:
 *                   success: true
 *                   data:
 *                     payment_url: "https://fake.coinbase.com/pay/CHG-ABC123"
 *                     checkout_id: "550e8400-e29b-41d4-a716-446655440000"
 *                     expires_at: "2024-01-01T12:30:00.000Z"
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalid_amount:
 *                 summary: Invalid amount
 *                 value:
 *                   success: false
 *                   error: "Invalid request: amount must be a positive number"
 *               invalid_email:
 *                 summary: Invalid email
 *                 value:
 *                   success: false
 *                   error: "Invalid request: email must be a valid email address"
 *               missing_fields:
 *                 summary: Missing required fields
 *                 value:
 *                   success: false
 *                   error: "Invalid request: amount is required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               server_error:
 *                 summary: Server error
 *                 value:
 *                   success: false
 *                   error: "Internal server error"
 */

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
