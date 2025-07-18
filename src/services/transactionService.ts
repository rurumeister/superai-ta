import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import { createConnection } from "../config/database";
import { CheckoutRequest, Transaction } from "../types";
import { logger } from "../utils/logger";

export class TransactionService {
  private db!: Pool;
  private isInitialized: boolean = false;

  constructor() {
    this.initializeDatabase().catch((error) => {
      logger.error("Failed to initialize database:", error);
    });
  }

  private async initializeDatabase() {
    try {
      this.db = await createConnection();
      this.isInitialized = true;
      logger.info("TransactionService database initialized");
    } catch (error) {
      logger.error("TransactionService database initialization failed:", error);
      throw error;
    }
  }

  private async ensureConnection() {
    if (!this.isInitialized) {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Database connection timeout")),
          10000
        );
      });

      try {
        await Promise.race([this.initializeDatabase(), timeoutPromise]);
      } catch (error) {
        logger.error("Database connection failed or timed out:", error);
        throw error;
      }
    }
  }

  /**
   * Creates a new transaction in the database
   * @param request - The request object containing the checkout details
   * @param coinbaseData - The data returned from the Coinbase Commerce API
   * @returns The transaction object
   */
  async createTransaction(
    request: CheckoutRequest,
    coinbaseData: {
      id: string;
      code: string;
      hosted_url: string;
      expires_at: string;
    }
  ): Promise<Transaction> {
    const transaction: Transaction = {
      id: uuidv4(),
      checkout_id: uuidv4(),
      email: request.email,
      amount: request.amount,
      currency: "USD",
      status: "pending",
      coinbase_charge_id: coinbaseData.id,
      coinbase_charge_code: coinbaseData.code,
      payment_url: coinbaseData.hosted_url,
      expires_at: new Date(coinbaseData.expires_at),
      created_at: new Date(),
      updated_at: new Date(),
    };

    const query = `
      INSERT INTO transactions (
        id, checkout_id, email, amount, currency, status,
        coinbase_charge_id, coinbase_charge_code, payment_url,
        expires_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `;

    await this.ensureConnection();
    await this.db.query(query, [
      transaction.id,
      transaction.checkout_id,
      transaction.email,
      transaction.amount,
      transaction.currency,
      transaction.status,
      transaction.coinbase_charge_id,
      transaction.coinbase_charge_code,
      transaction.payment_url,
      transaction.expires_at,
      transaction.created_at,
      transaction.updated_at,
    ]);

    logger.info("Transaction created", { transactionId: transaction.id });
    return transaction;
  }

  /**
   * Updates the status of a transaction
   * @param coinbaseChargeId - The ID of the Coinbase charge
   * @param status - The new status of the transaction
   * @param confirmedAt - The date and time the transaction was confirmed
   */
  async updateTransactionStatus(
    coinbaseChargeId: string,
    status: "completed" | "failed" | "expired",
    confirmedAt?: Date
  ): Promise<void> {
    const query = `
      UPDATE transactions
      SET status = $1, confirmed_at = $2, updated_at = $3
      WHERE coinbase_charge_id = $4
    `;

    await this.ensureConnection();
    await this.db.query(query, [
      status,
      confirmedAt || null,
      new Date(),
      coinbaseChargeId,
    ]);

    logger.info("Transaction status updated", { coinbaseChargeId, status });
  }

  async findTransactionByChargeId(
    coinbaseChargeId: string
  ): Promise<Transaction | null> {
    const query = "SELECT * FROM transactions WHERE coinbase_charge_id = $1";
    await this.ensureConnection();
    const result = await this.db.query(query, [coinbaseChargeId]);

    if (result.rows && result.rows.length > 0) {
      return result.rows[0] as Transaction;
    }

    return null;
  }

  /**
   * Gets the transaction statistics
   * @returns The transaction statistics
   */
  async getTransactionStats(): Promise<{
    total: number;
    pending: number;
    completed: number;
    failed: number;
  }> {
    const query = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM transactions
    `;

    await this.ensureConnection();
    const result = await this.db.query(query);
    return result.rows[0];
  }
}
