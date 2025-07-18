import { v4 as uuidv4 } from "uuid";
import { config } from "../config/config";
import { createConnection } from "../config/database";
import { CheckoutRequest, Transaction } from "../types";
import { logger } from "../utils/logger";

export class TransactionService {
  private db: any;
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
          15000
        );
      });

      try {
        logger.info("Attempting to initialize database connection...");
        await Promise.race([this.initializeDatabase(), timeoutPromise]);
        logger.info("Database connection established successfully");
      } catch (error) {
        logger.error("Database connection failed or timed out:", {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
        });
        throw new Error(
          `Database connection failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }
  }

  getDatabase() {
    return this.db;
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

    // Use different parameter syntax based on database type
    const isPostgreSQL = config.nodeEnv === "production";
    const query = isPostgreSQL
      ? `
        INSERT INTO transactions (
          id, checkout_id, email, amount, currency, status,
          coinbase_charge_id, coinbase_charge_code, payment_url,
          expires_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `
      : `
        INSERT INTO transactions (
          id, checkout_id, email, amount, currency, status,
          coinbase_charge_id, coinbase_charge_code, payment_url,
          expires_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    const isPostgreSQL = config.nodeEnv === "production";
    const query = isPostgreSQL
      ? `
        UPDATE transactions
        SET status = $1, confirmed_at = $2, updated_at = $3
        WHERE coinbase_charge_id = $4
      `
      : `
        UPDATE transactions
        SET status = ?, confirmed_at = ?, updated_at = ?
        WHERE coinbase_charge_id = ?
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
    const isPostgreSQL = config.nodeEnv === "production";
    const query = isPostgreSQL
      ? "SELECT * FROM transactions WHERE coinbase_charge_id = $1"
      : "SELECT * FROM transactions WHERE coinbase_charge_id = ?";

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

  /**
   * Gets transactions with pagination and filtering
   * @param options - Pagination and filter options
   * @returns Array of transactions
   */
  async getTransactions(options: {
    page: number;
    limit: number;
    offset: number;
    status?: string;
    email?: string;
  }): Promise<Transaction[]> {
    const { page, limit, offset, status, email } = options;

    const isPostgreSQL = config.nodeEnv === "production";

    if (isPostgreSQL) {
      // PostgreSQL with parameterized queries
      let query = "SELECT * FROM transactions";
      const params: any[] = [];
      let paramIndex = 1;
      let hasWhere = false;

      if (status) {
        query += hasWhere ? " AND" : " WHERE";
        query += ` status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
        hasWhere = true;
      }

      if (email) {
        query += hasWhere ? " AND" : " WHERE";
        query += ` email = $${paramIndex}`;
        params.push(email);
        paramIndex++;
        hasWhere = true;
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${
        paramIndex + 1
      }`;
      params.push(limit, offset);

      await this.ensureConnection();
      const result = await this.db.query(query, params);
      return result.rows || [];
    } else {
      // MySQL with string interpolation (safer for this case)
      let query = "SELECT * FROM transactions";
      let hasWhere = false;

      if (status) {
        query += hasWhere ? " AND" : " WHERE";
        query += ` status = '${status.replace(/'/g, "''")}'`;
        hasWhere = true;
      }

      if (email) {
        query += hasWhere ? " AND" : " WHERE";
        query += ` email = '${email.replace(/'/g, "''")}'`;
        hasWhere = true;
      }

      query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

      await this.ensureConnection();
      const result = await this.db.query(query);
      return result.rows || [];
    }
  }

  /**
   * Gets the total count of transactions with optional filters
   * @param options - Filter options
   * @returns Total count
   */
  async getTransactionCount(options: {
    status?: string;
    email?: string;
  }): Promise<number> {
    const { status, email } = options;

    const isPostgreSQL = config.nodeEnv === "production";

    if (isPostgreSQL) {
      // PostgreSQL with parameterized queries
      let query = "SELECT COUNT(*) as count FROM transactions";
      const params: any[] = [];
      let paramIndex = 1;
      let hasWhere = false;

      if (status) {
        query += hasWhere ? " AND" : " WHERE";
        query += ` status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
        hasWhere = true;
      }

      if (email) {
        query += hasWhere ? " AND" : " WHERE";
        query += ` email = $${paramIndex}`;
        params.push(email);
        paramIndex++;
        hasWhere = true;
      }

      await this.ensureConnection();
      const result = await this.db.query(query, params);
      return parseInt(result.rows[0].count) || 0;
    } else {
      // MySQL with string interpolation (safer for this case)
      let query = "SELECT COUNT(*) as count FROM transactions";
      let hasWhere = false;

      if (status) {
        query += hasWhere ? " AND" : " WHERE";
        query += ` status = '${status.replace(/'/g, "''")}'`;
        hasWhere = true;
      }

      if (email) {
        query += hasWhere ? " AND" : " WHERE";
        query += ` email = '${email.replace(/'/g, "''")}'`;
        hasWhere = true;
      }

      await this.ensureConnection();
      const result = await this.db.query(query);
      return parseInt(result.rows[0].count) || 0;
    }
  }

  /**
   * Gets a transaction by its ID
   * @param id - The transaction ID
   * @returns The transaction or null if not found
   */
  async getTransactionById(id: string): Promise<Transaction | null> {
    const isPostgreSQL = config.nodeEnv === "production";
    const query = isPostgreSQL
      ? "SELECT * FROM transactions WHERE id = $1"
      : "SELECT * FROM transactions WHERE id = ?";

    await this.ensureConnection();
    const result = await this.db.query(query, [id]);

    if (result.rows && result.rows.length > 0) {
      return result.rows[0] as Transaction;
    }

    return null;
  }
}
