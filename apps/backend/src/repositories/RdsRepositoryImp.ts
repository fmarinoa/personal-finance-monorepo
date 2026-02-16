import { Expense } from "@/domains";
import { RdsRepository } from "./RdsRepository";
import { Pool } from "pg";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

interface DbCredentials {
  username: string;
  password: string;
  host: string;
  port: number;
  dbname: string;
}

export class RdsRepositoryImp implements RdsRepository {
  private pool: Pool | null = null;

  private async getDbCredentials(): Promise<DbCredentials> {
    const secretArn = process.env.DB_SECRET_ARN;
    if (!secretArn) {
      throw new Error("DB_SECRET_ARN environment variable is not set");
    }

    const client = new SecretsManagerClient({});
    const command = new GetSecretValueCommand({ SecretId: secretArn });

    const response = await client.send(command);
    if (!response.SecretString) {
      throw new Error("Secret value is empty");
    }

    return JSON.parse(response.SecretString);
  }

  private async getPool(): Promise<Pool> {
    if (!this.pool) {
      const credentials = await this.getDbCredentials();

      this.pool = new Pool({
        host: credentials.host,
        port: credentials.port,
        database: credentials.dbname,
        user: credentials.username,
        password: credentials.password,
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
    }

    return this.pool;
  }

  async create(userId: string,expense: Expense): Promise<Expense> {
    const pool = await this.getPool();

    const query = `
      SELECT * FROM create_expense($1, $2, $3, $4)
    `;

    const values = [userId, ...expense.getValuesForCreate()];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error(`Failed to create expense: ${JSON.stringify(result)}`);
    }

    const row = result.rows[0];

    return new Expense({
      id: row.id,
      amount: parseFloat(row.amount),
      description: row.description,
      categoryCode: row.category_code,
      date: row.created_at,
    });
  }

  async list(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<{ items: Expense[]; total: number }> {
    const pool = await this.getPool();

    const countQuery = `
      SELECT COUNT(*) as total
      FROM expenses
      WHERE user_id = $1
    `;

    const listQuery = `
      SELECT id, amount, description, category_code, created_at
      FROM expenses
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const [countResult, listResult] = await Promise.all([
      pool.query(countQuery, [userId]),
      pool.query(listQuery, [userId, limit, offset]),
    ]);

    const total = parseInt(countResult.rows[0].total);
    const items = listResult.rows.map(
      (row) =>
        new Expense({
          id: row.id,
          amount: parseFloat(row.amount),
          description: row.description,
          categoryCode: row.category_code,
          date: row.created_at,
        }),
    );

    return { items, total };
  }

  async update(
    userId: string,
    expense: Expense,
  ): Promise<Expense | null> {
    const pool = await this.getPool();

    const query = `
      SELECT * FROM update_expense($1, $2, $3, $4, $5)
    `;

    const values = [
      userId,
      ...expense.getValuesForUpdate(),
      ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return new Expense({
      id: row.id,
      amount: parseFloat(row.amount),
      description: row.description,
      categoryCode: row.category_code,
      date: row.updated_at,
    });
  }

  async delete(userId: string, expenseId: string): Promise<boolean> {
    const pool = await this.getPool();

    const query = `
      SELECT delete_expense($1, $2) as deleted
    `;

    const values = [userId, expenseId];

    const result = await pool.query(query, values);

    return result.rows[0].deleted;
  }
}
