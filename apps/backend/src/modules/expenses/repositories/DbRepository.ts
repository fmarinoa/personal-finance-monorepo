import { Expense, FiltersForList } from "../domains/Expense";

export interface DbRepository {
  create(expense: Expense): Promise<Expense>;
  getById(expense: Expense): Promise<Expense>;
  list(
    userId: string,
    filters: FiltersForList,
  ): Promise<{ data: Expense[]; nextToken?: string }>;
  update(expense: Expense): Promise<Expense>;
  delete(expense: Expense): Promise<void>;
}
