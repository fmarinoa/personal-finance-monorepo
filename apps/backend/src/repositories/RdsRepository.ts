import { Expense } from "@/domains";

export interface RdsRepository {
  create( userId: string,expense: Expense): Promise<Expense>;
  list(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<{ items: Expense[]; total: number }>;
  update(
    userId: string,
    expense: Expense,
  ): Promise<Expense | null>;
  delete(userId: string, expenseId: string): Promise<boolean>;
}
