import { Expense } from "@/domains";

export interface ExpenseService {
  create(userId: string, expense: Expense): Promise<{ id: string }>;
  list(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<{
    items: Expense[];
    pagination: { limit: number; offset: number; total: number };
  }>;
  update(
    userId: string,
    expense: Expense,
  ): Promise<Expense | null>;
  delete(userId: string, expenseId: string): Promise<boolean>;
}
