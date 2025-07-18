import { Request, Response, Router } from "express";
import { TransactionService } from "../services/transactionService";
import { logger } from "../utils/logger";

const router = Router();
const transactionService = new TransactionService();

router.get("/transactions", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const email = req.query.email as string;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100",
      });
    }

    const offset = (page - 1) * limit;

    // Use the service methods for proper database handling
    const [transactions, totalCount] = await Promise.all([
      transactionService.getTransactions({
        page,
        limit,
        offset,
        status,
        email,
      }),
      transactionService.getTransactionCount({ status, email }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    logger.info("Transactions retrieved", {
      page,
      limit,
      totalCount,
      totalPages,
      filters: { status, email },
    });

    res.json({
      success: true,
      data: {
        transactions: transactions,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    logger.error("Failed to retrieve transactions", {
      error,
      query: req.query,
    });
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

router.get("/transactions/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const transaction = await transactionService.getTransactionById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: "Transaction not found",
      });
    }

    logger.info("Transaction retrieved", { transactionId: id });

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    logger.error("Failed to retrieve transaction", {
      error,
      id: req.params.id,
    });
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

export default router;
