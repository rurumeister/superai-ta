import { Connection } from "mysql2/promise";
import { v4 as uuidv4 } from "uuid";
import { createConnection } from "../config/database";
import { CheckoutRequest, Transaction } from "../types";
import { logger } from "../utils/logger";

export class TransactionService {
  private db!: Connection;
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
      await this.initializeDatabase();
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.ensureConnection();
    await this.db.execute(query, [
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
      SET status = ?, confirmed_at = ?, updated_at = ?
      WHERE coinbase_charge_id = ?
    `;

    await this.ensureConnection();
    await this.db.execute(query, [
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
    const query = "SELECT * FROM transactions WHERE coinbase_charge_id = ?";
    await this.ensureConnection();
    const [rows] = await this.db.execute(query, [coinbaseChargeId]);

    if (Array.isArray(rows) && rows.length > 0) {
      return rows[0] as Transaction;
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
    const [rows] = await this.db.execute(query);
    return (rows as any[])[0];
  }
}
